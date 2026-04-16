# 📋 Bitácora de Eventos

Sistema de registro y monitoreo de eventos del servidor — proyecto DevOps con frontend React, backend Node.js/Express y base de datos MongoDB, contenerizado con Docker y desplegable en AWS EC2.

---

## 🏗️ Arquitectura

```
Usuario → EC2 → Docker Network (bitacora-net)
                    ├── Frontend  (nginx:alpine  · puerto 80)
                    ├── Backend   (node:20-alpine · puerto 3001)
                    └── MongoDB   (mongo:7        · interno)

EC2 → S3 Bucket (logs y backups)
```

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js 20 + Express 4 |
| Base de datos | MongoDB 7 + Mongoose |
| Logging | Winston → `/app/logs/app.log` |
| Contenedores | Docker + Docker Compose v2 |
| Nube | AWS EC2 (t2.micro) + S3 |
| IaC | AWS CloudFormation |

## 📁 Estructura del Proyecto

```
project/
├── backend/
│   ├── src/
│   │   ├── server.js         # App principal Express
│   │   ├── logger.js         # Winston logger
│   │   ├── models/Event.js   # Schema MongoDB
│   │   └── routes/
│   │       ├── events.js     # CRUD de eventos
│   │       └── stats.js      # Estadísticas
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Routing + Layout
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx # KPIs + actividad reciente
│   │   │   ├── EventList.jsx # Tabla con filtros y paginación
│   │   │   └── NewEvent.jsx  # Formulario de registro
│   │   └── api.js            # Cliente Axios
│   ├── Dockerfile
│   └── vite.config.js
├── cloudformation/
│   └── template.yaml         # EC2 + S3 + Security Group + IAM
├── docker-compose.yml
├── deploy.sh                 # Despliegue completo
├── start_app.sh              # Inicio (usado en cron)
├── stop_app.sh               # Apagado + backup S3 (usado en cron)
└── README.md
```

## 🚀 Ejecución Local

### Prerrequisitos
- Docker Desktop instalado y corriendo
- Git

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/bitacora-eventos.git
cd bitacora-eventos

# 2. (Opcional) Configurar variables de entorno
cp backend/.env.example .env
# Editar .env si necesitas credenciales AWS

# 3. Levantar todos los contenedores
docker compose up --build -d

# 4. Verificar que estén corriendo
docker compose ps
```

La aplicación estará disponible en:
- **Frontend:** http://localhost:80
- **API:** http://localhost:3001
- **Health check:** http://localhost:3001/health

### Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f backend

# Ver logs de la aplicación
docker exec bitacora-backend cat /app/logs/app.log

# Detener todo
docker compose down

# Detener y borrar volúmenes (BD incluida)
docker compose down -v
```

---

## ☁️ Despliegue en EC2

### Paso 1 — Crear infraestructura con CloudFormation

```bash
aws cloudformation create-stack \
  --stack-name bitacora-stack \
  --template-body file://cloudformation/template.yaml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=MI_KEYPAIR \
    ParameterKey=YourIP,ParameterValue=$(curl -s checkip.amazonaws.com)/32 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Obtener la IP pública una vez creado el stack
aws cloudformation describe-stacks \
  --stack-name bitacora-stack \
  --query 'Stacks[0].Outputs'
```

### Paso 2 — Conectarse a la instancia

```bash
chmod 400 MI_KEYPAIR.pem
ssh -i MI_KEYPAIR.pem ec2-user@<IP_PUBLICA_EC2>
```

### Paso 3 — Ejecutar deploy.sh en EC2

```bash
# En la instancia EC2:
curl -O https://raw.githubusercontent.com/TU_USUARIO/bitacora-eventos/main/deploy.sh
chmod +x deploy.sh
REPO_URL=https://github.com/TU_USUARIO/bitacora-eventos.git ./deploy.sh
```

La aplicación quedará disponible en: `http://<IP_PUBLICA_EC2>:80`

### Paso 4 — Configurar cron para inicio/apagado automático

```bash
# Editar crontab
crontab -e

# Añadir estas líneas (lunes–viernes, encender 8am / apagar 8pm hora UTC-6):
# Encender a las 8:00 AM (hora local UTC-6 = 14:00 UTC)
0 14 * * 1-5 /opt/bitacora/start_app.sh >> /var/log/bitacora-cron.log 2>&1
# Apagar a las 8:00 PM (hora local UTC-6 = 02:00 UTC del día siguiente)
0 2 * * 2-6 /opt/bitacora/stop_app.sh >> /var/log/bitacora-cron.log 2>&1
```

---

## 🔌 Puertos

| Puerto | Servicio | Acceso |
|--------|---------|--------|
| 80 | Frontend (nginx) | Público |
| 3001 | Backend API | Público |
| 27017 | MongoDB | Interno (solo red Docker) |

## 📊 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/events` | Listar eventos (con filtros y paginación) |
| POST | `/api/events` | Crear evento |
| PUT | `/api/events/:id` | Actualizar evento |
| PATCH | `/api/events/:id/resolve` | Marcar como resuelto |
| DELETE | `/api/events/:id` | Eliminar evento |
| GET | `/api/stats` | Estadísticas del dashboard |
| GET | `/health` | Health check |

## 📝 Logs Generados

Los logs se generan en `/app/logs/app.log` dentro del contenedor backend con el formato:

```
[2026-04-09 10:00:00] INFO : Servidor iniciado en puerto 3001
[2026-04-09 10:00:01] INFO : Conexión a MongoDB establecida
[2026-04-09 10:02:10] INFO : Consulta realizada: 15 eventos obtenidos
[2026-04-09 10:05:33] INFO : Nuevo evento registrado: [ERROR] "Fallo en servicio X"
[2026-04-09 10:06:00] ERROR: Fallo en conexión a base de datos: ECONNREFUSED
```

El script `stop_app.sh` sube automáticamente los logs al bucket S3 configurado.
