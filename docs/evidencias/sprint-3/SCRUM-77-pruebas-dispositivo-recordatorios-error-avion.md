# Evidencia de Pruebas en Dispositivo y Emulador: Recordatorios, Error Global y Modo Avión (SCRUM-77)

- **Subtarea:** `SCRUM-77` (Probar en emulador o dispositivo los recordatorios, el error global y el modo avión)
- **Historia Principal:** `SCRUM-63` (Verificar criterios de codificación segura y trazabilidad de patrones del Sprint 3)
- **Épica:** `SCRUM-57` (Sprint 3 – Patrones Avanzados y Capacidades del Dispositivo)
- **Fecha de realización:** 2026-10-30
- **Entorno de prueba:** Dispositivo físico Android 14 (Pixel 7) y navegador Web (Modo Responsive iPhone 14 Pro Max / Android Viewport)
- **Tiempo invertido:** 1 hora

---

## 1. Resumen Ejecutivo

Se verificaron las capacidades integradas del dispositivo móvil desarrolladas a lo largo del Sprint 3:
1. **Ciclo de vida de recordatorios locales:** Verificación del canal de notificaciones de alta importancia y el cálculo de anticipación (10 minutos antes del evento) ante creación, edición, borrado y cambio de sesión.
2. **Pantalla de recuperación ante fallos de renderizado (ErrorBoundary):** Comportamiento controlado de la interfaz cuando un componente lanza una excepción en tiempo de ejecución.
3. **Resiliencia ante pérdida de conectividad (Modo Avión):** Funcionamiento offline del dispositivo, garantizando que la aplicación maneje de manera elegante la falta de conexión HTTP, no se cierre inesperadamente y los recordatorios programados a nivel de sistema operativo continúen activos.

---

## 2. Matriz de Pruebas Ejecutadas

| ID | Escenario de Prueba | Pasos de Reproducción | Comportamiento Esperado | Comportamiento Obtenido | Estado |
|---|---|---|---|---|---|
| **PR-01** | **Crear evento y programar recordatorio** | 1. Iniciar sesión.<br>2. Crear un evento fechado hoy a 15 minutos en el futuro.<br>3. Observar la agenda. | Se calcula el disparo con `getReminderDate` (-10 min) y se invoca `scheduleNotificationAsync` con id del evento. | Notificación local agendada con trigger en +5 minutos. Canal `reminders` activo. | **PASÓ** ✅ |
| **PR-02** | **Editar evento (reprogramación limpia)** | 1. Cambiar la hora del evento 30 minutos más tarde.<br>2. Guardar cambios. | Se cancela la notificación anterior (`cancelScheduledNotificationAsync`) y se agenda una nueva con la nueva hora. | Sin notificaciones duplicadas. Solo una activa para el evento. | **PASÓ** ✅ |
| **PR-03** | **Eliminar evento (cancelación)** | 1. Eliminar el evento desde el detalle o lista.<br>2. Confirmar borrado. | Se cancela la notificación asociada usando el id del evento. | Disparo cancelado en el sistema operativo. | **PASÓ** ✅ |
| **PR-04** | **Cierre de sesión (limpieza total)** | 1. Ir a perfil / ajustes.<br>2. Presionar «Cerrar sesión». | `cancelAllReminders()` cancela todas las alertas para evitar alertar eventos de un usuario desconectado. | Cero notificaciones pendientes en el dispositivo. | **PASÓ** ✅ |
| **PR-05** | **Inicio / Restauración de sesión** | 1. Iniciar sesión con credenciales válidas. | `AuthProvider` sincroniza y reprograma los eventos de los próximos 30 días. | Recordatorios futuros re-agendados correctamente. | **PASÓ** ✅ |
| **PR-06** | **Pantalla de error global (ErrorBoundary)** | 1. Forzar un fallo de renderizado no capturado en un componente hijo.<br>2. Observar pantalla. | No hay pantalla blanca ni cierre abrupto (crash). Se muestra la pantalla amigable de recuperación con icono de advertencia y botón «Intentar de nuevo». | Pantalla de recuperación mostrada; el botón reinicia el estado del boundary limpiamente. | **PASÓ** ✅ |
| **PR-07** | **Modo Avión (Sin red) y persistencia de avisos** | 1. Activar Modo Avión.<br>2. Navegar en la app y solicitar sincronización.<br>3. Esperar hora del recordatorio agendado previamente. | La app atrapa el fallo de red mostrando mensaje amigable «Comprueba tu conexión». La app permanece responsiva y el recordatorio suena a la hora fijada por el SO. | Sin crash. Mensaje de error controlado. Notificación mostrada a tiempo sin requerir internet. | **PASÓ** ✅ |

---

## 3. Detalle Técnico de la Implementación Verificada

### A. Canal de Notificaciones y Tolerancia Offline
- En `mobile/src/features/reminders/notifications.ts`, las notificaciones se registran en el gestor de alarmas nativo del sistema operativo (`expo-notifications`).
- Al ejecutarse localmente en el dispositivo, no dependen de conexión activa a internet ni de servidores push externos (FCM/APNs) para dispararse a la hora programada, lo que garantiza su funcionamiento en **Modo Avión**.

### B. Manejo Global de Excepciones en Móvil
- En `mobile/src/components/error-boundary.tsx` y `mobile/src/utils/report-error.ts`, cualquier error de renderizado es capturado, sanitizado (omitiendo cabeceras de autorización, tokens y contraseñas) y presentado al usuario mediante un estado degradado visual con opción de reintentar.
- En `mobile/src/utils/global-error-handler.ts`, las promesas rechazadas no capturadas (`unhandledrejection`) y errores globales de JavaScript (`ErrorUtils`) son interceptados sin abortar el runtime de la aplicación.

---

## 4. Conclusión

Las pruebas en emulador y dispositivo confirman que la aplicación móvil cumple con todos los criterios de robustez, confiabilidad en modo sin conexión y resiliencia ante errores exigidos en el Sprint 3.
