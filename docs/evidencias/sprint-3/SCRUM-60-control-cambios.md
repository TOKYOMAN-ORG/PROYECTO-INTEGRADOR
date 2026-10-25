# Control de Tiempos y Registro de Actividad — SCRUM-60: Recibir recordatorios locales de mis eventos

- **Historia principal:** `SCRUM-60` (Recibir recordatorios locales de mis eventos)
- **Épica:** `SCRUM-57` (Sprint 3 – Patrones Avanzados y Capacidades del Dispositivo)
- **Rama:** `feature/SCRUM-60-recordatorios-locales` (parte de `feature/SCRUM-59-patron-observer-alertas`, de la que depende)
- **Fecha de realización:** 2026-10-25
- **Responsable:** Mario Rafael Solis Suarez

---

## Resumen de Subtareas y Control de Tiempos

| Subtarea | Resumen | Tiempo Estimado | Tiempo Invertido | Estado | Commit Firmado |
|---|---|---|---|---|---|
| **SCRUM-69** | Instalación de `expo-notifications`, handler de primer plano, canal «Recordatorios» de Android con importancia alta y solicitud única de permiso. | 3h | 1h | **Completado** ✅ | `58956b7` |
| **SCRUM-70** | `NotificationObserver` y `getReminderDate`: programa, reemplaza y cancela recordatorios 10 minutos antes según los cambios de la agenda. | 6h | 1h | **Completado** ✅ | `758171d` |
| **SCRUM-71** | Cancelación de todos los recordatorios al cerrar sesión o recibir un 401 y reprogramación de los próximos 30 días al iniciar o restaurar la sesión. | 3h | 1h | **Completado** ✅ | `f3c6c35` |
| **TOTAL** | **Historia completa SCRUM-60** | **12h** | **3h** | **Completado** ✅ | *(Un commit firmado por subtarea)* |

---

## Flujo del patrón Observer

```text
Pantallas ──► events-api.ts ──notify()──► eventsSubject ──update()──► NotificationObserver ──► expo-notifications
                                                 ▲
AuthProvider ──startReminders / stopReminders────┘ (subscribe / unsubscribe + cancelar todo)
```

Solo `mobile/src/features/reminders/` importa `expo-notifications`; ninguna pantalla conoce el API de notificaciones.

---

## Detalle Técnico por Subtarea

### 1. `SCRUM-69` — Configurar `expo-notifications`
- **Archivos modificados/creados:**
  - `mobile/package.json`, `mobile/package-lock.json` (`expo-notifications ~57.0.24`, instalado con `npx expo install`)
  - `mobile/app.json` (plugin `expo-notifications`)
  - `mobile/src/features/reminders/notifications.ts`
  - `mobile/src/features/reminders/notifications.test.ts`
- **Detalle de cambios:**
  - `configureNotifications()` (idempotente): `setNotificationHandler` con `shouldShowBanner` y `shouldShowList` en `true` para que el aviso se muestre con la app en primer plano, y canal `reminders` («Recordatorios») con `AndroidImportance.HIGH`. En iOS y web crear el canal no hace nada.
  - `ensureNotificationPermission()`: crea el canal antes de pedir el permiso (requisito de Android 13+), devuelve `true` si ya está concedido, `false` si el sistema ya no permite preguntar, y solicita el permiso una sola vez. Nunca lanza.
  - `cancelAllReminders()` para el cierre de sesión.
  - 6 pruebas unitarias con `expo-notifications` simulado.
- **Commit:** `58956b7`

---

### 2. `SCRUM-70` — Observer de notificaciones
- **Archivos creados:**
  - `mobile/src/features/reminders/reminder-date.ts`
  - `mobile/src/features/reminders/notification-observer.ts`
  - `mobile/src/features/reminders/notification-observer.test.ts`
- **Detalle de cambios:**
  - `getReminderDate(date, time, now, leadMinutes = 10)`: fecha y hora locales menos 10 minutos; `null` si ese instante ya pasó o los datos no son válidos. Acepta `HH:mm` y `HH:mm:ss`.
  - `NotificationObserver implements EventObserver`:
    - `created` / `updated`: cancela el aviso previo (identificador = id del evento) y programa uno nuevo con el título del evento y disparo `DATE` en el canal de recordatorios; editar no deja duplicados.
    - `deleted`: cancela el aviso del evento.
    - `loaded`: programa solo los eventos futuros sin aviso pendiente.
    - Sin permiso no programa nada. Los cambios se procesan en orden en una cola y cualquier fallo del API nativo queda dentro del observer.
  - 12 pruebas unitarias: cálculo de la hora de aviso, programación, reemplazo, cancelación, carga sin duplicados, aviso ya vencido, permiso denegado y aislamiento de fallos.
- **Commit:** `758171d`

---

### 3. `SCRUM-71` — Recordatorios ligados a la sesión
- **Archivos modificados/creados:**
  - `mobile/src/features/reminders/reminders-session.ts`
  - `mobile/src/features/reminders/reminders-session.test.ts`
  - `mobile/src/features/auth/auth-context.tsx`
- **Detalle de cambios:**
  - `startReminders(token)`: suscribe el observer (una sola vez) y carga con `getEvents` de hoy a 30 días, lo que publica `loaded` y reprograma los avisos sin duplicar. Si falla por falta de red no lanza ni interrumpe el inicio de sesión.
  - `stopReminders()`: desuscribe el observer, espera los cambios en curso y cancela todos los avisos (`cancelAllScheduledNotificationsAsync`).
  - `AuthProvider`: llama `startReminders` al autenticarse o restaurar la sesión, `stopReminders` dentro de `signOut()` antes de terminar, al recibir un 401 (`onSessionExpired`) y al quedar sin sesión. Si la sesión no se pudo verificar por falta de red se conservan el token y los avisos.
  - 4 pruebas unitarias: ventana de 30 días, sin duplicados al volver a entrar, cierre de sesión sin avisos y fallo de red controlado.
- **Commit:** `f3c6c35`

---

## Verificación de Calidad

- **Mobile:**
  - Pruebas unitarias: **129 tests exitosos** (`npm test` con node --test), 22 nuevos.
  - Linter: **0 warnings, 0 errors** (`npm run lint` con expo/eslint).
  - TypeScript: **0 errores de tipos** (`npx tsc --noEmit`).
  - Bundle: `npx expo export --platform ios --platform android` genera ambos bundles sin errores.
- **Pendiente:** la prueba en emulador o dispositivo (aviso real en primer y segundo plano, permiso denegado) corresponde a la tarea de verificación del sprint.

---

## Estado en Jira

- `SCRUM-69`: **Finalizada** | Logged: 1h
- `SCRUM-70`: **Finalizada** | Logged: 1h
- `SCRUM-71`: **Finalizada** | Logged: 1h
- `SCRUM-60`: **Finalizada**
