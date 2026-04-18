# Bitácora de Eventos

Sistema web para el registro y monitoreo de eventos en infraestructura tecnológica. Permite registrar, clasificar y gestionar incidentes en tiempo real con cuatro niveles de severidad: INFO, WARNING, ERROR y CRITICAL.

---

## Descripción

La Bitácora de Eventos es una aplicación web full-stack que simula un sistema de monitoreo operacional real. El equipo de operaciones puede registrar eventos desde cualquier fuente (manual o automatizada), filtrarlos por severidad y categoría, y gestionar su ciclo de vida marcándolos como resueltos.

---

## Arquitectura

```
Usuario
  │
  ▼
EC2 (AWS)
  │
  └── Docker
        ├── Frontend  (puerto 5173)
        ├── Backend   (puerto 3000)
        └── Base de Datos (MySQL/MongoDB)
```

El sistema corre completamente contenerizado con Docker. El frontend se comunica con el backend mediante API REST, y el backend persiste los datos en la base de datos.

---

## Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Frontend | React / Vue / HTML+JS |
| Backend | Node.js / Flask |
| Base de datos | MySQL / MongoDB |
| Contenerización | Docker + Docker Compose |
| Infraestructura | AWS EC2 + S3 |
| IaC | AWS CloudFormation |
| Automatización | Bash Scripts |
| Control de versiones | Git + GitHub |

---

## Estructura del proyecto

```
bitacora-eventos/
│
├── frontend/              # Aplicación frontend
├── backend/               # API backend
├── docker-compose.yml     # Orquestación de contenedores
├── deploy.sh              # Script de despliegue
├── start_app.sh           # Script de inicio
├── stop_app.sh            # Script de detención
├── cloudformation/
│   └── template.yaml      # Infraestructura como código
└── README.md
```

---

## Ejecución local

### Requisitos previos
- Docker instalado
- Docker Compose instalado
- Git instalado

### Pasos

1. Clonar el repositorio:
```bash
git clone https://github.com/dgm17076/bitacora-eventos.git
cd bitacora-eventos
```

2. Levantar los contenedores:
```bash
docker-compose up -d
```

3. Acceder en el navegador:
```
http://localhost:5173
```

4. Detener la aplicación:
```bash
docker-compose down
```

---

## ☁️ Despliegue en EC2

### 1. Preparar la instancia EC2

Desde AWS CloudFormation, desplegar el template incluido:
```bash
aws cloudformation create-stack \
  --stack-name bitacora-stack \
  --template-body file://cloudformation/template.yaml
```

### 2. Conectarse a la instancia

```bash
ssh -i tu-key.pem ec2-user@<ip-publica-ec2>
```

### 3. Ejecutar el script de despliegue

```bash
chmod +x deploy.sh
./deploy.sh
```

El script automáticamente:
- Instala Git, Docker y Docker Compose
- Clona el repositorio
- Construye y levanta los contenedores

### 4. Acceder desde el navegador

```
http://<ip-publica-ec2>:5173
```

---

## 🔌 Puertos utilizados

| Servicio | Puerto |
|---|---|
| Frontend | 5173 |
| Backend API | 3000 |
| Base de datos | 3306 / 27017 |

---

## Scripts de automatización

### deploy.sh
Prepara el entorno e inicia la aplicación desde cero.
```bash
./deploy.sh
```

### start_app.sh
Inicia los contenedores si ya están configurados.
```bash
./start_app.sh
```

### stop_app.sh
Detiene todos los contenedores de la aplicación.
```bash
./stop_app.sh
```

### Programación con cron

Los scripts de inicio y detención están programados con cron:
```bash
# Iniciar la app todos los días a las 8:00 AM
0 8 * * * /home/ec2-user/bitacora-eventos/start_app.sh

# Detener la app todos los días a las 10:00 PM
0 22 * * * /home/ec2-user/bitacora-eventos/stop_app.sh
```

---

## Uso de S3

El bucket S3 se utiliza para almacenar los logs generados por la aplicación:

```bash
# Los logs se generan en:
/app/logs/app.log

# Y se sincronizan automáticamente a S3:
aws s3 cp /app/logs/app.log s3://bitacora-logs-bucket/logs/
```

Ejemplo de contenido de logs:
```
[2026-04-17 10:00:00] INFO: Sistema iniciado correctamente
[2026-04-17 10:02:15] WARNING: Uso de CPU elevado al 85%
[2026-04-17 10:05:30] ERROR: Fallo en conexión a base de datos
[2026-04-17 10:10:00] CRITICAL: Servidor caído en producción
```

---

## Preguntas de reflexión

**¿Por qué es importante Docker en DevOps?**
Docker garantiza que la aplicación corre de forma idéntica en cualquier entorno — desarrollo, staging o producción — eliminando el problema de "en mi máquina funciona". Facilita el despliegue, el escalado y la gestión de dependencias.

**¿Qué ventajas ofrece CloudFormation?**
Permite definir toda la infraestructura como código (IaC), haciendo que el entorno sea reproducible, versionable y auditable. Cualquier cambio en la infraestructura queda documentado en el repositorio.

**¿Por qué no es recomendable usar 0.0.0.0/0 en producción?**
Expone la instancia a todo el internet, aumentando la superficie de ataque. En producción se deben restringir los rangos de IP permitidos y abrir solo los puertos estrictamente necesarios.

**¿Qué automatizarías en un siguiente nivel?**
Implementaría un pipeline CI/CD completo con GitHub Actions que ejecute pruebas automáticas, construya las imágenes Docker y las despliegue automáticamente en EC2 al hacer push a main.

---

## Autor

**Diego Eduardo García Mireles**
Matrícula: AL02994009
GitHub: [@dgm17076](https://github.com/dgm17076)

---

## Licencia

Proyecto académico — Fundamentos de DevOps
