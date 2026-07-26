#!/usr/bin/env bash
# easelect_private_paths.sh
# Resolves native Easelect env and TLS files from one protected external key root.
# Bridges repo-local tooling with ../filterest_keys while keeping generated Filterest local.
# Exists so Easelect does not need secret-bearing compatibility files or symlinks in repo root.

easelect_is_private_source_checkout() {
    local project_root="$1"
    [[ -e "$project_root/.git" && -f "$project_root/VERSION_EASELECT" ]]
}

_easelect_validate_external_key_root() {
    local project_root="$1"
    local key_root="$2"

    case "$key_root" in
        /*) ;;
        *)
            printf 'error: EASELECT_KEY_ROOT must be an absolute path outside the Easelect repository\n' >&2
            return 1
            ;;
    esac

    case "$key_root" in
        *"/../"*|*/..|*"/./"*|*/.)
            printf 'error: EASELECT_KEY_ROOT must be normalized without . or .. path segments\n' >&2
            return 1
            ;;
    esac

    key_root="${key_root%/}"
    case "$key_root/" in
        "$project_root/"*)
            printf 'error: EASELECT_KEY_ROOT must stay outside the Easelect repository\n' >&2
            return 1
            ;;
    esac
}

# Resolves the four derived private paths without reading secret-bearing files.
# Generated Filterest checkouts deliberately keep their own root-local runtime files.
easelect_resolve_private_paths() {
    local project_root="$1"
    local key_root=""
    local development_root=""

    if easelect_is_private_source_checkout "$project_root"; then
        key_root="${EASELECT_KEY_ROOT:-$(cd "$project_root/.." && pwd -P)/filterest_keys}"
        _easelect_validate_external_key_root "$project_root" "$key_root" || return 1
        key_root="${key_root%/}"
        development_root="$key_root/easelect_development"

        EASELECT_RUNTIME_ENV_FILE="$development_root/runtime_environment.env"
        EASELECT_DEV_ENV_FILE="$development_root/development_environment.env"
        EASELECT_TLS_CERT_FILE="$development_root/local_tls_certificate/localhost_certificate.crt"
        EASELECT_TLS_KEY_FILE="$development_root/local_tls_certificate/localhost_private_key.key"
    else
        EASELECT_RUNTIME_ENV_FILE="$project_root/.env"
        EASELECT_DEV_ENV_FILE="$project_root/dev_env.txt"
        EASELECT_TLS_CERT_FILE="$project_root/dev-cert.crt"
        EASELECT_TLS_KEY_FILE="$project_root/dev-cert.key"
    fi

    export EASELECT_RUNTIME_ENV_FILE
    export EASELECT_DEV_ENV_FILE
    export EASELECT_TLS_CERT_FILE
    export EASELECT_TLS_KEY_FILE
}
