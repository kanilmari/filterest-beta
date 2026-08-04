#!/usr/bin/env bash
# filterest_port_preflight.sh
# Detects an occupied Filterest application port before server startup.
# Shows a minimal process identity and offers a graceful, owner-safe stop.

filterest_configured_port() {
    local default_port="$1"
    shift
    local file=""
    local key=""
    local value=""

    for file in "$@"; do
        [[ -f "$file" ]] || continue
        for key in APP_PORT PORT EASELECT_PORT; do
            value="$(grep -E "^${key}=" "$file" 2>/dev/null | tail -1 | cut -d'=' -f2- || true)"
            if [[ -n "$value" ]]; then
                printf '%s' "$value"
                return 0
            fi
        done
    done
    printf '%s' "$default_port"
}

filterest_port_is_listening() {
    local port="$1"
    local listeners=""

    if command -v ss >/dev/null 2>&1; then
        if listeners="$(ss -H -ltn "sport = :${port}" 2>/dev/null)"; then
            [[ -n "$listeners" ]]
            return
        fi
    fi
    if command -v lsof >/dev/null 2>&1; then
        lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
        return
    fi
    if command -v fuser >/dev/null 2>&1; then
        fuser -n tcp "$port" >/dev/null 2>&1
        return
    fi

    printf 'error: cannot check Filterest port %s; install ss, lsof, or fuser\n' "$port" >&2
    return 2
}

filterest_port_listener_pids() {
    local port="$1"

    if command -v lsof >/dev/null 2>&1; then
        lsof -nP -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | LC_ALL=C sort -nu
        return
    fi
    if command -v ss >/dev/null 2>&1; then
        ss -H -ltnp "sport = :${port}" 2>/dev/null \
            | grep -oE 'pid=[0-9]+' \
            | cut -d= -f2 \
            | LC_ALL=C sort -nu
        return
    fi
    if command -v fuser >/dev/null 2>&1; then
        fuser -n tcp "$port" 2>/dev/null \
            | tr ' ' '\n' \
            | grep -E '^[0-9]+$' \
            | LC_ALL=C sort -nu
        return
    fi
    return 2
}

filterest_print_listener_identity() {
    local pid="$1"
    local owner=""
    local command_name=""
    local executable=""

    owner="$(ps -o user= -p "$pid" 2>/dev/null | awk '{$1=$1; print}' || true)"
    command_name="$(ps -o comm= -p "$pid" 2>/dev/null | awk '{$1=$1; print}' || true)"
    executable="$(readlink -f "/proc/${pid}/exe" 2>/dev/null || true)"
    printf '  PID %s | user %s | command %s' \
        "$pid" "${owner:-unknown}" "${command_name:-unknown}"
    if [[ -n "$executable" ]]; then
        printf ' | executable %s' "$executable"
    fi
    printf '\n'
}

filterest_listener_pids_are_owned_by_current_user() {
    local pids="$1"
    local current_uid=""
    local pid=""
    local process_uid=""
    current_uid="$(id -u)"

    for pid in $pids; do
        [[ "$pid" =~ ^[0-9]+$ ]] || continue
        process_uid="$(ps -o uid= -p "$pid" 2>/dev/null | tr -d '[:space:]' || true)"
        if [[ -z "$process_uid" || "$process_uid" != "$current_uid" ]]; then
            return 1
        fi
    done
    return 0
}

filterest_stop_listener_pids() {
    local port="$1"
    local pids="$2"
    local pid=""
    local attempt=0
    local listening_status=0

    for pid in $pids; do
        [[ "$pid" =~ ^[0-9]+$ ]] || continue
        kill -TERM "$pid" 2>/dev/null || true
    done

    while (( attempt < 100 )); do
        listening_status=0
        filterest_port_is_listening "$port" || listening_status=$?
        case "$listening_status" in
            0) ;;
            1)
                printf 'Port %s is free. Continuing Filterest startup.\n' "$port"
                return 0
                ;;
            *) return 1 ;;
        esac
        sleep 0.1
        attempt=$((attempt + 1))
    done

    printf 'error: port %s is still in use after a graceful stop request\n' "$port" >&2
    return 1
}

filterest_preflight_port() {
    local port="$1"
    local pids=""
    local pid=""
    local answer=""
    local listening_status=0

    if [[ ! "$port" =~ ^[1-9][0-9]{0,4}$ ]] || (( port > 65535 )); then
        printf 'error: invalid Filterest application port: %s\n' "$port" >&2
        return 1
    fi
    filterest_port_is_listening "$port" || listening_status=$?
    case "$listening_status" in
        0) ;;
        1) return 0 ;;
        *) return 1 ;;
    esac

    printf '\nFilterest cannot start because application port %s is already in use.\n' "$port"
    pids="$(filterest_port_listener_pids "$port" || true)"
    if [[ -z "$pids" ]]; then
        printf 'error: the listening process could not be identified safely; stop it manually or choose another port\n' >&2
        return 1
    fi
    for pid in $pids; do
        [[ "$pid" =~ ^[0-9]+$ ]] || continue
        filterest_print_listener_identity "$pid"
    done

    if ! filterest_listener_pids_are_owned_by_current_user "$pids"; then
        printf 'error: Filterest will not stop a process owned by another user; stop it manually or choose another port\n' >&2
        return 1
    fi
    if [[ ! -t 0 ]]; then
        printf 'error: run ./filterest start in an interactive terminal to approve freeing port %s\n' "$port" >&2
        return 1
    fi

    printf 'Stop the process(es) above and free port %s? [y/N] ' "$port"
    read -r answer || answer=""
    case "$answer" in
        y|Y|yes|YES)
            filterest_stop_listener_pids "$port" "$pids"
            ;;
        *)
            printf 'Filterest startup cancelled; port %s was left unchanged.\n' "$port" >&2
            return 1
            ;;
    esac
}
