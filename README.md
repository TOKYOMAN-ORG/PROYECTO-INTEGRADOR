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

Registro de usuario (`POST /api/auth/register`: nombre de 2 a 100 caracteres, correo válido y contraseña de 8 a 128):

```bash
curl -i -X POST http://localhost:3000/api/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Ana","email":"ana@example.com","password":"Secreta123"}'
```

| Respuesta | Cuándo |
|---|---|
| `201` con `{ id, name, email }` | Usuario creado; nunca incluye la contraseña ni su hash. |
| `400` con `errors` por campo | Datos inválidos o propiedades no permitidas (por ejemplo `role`). |
| `409` | El correo ya está registrado (sin distinguir mayúsculas). |

La contraseña solo se guarda como hash Argon2id (`$argon2id$…`) en `users.password_hash`.

Inicio de sesión (`POST /api/auth/login`) y comprobación del token (`GET /api/auth/me`):

```bash
curl -i -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"ana@example.com","password":"Secreta123"}'
curl -i http://localhost:3000/api/auth/me -H 'Authorization: Bearer <accessToken>'
```

| Respuesta | Cuándo |
|---|---|
| `200` con `{ accessToken }` (login) | JWT HS256 firmado con `JWT_SECRET`, con `sub` (id del usuario) y `exp` (`JWT_EXPIRES_IN`); sin correo ni otros datos. |
| `200` con `{ id, name, email }` (me) | Token válido de un usuario que sigue existiendo. |
| `400` con `errors` por campo | Correo mal formado, campos ausentes o propiedades no permitidas. |
| `401` | Login: correo inexistente o contraseña incorrecta, con el mismo mensaje `Credenciales inválidas`. Me: sin cabecera, token alterado, expirado o usuario eliminado. |

Para proteger otra ruta basta `@UseGuards(JwtAuthGuard)` (`backend/src/auth/jwt-auth.guard.ts`); el módulo que la declare
debe importar `AuthModule`. En la app, el token se guarda solo en Expo SecureStore (`mobile/src/storage/secure-token-storage.ts`).

### 5. Módulo de Eventos (Endpoints de Agenda)

Todos los endpoints de eventos requieren autenticación mediante JWT (`Authorization: Bearer <accessToken>`) y aíslan de forma estricta los datos entre usuarios (mitigación IDOR: si un evento no pertenece al usuario autenticado, la API responde `404 Not Found`).

#### Crear un evento (`POST /api/events`)

Crea un nuevo evento asociado automáticamente al usuario autenticado. El campo `userId` no se acepta en el cuerpo (protección contra *Mass Assignment*).

```bash
curl -i -X POST http://localhost:3000/api/events \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Reunión de planificación",
    "description": "Revisión de historias de usuario del Sprint 2",
    "date": "2026-10-25",
    "time": "10:00",
    "category": "trabajo",
    "priority": "alta"
  }'
```

| Campo | Tipo | Requisitos |
|---|---|---|
| `title` | `string` | Obligatorio. Longitud entre 1 y 100 caracteres. |
| `description` | `string` | Opcional. Máximo 500 caracteres (o `null`). |
| `date` | `string` | Obligatorio. Formato de fecha ISO `YYYY-MM-DD`. |
| `time` | `string` | Obligatorio. Formato de 24 horas `HH:mm`. |
| `category` | `string` | Obligatorio. Uno de: `trabajo`, `estudio`, `personal`, `salud`, `otro`. |
| `priority` | `string` | Obligatorio. Uno de: `baja`, `media`, `alta`. |

| Respuesta | Cuándo |
|---|---|
| `201 Created` | Evento creado; devuelve el objeto con `{ id, userId, title, description, date, time, category, priority, createdAt, updatedAt }`. |
| `400 Bad Request` | Fallo de validación por campo o intento de inyectar `userId` u otros campos ajenos. |
| `401 Unauthorized` | Token ausente, firma alterada o vigencia expirada. |

#### Listar eventos (`GET /api/events`)

Obtiene la lista de eventos del usuario autenticado, ordenada cronológicamente (`date ASC, time ASC`). Permite filtrar por rango de fechas mediante los parámetros opcionales `from` y `to`.

```bash
curl -i 'http://localhost:3000/api/events?from=2026-10-01&to=2026-10-31' \
  -H 'Authorization: Bearer <accessToken>'
```

| Parámetro Query | Tipo | Requisitos |
|---|---|---|
| `from` | `string` | Opcional. Fecha inicio en formato `YYYY-MM-DD`. |
| `to` | `string` | Opcional. Fecha fin en formato `YYYY-MM-DD`. No puede ser anterior a `from`. |

