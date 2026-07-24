#!/usr/bin/env bash
# scaffold.sh
# Creates .env.scaffold templates and prepares runtime directories for a clone.
# Bridges repository env templates, instance folders, and local setup placeholders.
# Exists to keep scaffold-only setup separate from DB bootstrap and machine handover.

set -euo pipefail

# ---------------------------------------------------------------------------
# Väritulosteet
# ---------------------------------------------------------------------------
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}✓${RESET} $*"; }
skip() { echo -e "${YELLOW}–${RESET} $*"; }
err()  { echo -e "${RED}✗${RESET} $*" >&2; }
info() { echo -e "${CYAN}→${RESET} $*"; }

# ---------------------------------------------------------------------------
# Navigoi projektin juureen (SCRIPT_DIR:n avulla)
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$PROJECT_ROOT/server_tools/ctl/lib/env_permissions.sh"
cd "$PROJECT_ROOT"

# ---------------------------------------------------------------------------
# .env-tiedostot joita käsitellään
# ---------------------------------------------------------------------------
ENV_FILES=(
  ".env"
  "instances/serlog.com/.env"
)

# ---------------------------------------------------------------------------
# Apufunktio: Luo .env.scaffold yhdestä .env-tiedostosta
# Säilyttää kommentit, tyhjentää arvot. Tukee monirivisiä single-quoted arvoja.
# ---------------------------------------------------------------------------
generate_scaffold_for_file() {
  local src="$1"
  local dst="${src%.env}.env.scaffold"
  # Varmista, että lähdetiedosto on olemassa
  if [[ ! -f "$src" ]]; then
    skip "$src ei löydy — ohitetaan"
    return
  fi

  local in_multiline=0

  # Käsittele tiedosto rivi riviltä
  {
    while IFS= read -r line || [[ -n "$line" ]]; do
      # Olemme monirivisen single-quoted arvon sisällä
      if [[ $in_multiline -eq 1 ]]; then
        # Etsi sulkeva heittomerkki
        if [[ "$line" == *"'" ]]; then
          in_multiline=0
        fi
        # Älä tulosta sisältöä — arvo on jo tyhjennetty
        continue
      fi

      # Kommentti tai tyhjä rivi — tulosta sellaisenaan
      if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "${line// /}" ]]; then
        echo "$line"
        continue
      fi

      # Monirivi single-quoted arvo: KEY='...(ei sulkevaa heittomerkkiä tällä rivillä)
      if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=\'[^\']*$ ]]; then
        local key="${BASH_REMATCH[1]}"
        echo "${key}="
        in_multiline=1
        continue
      fi

      # Normaali KEY=value tai KEY='value' tai KEY="value" — tyhjennä arvo
      if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)= ]]; then
        local key="${BASH_REMATCH[1]}"
        echo "${key}="
        continue
      fi

      # Muu rivi (esim. jatkuminen) — tulostetaan sellaisenaan
      echo "$line"
    done
  } < "$src" > "$dst"

  ok "Generoitu: $dst"
}

# ---------------------------------------------------------------------------
# GENERATE: Luo .env.scaffold-tiedostot toimivalla koneella
# ---------------------------------------------------------------------------
cmd_generate() {
  echo ""
  info "Generoidaan .env.scaffold-tiedostot..."
  echo ""
  for env_file in "${ENV_FILES[@]}"; do
    generate_scaffold_for_file "$env_file"
  done
  echo ""
  ok "Valmis. Lisää .env.scaffold-tiedostot versionhallintaan (jos ei vielä lisätty)."
  echo ""
}

