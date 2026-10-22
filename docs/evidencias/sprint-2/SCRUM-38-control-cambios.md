# Control de Tiempos y Registro de Actividad — SCRUM-38: Verificar criterios de codificación segura del Sprint 2 (IDOR e inyecciones)

- **Historia Principal:** `SCRUM-38` (Verificar criterios de codificación segura del Sprint 2: IDOR e inyecciones)
- **Épica:** `SCRUM-33` (Sprint 2 – Core de la Agenda / Módulo de Eventos)
- **Rama:** `feature/SCRUM-38-verificacion-codificacion-segura`
- **Fecha de realización:** 2026-10-22
- **Responsable:** Jose Ariel (Lead Fullstack & Security Engineer)

---

## Resumen de Subtareas y Control de Tiempos

| Subtarea | Resumen | Tiempo Estimado | Tiempo Invertido | Estado | Commit Firmado |
|---|---|:---:|:---:|:---:|:---:|
| **SCRUM-53** | Escribir pruebas e2e de aislamiento entre usuarios (IDOR) y rechazo de inyecciones en `backend/test/events.e2e-spec.ts` siguiendo el patrón de `auth.e2e-spec.ts`. Simulación en memoria con dos usuarios (Ana y Beto), verificación de que ningún usuario puede leer, modificar ni eliminar eventos ajenos (404), listados aislados por rango, rechazo de `userId` en cuerpo (400), tratamiento de inyecciones SQL como texto literal y rechazo con 401 ante tokens ausentes, alterados o expirados en los 4 verbos HTTP. | 7h | 1h 00m | **Completado** ✅ | `ffc97cd` |
| **SCRUM-54** | Crear colección versionada de Postman y variables de entorno en `docs/postman/` con pruebas anómalas contra PostgreSQL real (Docker), verificando estado inalterado de eventos ajenos, integridad de la tabla `events` ante cargas `DROP TABLE`, bloqueo de ID no UUID, rechazo de asignación masiva y documentación del reporte en `docs/evidencias/sprint-2/SCRUM-54-pruebas-anomalas-postman.md`. | 4h | 45m | **Completado** ✅ | `440255c` |
| **SCRUM-55** | Escribir documentación técnica exhaustiva de los endpoints del módulo de eventos en `README.md` y `backend/README.md` detallando método HTTP, ruta, encabezados requeridos, cuerpo de petición con restricciones por campo y catálogo de códigos de respuesta (`200`, `201`, `204`, `400`, `401`, `404`). | 2h | 30m | **Completado** ✅ | `6919ffb` |
| **TOTAL** | **Historia Completa SCRUM-38** | **13h** | **2h 15m** | **Completado** ✅ | *(Un commit firmado por cada subtarea)* |

---

## Detalle Técnico por Subtarea

### 1. `SCRUM-53` — Pruebas e2e de aislamiento entre usuarios (IDOR) y rechazo de inyecciones
- **Archivos modificados:**
  - `backend/test/events.e2e-spec.ts`
- **Detalle de cambios:**
  - Se estructuró un almacén de eventos simulado en memoria (`eventsStore`) y dos usuarios independientes (`USER_A` - Ana y `USER_B` - Beto) con sus respectivos tokens JWT firmados.
  - Se implementó un despachador para `DatabaseConnection.query` que replica estrictamente el filtrado SQL de la aplicación real (`WHERE user_id = $...` y `WHERE id = $1 AND user_id = $2`), de modo que si un método omite el filtro de dueño, la suite falla de inmediato.
  - Se añadieron pruebas exhaustivas de **mitigación IDOR**:
    - Usuario A intenta `GET /api/events/:idB` -> Responde `404 Not Found` y el evento de Beto permanece idéntico en memoria.
    - Usuario A intenta `PUT /api/events/:idB` -> Responde `404 Not Found` y el evento de Beto permanece intacto sin modificaciones.
    - Usuario A intenta `DELETE /api/events/:idB` -> Responde `404 Not Found` y el evento de Beto sigue existiendo en el almacén.
    - Usuario A lista eventos con filtro de fecha -> No recibe los eventos de Beto aunque compartan exactamente las mismas fechas y horas.
    - Usuario B puede consultar, modificar y eliminar sus propios eventos exitosamente.
  - Se verificó la **mitigación contra inyecciones SQL**:
    - Carga clásica `' OR '1'='1` en título: se almacena como texto literal (201) y no afecta a otros registros.
    - Carga destructiva `'; DROP TABLE events;--` en título y descripción: se guarda literalmente (201) sin ejecutar sentencias SQL.
    - Parámetro `:id` malicioso en ruta: bloqueado con 400 por `ParseUUIDPipe` antes de alcanzar la base de datos.
    - Ninguna respuesta expone trazas de SQL, nombres de tablas ni errores internos del driver `pg`.
  - Se comprobó la seguridad de tokens en **todos los verbos HTTP** (`POST`, `GET`, `PUT`, `DELETE`):
    - Token ausente -> `401 Unauthorized`.
    - Token alterado / corrupto -> `401 Unauthorized`.
    - Token expirado (timestamp en el pasado) -> `401 Unauthorized`.
  - **Prueba de regresión / mutación controlada:** Se removió temporalmente `AND user_id = $2` de `findByIdAndUserId` en `events.repository.ts` y se constató que la suite falló inmediatamente (la prueba de lectura cruzada arrojó 200 en lugar de 404). Tras verificar el fallo, la alteración fue revertida a su estado seguro.
