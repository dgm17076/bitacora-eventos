#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Script de despliegue para Bitácora de Eventos
# Uso: ./deploy.sh [--repo <url>] [--branch <rama>]
# =============================================================================
set -euo pipefail

# ── Colores para output ───────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

log()  { echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
ok()   { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC}  $1"; }
err()  { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $1" >&2; exit 1; }

# ── Configuración ─────────────────────────────────────────────────────────────
REPO_URL="${REPO_URL:-https://github.com/TU_USUARIO/bitacora-eventos.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/bitacora}"
ENV_FILE="${ENV_FILE:-.env}"

# Parsear argumentos
while [[ $# -gt 0 ]]; do
  case $1 in
    --repo)   REPO_URL="$2"; shift 2 ;;
    --branch) BRANCH="$2";   shift 2 ;;
    --dir)    APP_DIR="$2";  shift 2 ;;
    *) warn "Argumento desconocido: $1"; shift ;;
  esac
done

echo -e "\n${BOLD}════════════════════════════════════════${NC}"
echo -e "${BOLD}   BITÁCORA DE EVENTOS — DEPLOY SCRIPT   ${NC}"
echo -e "${BOLD}════════════════════════════════════════${NC}\n"

# ── 1. Verificar dependencias ─────────────────────────────────────────────────
log "Verificando dependencias del sistema..."

for dep in git docker; do
  if ! command -v "$dep" &>/dev/null; then
    err "$dep no está instalado. Instálalo y vuelve a ejecutar."
  fi
done

# Verificar docker compose (v2)
if docker compose version &>/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE_CMD="docker-compose"
else
  err "docker compose no encontrado. Instala Docker Compose v2."
fi

ok "Dependencias verificadas (compose: $COMPOSE_CMD)"

# ── 2. Clonar o actualizar repositorio ────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  log "Repositorio ya existe en $APP_DIR, actualizando..."
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
  ok "Repositorio actualizado"
else
  log "Clonando repositorio desde $REPO_URL (rama: $BRANCH)..."
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
  ok "Repositorio clonado en $APP_DIR"
fi

# ── 3. Copiar variables de entorno ────────────────────────────────────────────
if [ -f "$ENV_FILE" ] && [ ! -f "$APP_DIR/.env" ]; then
  log "Copiando archivo .env..."
  cp "$ENV_FILE" "$APP_DIR/.env"
  ok ".env copiado"
elif [ ! -f "$APP_DIR/.env" ]; then
  warn "No se encontró .env. Usando valores por defecto del docker-compose.yml"
fi

# ── 4. Crear directorios de volúmenes ─────────────────────────────────────────
log "Preparando directorios..."
mkdir -p "$APP_DIR/logs"
ok "Directorios listos"

# ── 5. Detener contenedores existentes ────────────────────────────────────────
log "Deteniendo contenedores previos si existen..."
$COMPOSE_CMD -f "$APP_DIR/docker-compose.yml" down --remove-orphans 2>/dev/null || true
ok "Contenedores previos detenidos"

# ── 6. Construir imágenes ─────────────────────────────────────────────────────
log "Construyendo imágenes Docker (esto puede tardar unos minutos)..."
$COMPOSE_CMD -f "$APP_DIR/docker-compose.yml" build --no-cache
ok "Imágenes construidas"

# ── 7. Levantar contenedores ──────────────────────────────────────────────────
log "Iniciando contenedores..."
$COMPOSE_CMD -f "$APP_DIR/docker-compose.yml" up -d
ok "Contenedores iniciados"

# ── 8. Verificar salud de servicios ──────────────────────────────────────────
log "Esperando que los servicios estén listos..."
sleep 15

SERVICES=(mongo backend frontend)
for svc in "${SERVICES[@]}"; do
  STATUS=$($COMPOSE_CMD -f "$APP_DIR/docker-compose.yml" ps --status running "$svc" 2>/dev/null | grep -c "$svc" || true)
  if [ "$STATUS" -gt 0 ]; then
    ok "Servicio '$svc' activo"
  else
    warn "Servicio '$svc' no está corriendo — revisa los logs con:"
    echo "    $COMPOSE_CMD -f $APP_DIR/docker-compose.yml logs $svc"
  fi
done

# ── 9. Mostrar resumen ────────────────────────────────────────────────────────
PUBLIC_IP=$(curl -s --max-time 3 http://checkip.amazonaws.com 2>/dev/null || echo "localhost")

echo -e "\n${BOLD}════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}   ✓ DESPLIEGUE COMPLETADO${NC}"
echo -e "${BOLD}════════════════════════════════════════${NC}"
echo -e "  Aplicación: ${CYAN}http://${PUBLIC_IP}:80${NC}"
echo -e "  API:        ${CYAN}http://${PUBLIC_IP}:3001${NC}"
echo -e "  Logs:       ${APP_DIR}/logs/app.log"
echo -e "  Fecha:      $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${BOLD}════════════════════════════════════════${NC}\n"
