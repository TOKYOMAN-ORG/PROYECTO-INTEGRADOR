# Control de Tiempos y Registro de Actividad — SCRUM-37: Enviar el JWT automáticamente con interceptores HTTP globales

- **Historia Principal:** `SCRUM-37` (Enviar el JWT automáticamente con interceptores HTTP globales)
- **Épica:** `SCRUM-33` (Sprint 2 – Core de la Agenda / Módulo de Eventos)
- **Rama:** `feature/SCRUM-37-interceptores-http-jwt`
- **Fecha de realización:** 2026-10-21
- **Responsable:** Jose Ariel (Lead Fullstack & Security Engineer)

---

## Resumen de Subtareas y Control de Tiempos

| Subtarea | Resumen | Tiempo Estimado | Tiempo Invertido | Estado | Commit Firmado |
|---|---|---|---|---|---|
| **SCRUM-51** | Implementar arquitectura de interceptores de petición en `http-client.ts`, registrando `jwtRequestInterceptor` para adjuntar `Authorization: Bearer <token>` automáticamente en rutas privadas y excluyendo rutas públicas (`/api/auth/login`, `/api/auth/register`). | 4h | 1h 00m | **Completado** ✅ | `d6dad28` |
| **SCRUM-52** | Implementar arquitectura de interceptores de respuesta en `http-client.ts` con detección de 401 en rutas autenticadas, eliminación del token en SecureStore (`deleteToken`), deduplicación ante 401 simultáneos, notificación a `AuthProvider` y redirección a Login con «Tu sesión expiró». | 3h | 45m | **Completado** ✅ | *(Commit actual)* |
| **TOTAL** | **Historia Completa SCRUM-37** | **7h** | **1h 45m** | **Completado** ✅ | *(Un commit firmado por cada subtarea)* |

---

## Detalle Técnico por Subtarea

### 1. `SCRUM-51` — Interceptor de petición que adjunta el JWT automáticamente
- **Archivos modificados:**
  - `mobile/src/services/http-client.ts`
  - `mobile/src/services/http-client.test.ts`
  - `mobile/src/storage/secure-token-storage.ts`
- **Detalle de cambios:**
  - En `mobile/src/services/http-client.ts` se implementó el sistema de interceptores de petición (`RequestInterceptor`, `RequestInterceptorContext`).
  - Se exportaron las utilidades `addRequestInterceptor`, `clearRequestInterceptors` e `isPublicPath(path)`.
  - Se registró `jwtRequestInterceptor`:
    - Verifica si la ruta es pública (`/api/auth/login` o `/api/auth/register`); si es pública, omite la cabecera `Authorization`.
    - Si es una ruta privada y existe un token en `SecureStore` (obtenido mediante `getToken()`), adjunta `Authorization: Bearer <token>` siempre y cuando el llamador no haya proporcionado una cabecera previa.
    - Si no hay token o si `getToken()` falla, la petición continúa sin cabecera y sin lanzar error.
    - El token nunca es expuesto en logs ni mensajes de error.
  - En `mobile/src/storage/secure-token-storage.ts` se adaptó la importación dinámica segura para `expo-secure-store`, permitiendo fallback a memoria en entornos Node/testing sin requerir mocks complejos en todos los módulos consumidores.
  - Pruebas unitarias añadidas en `http-client.test.ts` validando:
    - Inclusión de `Authorization: Bearer <token>` en rutas autenticadas con token guardado.
    - Omisión de cabecera en `/api/auth/login` y `/api/auth/register`.
    - Envío sin cabecera y sin error cuando no hay token persistido.
    - Respeto de cabeceras manuales de autorización previas.
    - Registro y desregistro de interceptores personalizados.
- **Commit:** `d6dad28` (`feat(mobile): implementar interceptor de peticion para adjuntar jwt automaticamente (SCRUM-51)`)

---

### 2. `SCRUM-52` — Interceptor de respuesta que cierra la sesión ante 401
- **Archivos modificados:**
  - `mobile/src/services/http-client.ts`
  - `mobile/src/services/http-client.test.ts`
  - `mobile/src/features/auth/auth-context.tsx`
  - `mobile/src/app/(auth)/login.tsx`
- **Detalle de cambios:**
  - En `mobile/src/services/http-client.ts`:
    - Se agregó el sistema de interceptores de respuesta (`ResponseInterceptorContext`, `ResponseInterceptor`).
    - Se implementó `handleUnauthorizedSession()` con semáforo/flag `isHandlingUnauthorized` para evitar duplicidad de ejecuciones ante ráfagas de 401 simultáneos.
    - Al detectar un 401 en ruta autenticada, borra el token con `deleteToken()` y dispara los listeners suscritos vía `onSessionExpired()`.
    - Rutas públicas (ej. 401 en `/api/auth/login` por credenciales inválidas) quedan explícitamente excluidas del cierre de sesión.
    - Errores de red o 5xx no disparan el cierre de sesión ni remueven el token.
  - En `mobile/src/features/auth/auth-context.tsx`:
    - Se suscribió a `onSessionExpired()` dentro de `AuthProvider`.
    - Se introdujo el estado `sessionExpired` y la acción `clearSessionExpired()`, transitando el estado de autenticación a `unauthenticated`.
  - En `mobile/src/app/(auth)/login.tsx`:
    - Renderizado accesible del mensaje «Tu sesión expiró» si `sessionExpired` está activo o si se recibe el parámetro `expired` en la URL.
    - Limpieza automática del mensaje al enviar de nuevo el formulario de login.
  - Pruebas unitarias exhaustivas en `http-client.test.ts` cubriendo:
    - Borrado de token y notificación ante 401 en ruta autenticada.
    - Inmunidad del login ante 401 por credenciales incorrectas (no borra ni notifica expiración).
    - Deduplicación de llamadas concurrentes ante múltiples 401 simultáneos.
    - Preservación de sesión ante errores 5xx y fallos de conexión.
    - Ciclo de vida y desregistro de interceptores de respuesta.
- **Commit:** *(Commit firmado actual de SCRUM-52)*

---

## Verificación de Calidad

- **Mobile:**
  - Pruebas unitarias: **94 tests exitosos** (`npm test` con node --test).
  - Linter: **0 warnings, 0 errors** (`npm run lint` con expo/eslint).
  - TypeScript: **0 errores de tipos** (`npx tsc --noEmit`).
- **Backend:**
  - Pruebas unitarias: **84 tests exitosos**.
  - Pruebas e2e: **85 tests exitosos**.
  - Linter: **0 warnings, 0 errors**.

---

## Estado en Jira

- `SCRUM-51`: **Finalizada** (Listo) | Logged: 1h
- `SCRUM-52`: **Finalizada** (Listo) | Logged: 45m
- `SCRUM-37`: **Finalizada** (Listo) | Logged: 1h