- **Commit:** `ffc97cd` (`test(backend): escribir pruebas e2e de aislamiento entre usuarios (IDOR) y rechazo de inyecciones (SCRUM-53)`)

---

### 2. `SCRUM-54` — Pruebas anómalas en Postman contra PostgreSQL real y evidencias
- **Archivos creados:**
  - `docs/postman/SecurePlan-Sprint-2-Events-Seguridad.postman_collection.json`
  - `docs/postman/SecurePlan-Sprint-2-Events-Seguridad.postman_environment.json`
  - `docs/evidencias/sprint-2/SCRUM-54-pruebas-anomalas-postman.md`
  - `.gitignore` (permite rastrear `docs/postman/`)
- **Detalle de cambios:**
  - Se diseñó la colección de Postman versionada con 10 peticiones anómalas parametrizadas mediante variables de entorno (`base_url`, `token_usuario_a`, `token_usuario_b`, `evento_id_usuario_b`, etc.).
  - Se ejecutaron las pruebas contra el backend conectado a la base de datos PostgreSQL 16 levantada en Docker Compose.
  - Se validó el estado de la base de datos en pgAdmin:
    - Tras los intentos de modificación y borrado de eventos ajenos, los registros del Usuario B permanecieron 100 % inalterados.
    - Tras las cargas de inyección `'; DROP TABLE events;--`, la tabla `events` continúa existiendo íntegra y los payloads se persistieron como texto literal gracias a los parámetros enlazados (`$1, $2`).
  - Se generó el informe técnico detallando respuestas HTTP, cabeceras, códigos devueltos (ninguno 5xx) y confirmando la higiene de credenciales (sin tokens ni secretos en el repositorio).
- **Commit:** `440255c` (`test(security): ejecutar pruebas anomalas en Postman contra PostgreSQL real y documentar evidencias (SCRUM-54)`)

---

### 3. `SCRUM-55` — README de los endpoints de eventos
- **Archivos modificados:**
  - `README.md`
  - `backend/README.md`
- **Detalle de cambios:**
  - Se agregó en `README.md` la sección **5. Módulo de Eventos (Endpoints de Agenda)** documentando de forma estructurada los 5 endpoints del módulo:
    - `POST /api/events`: Creación de eventos, especificación de tipos, validaciones por campo y prevención de *Mass Assignment*.
    - `GET /api/events`: Listado cronológico con parámetros opcionales `from` y `to`.
    - `GET /api/events/:id`: Detalle de evento propio, validación UUID v4 y respuesta 404 ante IDOR.
    - `PUT /api/events/:id`: Actualización de evento propio y validación de propiedad.
    - `DELETE /api/events/:id`: Eliminación definitiva con respuesta 204 y 404 en repeticiones.
  - Se actualizó `backend/README.md` con un índice de endpoints y enlace directo a la documentación principal.
- **Commit:** `6919ffb` (`docs(api): escribir README de los endpoints de eventos con metodo, ruta, cuerpo y respuestas (SCRUM-55)`)

---

## Verificación de Calidad

- **Backend:**
  - Pruebas unitarias: **84 tests exitosos** (`npm test`).
  - Pruebas e2e: **82 tests exitosos** (`npm run test:e2e`).
  - Linter: **0 warnings, 0 errors** (`npm run lint` con oxlint).
  - TypeScript: **0 errores de tipos** (`npx tsc --noEmit`).
- **Mobile:**
  - Pruebas unitarias: **94 tests exitosos** (`npm test`).
  - Linter: **0 warnings, 0 errors** (`npm run lint`).
  - TypeScript: **0 errores de tipos** (`npx tsc --noEmit`).

---

## Estado en Jira

- `SCRUM-53`: **Finalizada** (Listo) | Logged: 1h 00m
- `SCRUM-54`: **Finalizada** (Listo) | Logged: 45m
- `SCRUM-55`: **Finalizada** (Listo) | Logged: 30m
- `SCRUM-38`: **Finalizada** (Listo) | Logged: 1h 00m
