#!/usr/bin/env bash
# =============================================================================
# start_app.sh — Inicia los contenedores de Bitácora de Eventos
# Cron ejemplo: 0 8 * * 1-5 /opt/bitacora/start_app.sh >> /var/log/bitacora-cron.log 2>&1
# =============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/bitacora}"
LOG_FILE="${LOG_FILE:-/var/log/bitacora-cron.log}"

CYAN='\033[0;36m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

log "═══ START_APP.SH INICIADO ═══"

# Verificar docker compose
if docker compose version &>/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  log "ERROR: docker compose no encontrado"
  exit 1
fi

cd "$APP_DIR"

# Verificar si ya está corriendo
RUNNING=$($COMPOSE ps --status running 2>/dev/null | grep -c "Up" || echo "0")
if [ "$RUNNING" -gt 2 ]; then
  log "INFO: Los contenedores ya están corriendo ($RUNNING activos)"
  exit 0
fi

log "INFO: Iniciando contenedores..."
$COMPOSE up -d

sleep 8

STARTED=$($COMPOSE ps --status running 2>/dev/null | grep -c "Up" || echo "0")
log "INFO: $STARTED contenedores activos tras el inicio"

if [ "$STARTED" -ge 3 ]; then
  log "OK: Aplicación iniciada correctamente"
else
  log "WARN: Algunos contenedores no iniciaron — revisar logs"
fi

log "═══ START_APP.SH FINALIZADO ═══"
