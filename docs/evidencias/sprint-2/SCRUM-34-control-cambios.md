# Control de Tiempos y Registro de Cambios — SCRUM-34: Crear eventos en mi agenda

- **Historia Principal:** `SCRUM-34` (Crear eventos en mi agenda)
- **Épica:** `SCRUM-33` (Sprint 2 – Core de la Agenda / Módulo de Eventos)
- **Rama:** `feature/SCRUM-34-crear-eventos-agenda`
- **Fecha de realización:** 2026-10-21
- **Responsable:** Jose Ariel (Lead Backend & Security Engineer / Fullstack)

---

## Resumen de Subtareas y Control de Tiempos

| Subtarea | Resumen | Tiempo Estimado | Tiempo Invertido | Estado | Commit Firmado |
|---|---|---|---|---|---|
| **SCRUM-39** | Migración Liquibase de la tabla `events` (claves foráneas, índices, comprobación de rollback y update). | 3h | 2h 30m | **Completado** ✅ | `45428f0` |
| **SCRUM-40** | Esquemas y DTOs de validación estricta con `class-validator` (protección mass-assignment contra `userId`). | 4h | 3h 00m | **Completado** ✅ | `0ac11ea` |
| **SCRUM-41** | Endpoint `POST /api/events` protegido con `JwtAuthGuard` (`EventsController`, `EventsService`, `EventsRepository`). | 4h | 3h 30m | **Completado** ✅ | `824aef9` |
| **SCRUM-42** | Formulario móvil de nuevo evento con validación visual por campo (`NewEventScreen`, chips de categoría y prioridad). | 4h | 3h 30m | **Completado** ✅ | `ebc4763` |
| **SCRUM-43** | Integración del formulario con la API (`events-api.ts`, manejo de 201/400/401 y confirmación en `HomeScreen`). | 4h | 3h 30m | **Completado** ✅ | `99cfab0` |
| **TOTAL** | **Historia Completa SCRUM-34** | **19h** | **16h 00m** | **Completado** ✅ | — |

---

## Detalle Técnico por Subtarea

### 1. `SCRUM-39` — Migración Liquibase de la tabla `events`
- **Archivos creados/modificados:**
  - `liquibase/changelog/migrations/002-create-events.yaml`
- **Detalle de cambios:**
  - Creación de tabla `events` con columnas:
    - `id` (uuid, primary key, gen_random_uuid())
    - `user_id` (uuid, foreign key a `users(id)`, `onDelete: CASCADE`, `nullable: false`)
    - `title` (varchar(100), not null)
    - `description` (varchar(500), nullable)
    - `date` (date, not null)
    - `time` (time, not null)
    - `category` (varchar(30), not null)
    - `priority` (varchar(20), not null)
    - `created_at` / `updated_at` (timestamptz, not null, default `now()`)
    - Índice compuesto `idx_events_user_date` sobre `(user_id, date)` para optimizar consultas de agenda.
  - Bloque `rollback` con `dropTable: events`.
  - Verificación ejecutada en Docker:
    - `docker compose run liquibase update` (exitoso)
    - `docker compose run liquibase rollback-count 1` (exitoso)
    - `docker compose run liquibase update` (reaplicado exitosamente).

---

### 2. `SCRUM-40` — Esquemas de validación estricta con `class-validator`
- **Archivos creados/modificados:**
  - `backend/src/events/event.types.ts`
  - `backend/src/events/event.ts`
  - `backend/src/events/dto/create-event.dto.ts`
  - `backend/src/events/dto/create-event.dto.spec.ts`
- **Detalle de cambios:**
  - Definición de tipos y catálogos cerrados: `EVENT_CATEGORIES` (`trabajo`, `estudio`, `personal`, `salud`, `otro`) y `EVENT_PRIORITIES` (`baja`, `media`, `alta`).
  - DTO `CreateEventDto` con validaciones declarativas:
    - `@IsNotEmpty()`, `@MaxLength(100)` para `title`.
    - `@IsOptional()`, `@MaxLength(500)` para `description`.
    - Formato de fecha con regex `^\d{4}-\d{2}-\d{2}$`.
    - Formato de hora con regex `^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$`.
    - `@IsIn` para `category` y `priority`.
  - Protección de seguridad: rechazo automático de campos no declarados como `userId` (`forbidNonWhitelisted: true`).
  - 9 pruebas unitarias automatizadas con Vitest cubriendo todos los casos de validación.

