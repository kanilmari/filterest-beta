#!/usr/bin/env bash
# project_bridges.sh
# Creates local Go build bridges from Easelect into the dynamically configured
# private project home. The external project folders remain the only source of
# truth; the bridge paths are ignored by Git and excluded from Docker's primary
# build context.

easelect_prepare_project_bridges() {
    local project_root="${1:-${PROJECT_ROOT:-}}"
    local projects_home="${FILTEREST_PROJECTS_HOME:-}"
    local project_name=""
    local project_target=""
    local bridge_path=""
    local current_target=""

    [[ -n "$project_root" ]] || {
        echo "error: Easelect project root is required for project bridges" >&2
        return 1
    }

    # Public Filterest does not ship the private activation file or private app
    # registry, so it must never materialize Easelect-only project bridges.
    if [[ ! -f "$project_root/VERSION_EASELECT" || ! -f "$project_root/private_apps.go" ]]; then
        return 0
    fi

    [[ -n "$projects_home" && "$projects_home" == /* ]] || {
        echo "error: the resolved project storage folder is not an absolute path" >&2
        return 1
    }
    [[ -d "$project_root/apps" ]] || {
        echo "error: Easelect private app bridge folder is missing: $project_root/apps" >&2
        return 1
    }

    for project_name in regfetch tukisuu; do
        project_target="$projects_home/$project_name"
        bridge_path="$project_root/apps/$project_name"

        # During the one-time migration the original tracked directory may
        # still exist. Never replace or remove a real directory automatically.
        if [[ -e "$bridge_path" && ! -L "$bridge_path" ]]; then
            continue
        fi

        if [[ ! -d "$project_target" || -L "$project_target" ]]; then
            if [[ -L "$bridge_path" ]]; then
                echo "error: project bridge target is missing or unsafe: $project_target" >&2
                return 1
            fi
            continue
        fi

        if [[ -L "$bridge_path" ]]; then
            current_target="$(readlink -f "$bridge_path" 2>/dev/null || true)"
            if [[ "$current_target" == "$project_target" ]]; then
                continue
            fi
            unlink "$bridge_path"
        fi

        ln -s "$project_target" "$bridge_path"
    done
}