| Respuesta | Cuándo |
|---|---|
| `200 OK` | Arreglo de eventos (JSON array); si no hay eventos devuelve `[]`. Solo incluye eventos del usuario autenticado. |
| `400 Bad Request` | `from` es posterior a `to` o formato de fecha inválido. |
| `401 Unauthorized` | Token ausente, expirado o manipulado. |

#### Obtener detalle de un evento (`GET /api/events/:id`)

Consulta un evento específico por su identificador único.

```bash
curl -i http://localhost:3000/api/events/99999999-9999-4000-8000-000000000001 \
  -H 'Authorization: Bearer <accessToken>'
```

| Respuesta | Cuándo |
|---|---|
| `200 OK` | Devuelve el evento solicitado con sus metadatos y fechas formateadas. |
| `400 Bad Request` | El parámetro `:id` no tiene un formato UUID v4 válido. |
| `401 Unauthorized` | Token ausente, alterado o expirado. |
| `404 Not Found` | El evento no existe o pertenece a otro usuario (*mitigación IDOR*). |

#### Actualizar un evento (`PUT /api/events/:id`)

Actualiza los datos de un evento existente perteneciente al usuario autenticado.

```bash
curl -i -X PUT http://localhost:3000/api/events/99999999-9999-4000-8000-000000000001 \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Reunión de planificación (Reprogramada)",
    "description": "Nueva hora acordada",
    "date": "2026-10-26",
    "time": "11:30",
    "category": "trabajo",
    "priority": "alta"
  }'
```

| Respuesta | Cuándo |
|---|---|
| `200 OK` | Evento actualizado exitosamente; refleja el nuevo `updatedAt`. |
| `400 Bad Request` | Datos inválidos, `:id` no UUID o intento de incluir `userId`. |
| `401 Unauthorized` | Token ausente, alterado o expirado. |
| `404 Not Found` | El evento no existe o pertenece a otro usuario (*mitigación IDOR*). |

#### Eliminar un evento (`DELETE /api/events/:id`)

Elimina definitivamente un evento perteneciente al usuario autenticado.

```bash
curl -i -X DELETE http://localhost:3000/api/events/99999999-9999-4000-8000-000000000001 \
  -H 'Authorization: Bearer <accessToken>'
```

| Respuesta | Cuándo |
|---|---|
| `204 No Content` | Evento eliminado exitosamente (sin cuerpo de respuesta). |
| `400 Bad Request` | El parámetro `:id` no es un UUID v4 válido. |
| `401 Unauthorized` | Token ausente, alterado o expirado. |
| `404 Not Found` | El evento no existe, pertenece a otro usuario (*mitigación IDOR*) o ya fue eliminado previamente. |

#### Exportar la agenda (`GET /api/events/export?format=json|csv`)

Descarga todos los eventos del usuario autenticado, ordenados por fecha y hora, como archivo JSON o CSV. El formato
se elige con el patrón **Strategy** (`backend/src/events/export/`): cada formato es una clase que implementa
`ExportStrategy`, y agregar uno nuevo solo requiere su clase y registrarla en `EXPORT_STRATEGIES` (`EventsModule`).
El archivo contiene `id`, `title`, `description`, `date`, `time`, `category` y `priority`; nunca `userId` ni fechas de
auditoría.

| Parámetro | Ubicación | Obligatorio | Valores |
|---|---|---|---|
| `format` | query | Sí | `json` o `csv` (un solo valor) |

```bash
curl -i 'http://localhost:3000/api/events/export?format=csv' \
  -H 'Authorization: Bearer <accessToken>' -o agenda.csv
```

| Respuesta | Cuándo |
|---|---|
| `200 OK` (JSON) | `Content-Type: application/json; charset=utf-8`, `Content-Disposition: attachment; filename="agenda.json"`; arreglo de eventos (`[]` si no hay). |
| `200 OK` (CSV) | `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="agenda.csv"`; encabezado y una fila por evento (RFC 4180, `\r\n`). Los campos con coma, comillas o saltos de línea van entre comillas, y las celdas que empiezan con `=`, `+`, `-`, `@`, tabulador o retorno de carro llevan el prefijo `'` para que una hoja de cálculo no las ejecute como fórmula. |
| `400 Bad Request` | `format` ausente, repetido o distinto de `json`/`csv`, o parámetros no permitidos; `errors.format` trae el detalle. |
| `401 Unauthorized` | Token ausente, alterado o expirado. |

### 6. Iniciar la app móvil

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