# ---------------------------------------------------------------------------
# SETUP: Alustaa uuden kloonin
# ---------------------------------------------------------------------------
cmd_setup() {
  echo ""
  info "Alustetaan projekti uudelle koneelle..."
  echo ""

  # --- 1. Luo tarvittavat hakemistot ---
  info "Luodaan hakemistot..."

  local dirs=(
    "storage"
    "storage_deleted"
    "data/others"
    "data/db_backups"
    "testing/test-results"
    "testing/test-results-visual"
    "testing/my-test-results"
    "testing/playwright-report"
    "server_tools/delivery_chain/helpers/patch_history"
    ".queen"
    "docker/traefik/logs"
    "testing/e2e/.auth"
  )

  for dir in "${dirs[@]}"; do
    if [[ -d "$dir" ]]; then
      skip "Hakemisto jo olemassa: $dir"
    else
      mkdir -p "$dir"
      ok "Luotu: $dir"
    fi
  done

  # Instance-kohtaiset backup-hakemistot
  for inst in instances/*/; do
    if [[ -d "$inst" ]]; then
      local backup_dir="${inst}backups"
      if [[ -d "$backup_dir" ]]; then
        skip "Hakemisto jo olemassa: $backup_dir"
      else
        mkdir -p "$backup_dir"
        ok "Luotu: $backup_dir"
      fi
    fi
  done

  echo ""

  # --- 2. Kopioi .env.scaffold → .env jos .env puuttuu ---
  info "Tarkistetaan .env-tiedostot..."

  local env_created=0
  local env_skipped=0
  local env_missing=0

  for env_file in "${ENV_FILES[@]}"; do
    local scaffold="${env_file%.env}.env.scaffold"

    if [[ ! -f "$scaffold" ]]; then
      skip "Scaffold puuttuu: $scaffold (ohitetaan)"
      (( env_missing++ )) || true
      continue
    fi

    if [[ -f "$env_file" ]]; then
      skip ".env jo olemassa — ei ylikirjoiteta: $env_file"
      warn_secret_env_file_permissions "$env_file" "scaffold setup"
      (( env_skipped++ )) || true
    else
      cp "$scaffold" "$env_file"
      set_secret_env_file_permissions "$env_file"
      ok "Kopioitu scaffold → $env_file"
      (( env_created++ )) || true
    fi
  done

  if [[ -f "dev_env.scaffold" ]]; then
    if [[ -f "dev_env.txt" ]]; then
      skip "dev_env.txt jo olemassa — ei ylikirjoiteta"
      warn_secret_env_file_permissions "dev_env.txt" "scaffold setup"
      (( env_skipped++ )) || true
    else
      cp "dev_env.scaffold" "dev_env.txt"
      set_secret_env_file_permissions "dev_env.txt"
      ok "Kopioitu dev_env.scaffold → dev_env.txt"
      (( env_created++ )) || true
    fi
  fi

  # --- 3. Yhteenveto ---
  echo ""
  echo -e "${CYAN}========================================${RESET}"
  echo -e "${CYAN} Yhteenveto${RESET}"
  echo -e "${CYAN}========================================${RESET}"
  echo "  .env-tiedostot luotu:      $env_created"
  echo "  .env-tiedostot ohitettu:   $env_skipped"
  echo "  Scaffold puuttui:          $env_missing"
  echo ""
  if [[ $env_created -gt 0 ]]; then
    echo -e "${YELLOW}Muista täyttää arvot .env-tiedostoihin ennen palvelimen käynnistystä!${RESET}"
    echo ""
  fi
  ok "Alustus valmis."
  echo ""
}

# ---------------------------------------------------------------------------
# EXPORT: Retired compatibility command.
# ---------------------------------------------------------------------------
cmd_export() {
  err "scaffold.sh export on poistettu käytöstä rinnakkaisena käsinsiirtopolkuna."
  echo "Käytä koneen siirtoon: ./server_tools/migrate_to_new_machine.sh --export"
  echo "Fresh clone -alustukseen käytä: ./server_tools/scaffold.sh setup"
  return 2
}

# ---------------------------------------------------------------------------
# --help
# ---------------------------------------------------------------------------
cmd_help() {
  cat <<EOF

${CYAN}scaffold.sh${RESET} — Projektin käyttöönottoapuri

${CYAN}Käyttö:${RESET}
  ./server_tools/scaffold.sh generate   Luo .env.scaffold-tiedostot (toimivalla koneella)
  ./server_tools/scaffold.sh setup      Alustaa kloonin uudella koneella
  ./server_tools/scaffold.sh --help     Näytä tämä ohje

${CYAN}Työnkulku:${RESET}
  1. Toimivalla koneella: ${GREEN}./server_tools/scaffold.sh generate${RESET}
     → Luo .env.scaffold-tiedostot joissa avaimet mutta ei arvoja
     → Lisää ne versionhallintaan

  2. Uudella koneella kloonin jälkeen: ${GREEN}./server_tools/scaffold.sh setup${RESET}
     → Luo tarvittavat hakemistot
     → Kopioi .env.scaffold → .env (vain jos .env ei vielä ole)
     → Täytä sitten arvot .env-tiedostoihin käsin

  Koneen siirto dumppeineen ja sertifikaatteineen: ${GREEN}./server_tools/migrate_to_new_machine.sh --export${RESET}

EOF
}

# ---------------------------------------------------------------------------
# Pääohjelma
# ---------------------------------------------------------------------------
case "${1:-}" in
  generate) cmd_generate ;;
  setup)    cmd_setup ;;
  export)   cmd_export ;;
  --help|-h|help) cmd_help ;;
  *)
    err "Tuntematon komento: '${1:-}'"
    cmd_help
    exit 1
    ;;
esac