---

### 3. `SCRUM-41` — Implementar `POST /api/events` protegido con `JwtAuthGuard`
- **Archivos creados/modificados:**
  - `backend/src/events/events.repository.ts`
  - `backend/src/events/events.service.ts`
  - `backend/src/events/events.controller.ts`
  - `backend/src/events/events.module.ts`
  - `backend/src/app.module.ts`
  - `backend/src/events/events.service.spec.ts`
  - `backend/src/events/events.controller.spec.ts`
  - `backend/test/events.e2e-spec.ts`
- **Detalle de cambios:**
  - Repositorio con consultas SQL nativas y parametrizadas (`INSERT INTO events ... RETURNING ...`).
  - Controlador protegido `@UseGuards(JwtAuthGuard)` que inyecta `req.user.id` desde el token verificado al servicio.
  - Registro de `EventsModule` en `AppModule`.
  - Pruebas unitarias de servicio y controlador.
  - Pruebas e2e completas con Supertest:
    - 401 si no hay token o es inválido.
    - 201 si el cuerpo es válido (asociando al `userId` del JWT).
    - 400 si se envía `userId` en el payload.
    - 400 con desglose por campo si los valores son inválidos.

---

### 4. `SCRUM-42` — Formulario de nuevo evento con validación visual
- **Archivos creados/modificados:**
  - `mobile/src/features/events/event-types.ts`
  - `mobile/src/features/events/create-event-validation.ts`
  - `mobile/src/features/events/create-event-validation.test.ts`
  - `mobile/src/app/(app)/events/new.tsx`
- **Detalle de cambios:**
  - Módulo de validación de cliente espejo del backend (`validateCreateEvent`).
  - Pantalla accesible `NewEventScreen` con:
    - Campos `TextField` para título, descripción, fecha y hora.
    - Chips/selectores interactivos para categorías y prioridades (con código de color temático: alta/rojo, media/naranja, baja/verde).
    - Renderizado de errores individuales bajo cada campo.
    - Botones de acción accesibles con indicador de carga y prevención de doble envío.
  - 9 pruebas unitarias automatizadas en mobile cubriendo reglas de cliente.

---

### 5. `SCRUM-43` — Integrar creación de eventos con la API
- **Archivos creados/modificados:**
  - `mobile/src/features/events/events-api.ts`
  - `mobile/src/features/events/events-api.test.ts`
  - `mobile/src/app/(app)/index.tsx`
- **Detalle de cambios:**
  - Función `createEvent(payload, token)` usando el cliente HTTP base con `Authorization: Bearer <token>`.
  - Traducción de errores `describeCreateEventError` para errores 400 (por campo), 401 (sesión expirada) y errores de red.
  - Actualización de `HomeScreen` con botón "+ Crear evento" (`router.push('/(app)/events/new')`).
  - Navegación de retorno al guardar con notificación visual de éxito: "✓ Evento «...» creado exitosamente".
  - 5 pruebas unitarias automatizadas para `createEvent` y traducción de respuestas.

---

## Verificación de Calidad

- **Backend:**
  - Pruebas unitarias: 72 tests exitosos (`npm test`).
  - Pruebas e2e: 68 tests exitosos (`npm run test:e2e`).
  - Linter: 0 warnings, 0 errors (`npm run lint` con oxlint).
  - Compilación: TypeScript NestJS limpia (`npm run build`).
- **Mobile:**
  - Pruebas unitarias: 69 tests exitosos (`npm test`).
  - Linter: 0 warnings, 0 errors (`npm run lint` con expo lint).
  - Verificación de tipos: 0 errores (`npx tsc --noEmit`).
- **Firmas Git:**
  - Todos los commits cuentan con firma criptográfica válida (`Good "git" signature`).
