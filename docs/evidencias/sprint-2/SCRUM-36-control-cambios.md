# Control de Tiempos y Registro de Actividad — SCRUM-36: Editar y eliminar mis eventos

- **Historia Principal:** `SCRUM-36` (Editar y eliminar mis eventos)
- **Épica:** `SCRUM-33` (Sprint 2 – Core de la Agenda / Módulo de Eventos)
- **Rama:** `feature/SCRUM-36-editar-eliminar-eventos`
- **Fecha de realización:** 2026-10-21
- **Responsable:** Jose Ariel (Lead Fullstack & Security Engineer)

---

## Resumen de Subtareas y Control de Tiempos

| Subtarea | Resumen | Tiempo Estimado | Tiempo Invertido | Estado | Commit Firmado |
|---|---|---|---|---|---|
| **SCRUM-47** | Endpoint backend `PUT /api/events/:id` para actualizar eventos existentes con validación estricta de DTO, sanitización de payloads y verificación de propiedad por `userId`. | 3h | 1h 00m | **Completado** ✅ | `7073fc3` |
| **SCRUM-48** | Endpoint backend `DELETE /api/events/:id` para eliminación lógica/física con respuesta `204 No Content`, verificación de propiedad por `userId` y protección frente a eliminación de eventos ajenos o inexistentes. | 3h | 45m | **Completado** ✅ | `730082b` |
| **SCRUM-49** | Interfaz y flujo de edición en mobile reutilizando el formulario de `events/new`, precarga de datos existentes, validaciones reactivas, retorno guiado a la agenda y mensaje de confirmación de actualización. | 3h | 1h 00m | **Completado** ✅ | `c486214` |
| **SCRUM-50** | Mecanismo de eliminación con confirmación explícita (diálogo nativo/web con opciones Cancelar/Eliminar), consumo de `DELETE /api/events/:id`, actualización inmediata de la UI y manejo de errores 404/red. | 3h | 45m | **Completado** ✅ | *(Commit actual)* |
| **TOTAL** | **Historia Completa SCRUM-36** | **12h** | **3h 30m** | **Completado** ✅ | *(Un commit firmado individual por cada subtarea)* |

---

## Detalle Técnico por Subtarea

### 1. `SCRUM-47` — Endpoint y seguridad para actualizar eventos existentes (`PUT /api/events/:id`)
- **Archivos modificados/creados:**
  - `backend/src/events/events.repository.ts`
  - `backend/src/events/events.service.ts`
  - `backend/src/events/events.controller.ts`
  - `backend/src/events/events.service.spec.ts`
  - `backend/src/events/events.controller.spec.ts`
  - `backend/test/events.e2e-spec.ts`
- **Detalle de cambios:**
  - Método `updateForUser(id, userId, dto)` en `EventsRepository` ejecutando `UPDATE events SET title = $1, description = $2, date = $3, time = $4, category = $5, priority = $6, updated_at = NOW() WHERE id = $7 AND user_id = $8 RETURNING *`.
  - Método `update(id, userId, dto)` en `EventsService` que garantiza que el evento existe y pertenece al usuario autenticado; en caso contrario, arroja `NotFoundException('El evento no existe')` (evitando fuga de información sobre la existencia de eventos ajenos).
  - Endpoint `@Put(':id')` en `EventsController` con validación estricta de UUIDv4 (`ParseUUIDPipe({ version: '4' })`), DTO validado (`CreateEventDto`) y protección con `JwtAuthGuard`.
  - Cobertura de pruebas unitarias en servicio y controlador, además de 6 pruebas e2e en `events.e2e-spec.ts` (casos 200 OK, 401 Unauthorized, 400 Bad Request por UUID inválido o payload no conforme, 404 Not Found si no existe o es de otro usuario).
- **Commit:** `7073fc3` (`feat(api): implementar endpoint PUT /api/events/:id con verificacion de propiedad (SCRUM-47)`)

---

### 2. `SCRUM-48` — Endpoint y lógica de eliminación segura de eventos (`DELETE /api/events/:id`)
- **Archivos modificados:**
  - `backend/src/events/events.repository.ts`
  - `backend/src/events/events.service.ts`
  - `backend/src/events/events.controller.ts`
  - `backend/src/events/events.service.spec.ts`
  - `backend/src/events/events.controller.spec.ts`
  - `backend/test/events.e2e-spec.ts`
