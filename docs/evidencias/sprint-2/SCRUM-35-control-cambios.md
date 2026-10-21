# Control de Tiempos y Registro de Cambios — SCRUM-35: Ver mis eventos en un calendario

- **Historia Principal:** `SCRUM-35` (Ver mis eventos en un calendario)
- **Épica:** `SCRUM-33` (Sprint 2 – Core de la Agenda / Módulo de Eventos)
- **Rama:** `feature/SCRUM-35-ver-eventos-calendario`
- **Fecha de realización:** 2026-10-21
- **Responsable:** Jose Ariel (Lead Fullstack & Security Engineer)

---

## Resumen de Subtareas y Control de Tiempos

| Subtarea | Resumen | Tiempo Estimado | Tiempo Invertido | Estado | Commit Firmado |
|---|---|---|---|---|---|
| **SCRUM-44** | Endpoints backend para listar eventos con filtrado de fechas (`from`, `to`) y detalle por ID (`GET /api/events`, `GET /api/events/:id`) con control de acceso por `userId`. | 3h | 1h 00m | **Completado** ✅ | *Commit unificado SCRUM-35* |
| **SCRUM-45** | Componente de calendario interactivo en mobile: navegación por mes, cuadrícula de días, indicadores visuales de eventos (puntos), día de hoy y día seleccionado, estados de carga y error con reintento. | 3h | 1h 00m | **Completado** ✅ | *Commit unificado SCRUM-35* |
| **SCRUM-46** | Vista de agenda con listado de eventos del día seleccionado (hora `HH:mm`, chip de categoría, badge de prioridad color-coded, descripción) y estado vacío informativo. | 3h | 45m | **Completado** ✅ | *Commit unificado SCRUM-35* |
| **TOTAL** | **Historia Completa SCRUM-35** | **9h** | **2h 45m** | **Completado** ✅ | *(Un único commit firmado para todo el SCRUM)* |

---

## Detalle Técnico por Subtarea

### 1. `SCRUM-44` — Endpoints y seguridad para consultar eventos con filtrado por rango de fechas
- **Archivos creados/modificados:**
  - `backend/src/events/dto/events-filter.dto.ts`
  - `backend/src/events/events.repository.ts`
  - `backend/src/events/events.service.ts`
  - `backend/src/events/events.controller.ts`
  - `backend/src/events/events.service.spec.ts`
  - `backend/src/events/events.controller.spec.ts`
  - `backend/test/events.e2e-spec.ts`
- **Detalle de cambios:**
  - DTO `EventsFilterDto` con validaciones declarativas `@IsOptional()` y regex estricta `^\d{4}-\d{2}-\d{2}$` para `from` y `to`.
  - Método `findByUserIdAndRange(userId, from?, to?)` en el repositorio SQL parametrizado, aprovechando el índice compuesto `idx_events_user_date` y ordenando por `date ASC, time ASC`.
  - Método `findByIdAndUserId(id, userId)` garantizando estricto aislamiento multi-inquilino (ningún usuario puede acceder a eventos de otro).
  - Lógica de negocio en `EventsService`: validación de rango coherente (`from <= to`), retornando 400 Bad Request si la fecha inicial es mayor a la final. En `findOne`, si no existe o no pertenece al usuario emite `404 Not Found`.
  - Rutas en `EventsController` protegidas con `@UseGuards(JwtAuthGuard)`:
    - `GET /api/events`: acepta query params opcionales `from` y `to`.
    - `GET /api/events/:id`: valida UUIDv4 con `ParseUUIDPipe({ version: '4' })`.
  - Pruebas automatizadas:
    - Unitarias en servicio y controlador cubriendo casos de éxito, rangos inválidos y 404.
    - 6 pruebas e2e adicionales en `events.e2e-spec.ts` verificando:
      - 200 con lista vacía y con eventos filtrados.
      - 200 filtrando por rango exacto (`from` y `to`).
      - 400 si `from > to` o si el formato de fecha no es `YYYY-MM-DD`.
      - 401 si no hay token o es inválido.
      - 200 en `GET /api/events/:id` y 404 si el ID no existe o pertenece a otro usuario.

