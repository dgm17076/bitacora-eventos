#!/usr/bin/env bash
# =============================================================================
# stop_app.sh — Detiene los contenedores de Bitácora de Eventos
# Cron ejemplo: 0 20 * * 1-5 /opt/bitacora/stop_app.sh >> /var/log/bitacora-cron.log 2>&1
# =============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/bitacora}"
LOG_FILE="${LOG_FILE:-/var/log/bitacora-cron.log}"
S3_BUCKET="${S3_BUCKET:-}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

log "═══ STOP_APP.SH INICIADO ═══"

if docker compose version &>/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  log "ERROR: docker compose no encontrado"
  exit 1
fi

cd "$APP_DIR"

# Subir logs a S3 antes de detener (si está configurado)
if [ -n "$S3_BUCKET" ] && command -v aws &>/dev/null; then
  log "INFO: Subiendo logs a S3 (s3://$S3_BUCKET/logs/)..."
  TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
  if aws s3 cp "$APP_DIR/logs/" "s3://$S3_BUCKET/logs/$TIMESTAMP/" --recursive 2>/dev/null; then
    log "OK: Logs subidos a S3"
  else
    log "WARN: No se pudieron subir los logs a S3"
  fi
fi

log "INFO: Deteniendo contenedores..."
$COMPOSE stop

log "OK: Contenedores detenidos"
log "═══ STOP_APP.SH FINALIZADO ═══"
