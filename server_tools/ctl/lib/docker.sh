#!/bin/bash
# ==============================================================================
# docker.sh: Docker mode for Easelect Control CLI
#
# Starts Easelect in Docker containers.
# ==============================================================================

# ------------------------------------------------------------------------------
# Docker mode
# ------------------------------------------------------------------------------
start_docker() {
    docker_query_public_table_count() {
        docker exec easelect-db-dev psql -U admin_user -d easelect -tAc \
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d '[:space:]'
    }

    docker_import_sql_file() {
        local import_label="$1"
        local sql_file="$2"
        local log_file=""

        log_file="$(mktemp)"
        if ! docker exec -i easelect-db-dev psql -v ON_ERROR_STOP=1 -U admin_user -d easelect < "$sql_file" >"$log_file" 2>&1; then
            echo -e "${RED}❌ ${import_label} failed.${NC}"
            echo "   First diagnostics:"
            grep -E "^(ERROR|psql:|NOTICE:)" "$log_file" | head -20 | sed 's/^/   /' || sed -n '1,20p' "$log_file" | sed 's/^/   /'
            rm -f "$log_file"
            exit 1
        fi
        rm -f "$log_file"
    }

    echo -e "${BLUE}🐳 Starting Easelect in Docker...${NC}"
    
    check_env_file
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not found. Please install Docker Desktop.${NC}"
        exit 1
    fi
    
    if ! docker info &> /dev/null 2>&1; then
        echo -e "${RED}❌ Docker daemon not running. Start Docker Desktop.${NC}"
        exit 1
    fi
    
    # Stop conflicting processes
    check_port_available
    
    # Start containers
    echo "🐳 Starting Docker containers..."
    docker-compose -f docker/docker-compose.dev.yml down 2>/dev/null || true
    docker-compose -f docker/docker-compose.dev.yml up -d --build
    
    echo "⏳ Waiting for database..."
    sleep 5
    
    # Restore database if requested
    if [[ "$RESTORE_DB" == true ]]; then
        # Find most recent dump: check data/db_backups/ first, then project root (legacy)
        local dump_file
        local bootstrap_zip=""
        local bootstrap_password=""
        local bootstrap_tmp_dir=""
        local config_count=""
        local existing_public_tables=""
        dump_file=$(ls -t data/db_backups/easelect_full_dump_*.sql data/db_backups/easelect_full_dump.sql easelect_full_dump_*.sql easelect_full_dump.sql 2>/dev/null | head -1)
        existing_public_tables="$(docker_query_public_table_count)"
        if [[ -n "$existing_public_tables" && "$existing_public_tables" != "0" ]]; then
            echo -e "${RED}❌ Docker database already contains ${existing_public_tables} public tables.${NC}"
            echo "   --restore-db expects a fresh DB volume so the import does not collide with existing objects."
            echo "   Recreate the DB volume first, for example:"
            echo "   docker-compose -f docker/docker-compose.dev.yml down -v"
            exit 1
        fi

        if [[ -n "$dump_file" ]]; then
            echo "📦 Restoring database from ${dump_file}..."
            docker_import_sql_file "Docker dump restore" "$dump_file"
            config_count="$(docker exec easelect-db-dev psql -U admin_user -d easelect -tAc "SELECT COUNT(*) FROM system_config;" 2>/dev/null | tr -d '[:space:]')"
            if [[ -z "$config_count" || "$config_count" == "0" ]]; then
                echo -e "${RED}❌ Restore verification failed: system_config has no rows after dump import.${NC}"
                exit 1
            fi
            docker-compose -f docker/docker-compose.dev.yml restart app
        else
            bootstrap_zip="$(current_bootstrap_seed_zip_path 2>/dev/null || true)"
            if [[ -n "$bootstrap_zip" ]]; then
                command -v unzip >/dev/null 2>&1 || {
                    echo -e "${RED}❌ unzip not found. Install unzip to restore from the committed bootstrap zip.${NC}"
                    exit 1
                }
                bootstrap_password="$(read_bootstrap_seed_password || true)"
                if [[ -z "$bootstrap_password" ]]; then
                    echo -e "${RED}❌ Bootstrap zip password missing.${NC}"
                    echo "Expected gitignored local file: $(bootstrap_seed_password_file_path)"
                    exit 1
                fi

                bootstrap_tmp_dir="$(mktemp -d)"
                trap 'rm -rf "${bootstrap_tmp_dir:-}"' EXIT

                echo "📦 Restoring database from committed bootstrap zip ${bootstrap_zip}..."
                if ! extract_bootstrap_seed_zip "$bootstrap_zip" "$bootstrap_tmp_dir" "$bootstrap_password"; then
                    echo -e "${RED}❌ Failed to extract bootstrap zip. Check the password file.${NC}"
                    exit 1
                fi

                [[ -f "${bootstrap_tmp_dir}/schema.sql" ]] || { echo -e "${RED}❌ bootstrap zip missing schema.sql${NC}"; exit 1; }
                [[ -f "${bootstrap_tmp_dir}/seed_data.sql" ]] || { echo -e "${RED}❌ bootstrap zip missing seed_data.sql${NC}"; exit 1; }

                docker_import_sql_file "Docker bootstrap schema restore" "${bootstrap_tmp_dir}/schema.sql"
                docker_import_sql_file "Docker bootstrap seed restore" "${bootstrap_tmp_dir}/seed_data.sql"
                config_count="$(docker exec easelect-db-dev psql -U admin_user -d easelect -tAc "SELECT COUNT(*) FROM system_config;" 2>/dev/null | tr -d '[:space:]')"
                if [[ -z "$config_count" || "$config_count" == "0" ]]; then
                    echo -e "${RED}❌ Restore verification failed: system_config has no rows after bootstrap import.${NC}"
                    exit 1
                fi
                docker-compose -f docker/docker-compose.dev.yml restart app
            else
                echo -e "${RED}❌ No database dump or committed bootstrap zip found for --restore-db${NC}"
                exit 1
            fi
        fi
    fi
    
    # Wait for app startup (Go compilation takes time)
    echo "⏳ Waiting for application (may take ~60s on first run)..."
    for i in {1..120}; do
        if curl -k -s -o /dev/null https://localhost:${PORT}/ --max-time 2 2>/dev/null; then
            break
        fi
        if (( i % 10 == 0 )); then
            echo "   Still waiting... (${i}s)"
        fi
        sleep 1
    done
    
    if curl -k -s -o /dev/null https://localhost:${PORT}/ --max-time 2 2>/dev/null; then
        print_success "docker"
    else
        echo -e "${RED}❌ Application failed to start${NC}"
        echo "Check logs: docker logs easelect-dev"
        exit 1
    fi
}