---

### 2. `SCRUM-45` — Componente de calendario interactivo para selección de fechas
- **Archivos creados/modificados:**
  - `mobile/src/features/events/calendar-utils.ts`
  - `mobile/src/features/events/calendar-utils.test.ts`
  - `mobile/src/features/events/events-api.ts`
  - `mobile/src/features/events/events-api.test.ts`
  - `mobile/src/app/(app)/index.tsx`
- **Detalle de cambios:**
  - Funciones utilitarias puras en `calendar-utils.ts` con cobertura de pruebas unitarias:
    - `formatDateIso(date)` para formato estándar `YYYY-MM-DD`.
    - `getMonthDateRange(year, month)` para calcular dinámicamente el primer y último día del mes respetando años bisiestos.
    - `getCalendarGrid(year, month)` para generar celdas de la cuadrícula en semanas completas (múltiplos de 7) con flags de mes actual.
    - `formatDisplayDate(iso)` para formatear fechas amigables en español (ej. "21 de octubre de 2026").
  - Consumo de API en `mobile/src/features/events/events-api.ts`:
    - `getEvents(token, from?, to?)` con querystrings y cabecera `Authorization: Bearer <token>`.
  - Vista interactiva de calendario en `HomeScreen`:
    - Barra de navegación entre meses (`‹` Mes/Año `›`) y botón rápido "Hoy".
    - Encabezado con nombres de días de la semana (`Dom`, `Lun`, `Mar`, `Mié`, `Jue`, `Vie`, `Sáb`).
    - Matriz de días con estados interactivos: día seleccionado resaltado con fondo primario, día actual con borde distintivo, días de otros meses atenuados.
    - Punto indicador (`eventDot`) debajo del número de día para fechas con al menos un evento programado.
    - Manejo de estados de carga (`ActivityIndicator` sutil) y error de red con botón "Reintentar".

---

### 3. `SCRUM-46` — Vista de agenda y lista de eventos filtrados para la fecha seleccionada
- **Archivos creados/modificados:**
  - `mobile/src/app/(app)/index.tsx`
- **Detalle de cambios:**
  - Encabezado de agenda dinámico indicando la fecha seleccionada formateada y contador de eventos (`X eventos`).
  - **Estado vacío informativo:** Cuando la fecha no tiene actividades programadas, se muestra una tarjeta amigable con icono (`📅`), texto descriptivo y botón directo para "+ Programar un evento".
  - **Tarjetas de eventos detalladas:**
    - Indicador de hora con icono y tipografía destacada (`⏰ HH:mm`).
    - Badge de categoría con bordes redondeados y estilo temático.
    - Badge de prioridad con código visual semántico:
      - **Alta**: Fondo rojo suave `#FFEBEE` con texto `#C62828`.
      - **Media**: Fondo naranja suave `#FFF3E0` con texto `#EF6C00`.
      - **Baja**: Fondo verde suave `#E8F5E9` con texto `#2E7D32`.
    - Título del evento en negrita y descripción opcional en tipografía secundaria.
    - Ordenamiento cronológico automático de los eventos del día por hora (`time`).
  - Integración fluida con el flujo de creación: al retornar desde `/(app)/events/new`, se muestra el banner de confirmación y se refresca automáticamente la agenda del mes.

---

## Verificación de Calidad

- **Backend:**
  - Pruebas unitarias: **78 tests exitosos** (`npm test`).
  - Pruebas e2e: **74 tests exitosos** (`npm run test:e2e`).
  - Linter: **0 warnings, 0 errors** (`npm run lint` con oxlint).
  - Compilación: TypeScript NestJS limpia sin errores (`npm run build`).
- **Mobile:**
  - Pruebas unitarias: **78 tests exitosos** (`npm test`).
  - Linter: **0 warnings, 0 errors** (`npm run lint` con expo lint).
  - Verificación de tipos: **0 errores** (`npx tsc --noEmit`).
- **Firmas Git:**
  - Commit único para toda la historia SCRUM-35 con firma SSH criptográfica válida.
