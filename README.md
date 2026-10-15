# SecurePlan Mobile — Proyecto Integrador

Agenda de tiempo y productividad con arquitectura desacoplada: app móvil (Expo) + API (NestJS) + PostgreSQL.

| Carpeta | Contenido |
|---|---|
| `backend/` | API NestJS |
| `mobile/` | App móvil Expo / React Native |
| `docker/` | `docker-compose.yml` (PostgreSQL y Liquibase) y la imagen de Liquibase |
| `liquibase/` | Changelog maestro y migraciones del esquema |
| `docs/` | Guía oficial del proyecto |
| `.github/` | Plantilla de Pull Request |

Antes de abrir tu primera Pull Request lee [`CONTRIBUTING.md`](CONTRIBUTING.md): convención de ramas y commits, y firma de commits.

## Requisitos

- Docker con Compose v2 (`docker compose version`).
- Node.js 24 y npm.

## Arranque paso a paso

Todos los comandos se ejecutan **desde la raíz del repositorio**.

### 1. Crear tu `.env`

```bash
cp .env.example .env
```

Edita `.env` y reemplaza cada `change_me` (`DB_USER`, `DB_PASSWORD`, `JWT_SECRET`) por valores propios.
El `.env` está ignorado por git: **nunca lo subas ni pegues su contenido en tickets, chats o PR**.
Para un `JWT_SECRET` aleatorio:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### 2. Levantar PostgreSQL

```bash
docker compose --env-file .env -f docker/docker-compose.yml up -d db
docker compose --env-file .env -f docker/docker-compose.yml ps   # espera a ver "healthy"
```

La base queda publicada solo en `127.0.0.1:<DB_PORT>`. Para conectarte con pgAdmin usa host `localhost`,
el puerto `DB_PORT` y los valores de `DB_NAME`, `DB_USER` y `DB_PASSWORD` de tu `.env`.

### 3. Ejecutar las migraciones (Liquibase)

```bash
docker compose --env-file .env -f docker/docker-compose.yml run --rm liquibase update
```

La primera vez construye la imagen de Liquibase (necesita red) y crea las tablas de control
`databasechangelog` y `databasechangeloglock` (PostgreSQL las guarda en minúsculas). Una segunda ejecución
reporta `Database is up to date` y no cambia nada.

### 4. Iniciar el backend

```bash
cd backend
npm install
npm run start:dev
```

El backend lee el `.env` de la raíz del repositorio y valida **todas** las variables de la tabla siguiente
al arrancar: si falta o está vacía alguna, el proceso termina con código 1 y el mensaje nombra cada variable
afectada (nunca sus valores). Las variables ya definidas en el entorno del proceso tienen prioridad sobre el `.env`.

Todas las rutas cuelgan del prefijo `/api`. Para comprobar que el servidor y la base responden:

```bash
curl -i http://localhost:3000/api/health   # 200 {"status":"ok"} con la base levantada; 503 si está caída
```

### 5. Iniciar la app móvil

```bash
cd mobile
cp .env.example .env     # revisa EXPO_PUBLIC_API_URL según tu emulador o dispositivo
npm install
npx expo start
```

## Variables de entorno

| Variable | Archivo | Uso |
|---|---|---|
| `DB_HOST` | `.env` | Host de la base para el backend (`localhost`). |
| `DB_PORT` | `.env` | Puerto del host publicado por Docker (por defecto `5433`; cámbialo si está ocupado). |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `.env` | Base, usuario y contraseña de PostgreSQL; Docker y Liquibase los toman de aquí. |
| `PORT` | `.env` | Puerto HTTP del backend (entero entre 1 y 65535). |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | `.env` | Firma y vigencia de los JWT. |
| `EXPO_PUBLIC_API_URL` | `mobile/.env` | URL base del backend. **Es pública**: va dentro del bundle de la app, nunca pongas secretos. |

## Liquibase: único mecanismo de migraciones

El esquema solo se modifica con migraciones versionadas. Cada migración es un archivo YAML nuevo en
`liquibase/changelog/migrations/` con prefijo numérico (por ejemplo `001-create-users.yaml`); el changelog
maestro las incluye y aplica en orden alfabético. No edites una migración ya aplicada: crea otra.

| Acción | Comando (tras `docker compose --env-file .env -f docker/docker-compose.yml run --rm liquibase`) |
|---|---|
| Aplicar migraciones pendientes | `update` |
| Ver migraciones pendientes | `status` |
| Revertir la última migración | `rollback-count 1` |

Ejemplo completo, revertir la última migración aplicada:

```bash
docker compose --env-file .env -f docker/docker-compose.yml run --rm liquibase rollback-count 1
```

Para escribir menos, en tu terminal puedes exportar una vez:

```bash
export COMPOSE_FILE=docker/docker-compose.yml COMPOSE_ENV_FILES=.env
docker compose run --rm liquibase status
```

## Problemas frecuentes

- **`port is already allocated` / `address already in use`**: otro servicio usa tu `DB_PORT`. Cambia `DB_PORT` en `.env` y repite el paso 2.
- **`required variable ... is missing a value`**: falta crear `.env` o completar alguna variable obligatoria.
- **Cambiaste `DB_USER`, `DB_PASSWORD` o `DB_NAME` y la conexión falla**: PostgreSQL los fija al crear el volumen la primera vez.
  Para reiniciar la base **y borrar sus datos**: `docker compose --env-file .env -f docker/docker-compose.yml down -v`.
- **Apagar sin perder datos**: `docker compose --env-file .env -f docker/docker-compose.yml down` (el volumen `pgdata` se conserva).