- **Detalle de cambios:**
  - Método `deleteForUser(id, userId)` en `EventsRepository` ejecutando `DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING id`.
  - Método `remove(id, userId)` en `EventsService` que valida el resultado; si no se eliminó ningún registro retorna `NotFoundException('El evento no existe')`.
  - Endpoint `@Delete(':id')` en `EventsController` con anotación `@HttpCode(HttpStatus.NO_CONTENT)` (estatus HTTP 204 sin cuerpo en éxito) y `ParseUUIDPipe({ version: '4' })`.
  - Pruebas e2e completas validando respuesta 204, rechazo 404 en llamadas repetidas al mismo recurso (idempotencia en el borrado no revela el recurso previo), 404 para eventos de otros usuarios y 400 para UUIDs malformados.
- **Commit:** `730082b` (`feat(api): implementar endpoint DELETE /api/events/:id con verificacion de propiedad (SCRUM-48)`)

---

### 3. `SCRUM-49` — Flujo de edición en cliente móvil reutilizando formulario (`events/new`)
- **Archivos modificados:**
  - `mobile/src/features/events/events-api.ts`
  - `mobile/src/features/events/events-api.test.ts`
  - `mobile/src/app/(app)/events/new.tsx`
  - `mobile/src/app/(app)/index.tsx`
- **Detalle de cambios:**
  - Función de cliente `updateEvent(id, token, data)` con llamada `PUT /api/events/:id` y traducción semántica de errores 404 ("El evento que intentas editar ya no existe o fue eliminado").
  - Pruebas unitarias de `updateEvent` en `events-api.test.ts`.
  - Reutilización de la pantalla `events/new.tsx` detectando parámetro `id` en la ruta:
    - Modo edición automático si `id` está presente: precarga de campos `initialTitle`, `initialDescription`, `initialDate`, `initialTime`, `initialCategory`, `initialPriority`.
    - Ajuste dinámico de textos ("Editar Evento", "Guardar cambios", botón "Actualizando…").
    - Redirección tras éxito a la agenda pasando parámetro `updated=1`.
  - Modal de detalle de evento en `HomeScreen` (`index.tsx`) al pulsar sobre cualquier tarjeta de la agenda, con botón "Editar evento" que navega directamente a la pantalla de edición.
  - Banner de confirmación verde en la agenda: "Evento actualizado correctamente".
- **Commit:** `c486214` (`feat(mobile): habilitar la edicion de un evento reutilizando el formulario (SCRUM-49)`)

---

### 4. `SCRUM-50` — Confirmación de eliminación e integración reactiva en cliente móvil
- **Archivos modificados:**
  - `mobile/src/features/events/events-api.ts`
  - `mobile/src/features/events/events-api.test.ts`
  - `mobile/src/app/(app)/index.tsx`
- **Detalle de cambios:**
  - Función `deleteEvent(id, token)` en `events-api.ts` que envía `DELETE /api/events/:id` y maneja respuestas vacías (204).
  - Pruebas unitarias para `deleteEvent` (éxito y 401).
  - Diálogo de confirmación accesible y multiplataforma:
    - Implementación de `confirmDelete(title)` que utiliza `Alert.alert` en dispositivos nativos (Android/iOS) con botones Cancelar/Eliminar (`destructive`), y fallback a `window.confirm` en Web.
  - Acción "Eliminar evento" en el modal de detalle del evento con botón rojo destacado `#ef4444`.
  - Estados reactivos `deleting` (bloqueando botones y mostrando "Eliminando…") y `deleteError` para reportar fallos de red en el modal sin cerrar la vista.
  - Manejo de evento no encontrado (404): eliminación automática de la lista local y notificación amigable "El evento ya no existe en el servidor".
  - Tras confirmación y respuesta exitosa del servidor: remoción inmediata del evento en el estado local (`setEvents(prev => prev.filter(...))`) y cierre del modal sin necesidad de recarga completa.
- **Commit:** *(Commit firmado actual de SCRUM-50)*

---

## Verificación de Calidad

- **Backend:**
  - Pruebas unitarias: **84 tests exitosos** (`npm test` con Vitest).
  - Pruebas e2e: **85 tests exitosos** (`npm run test:e2e`).
  - Linter: **0 warnings, 0 errors** (`npm run lint` con oxlint).
- **Mobile:**
  - Pruebas unitarias: **83 tests exitosos** (`npm test` con node --test).
  - Linter: **0 warnings, 0 errors** (`npm run lint` con expo/eslint).
  - TypeScript: **0 errores de tipos** (`npx tsc --noEmit`).

---

## Estado en Jira

- `SCRUM-47`: **Finalizada** (Listo) | Logged: 1h
- `SCRUM-48`: **Finalizada** (Listo) | Logged: 45m
- `SCRUM-49`: **Finalizada** (Listo) | Logged: 1h
- `SCRUM-50`: **Finalizada** (Listo) | Logged: 45m
- `SCRUM-36`: **Finalizada** (Listo) | Logged: 1h
