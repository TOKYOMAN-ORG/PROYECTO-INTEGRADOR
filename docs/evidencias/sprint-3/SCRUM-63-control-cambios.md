# Control de Tiempos y Registro de Actividad — SCRUM-63: Verificar criterios de codificación segura y trazabilidad de patrones del Sprint 3

- **Historia principal:** `SCRUM-63` (Verificar criterios de codificación segura y trazabilidad de patrones del Sprint 3)
- **Épica:** `SCRUM-57` (Sprint 3 – Patrones Avanzados y Capacidades del Dispositivo)
- **Rama:** `feature/SCRUM-63-cierre-subtareas-sprint-3`
- **Fecha de realización:** 2026-10-30
- **Responsable:** Ariel Martinez

---

## Resumen de Subtareas y Control de Tiempos

| Subtarea | Resumen | Tiempo Estimado | Tiempo Invertido | Estado | Commit Firmado |
|---|---|---|---|---|---|
| **SCRUM-78** | Documentar dónde se implementan Singleton (`DatabaseConnection`), Strategy (`ExportStrategy`) y Observer (`EventsSubject` / `NotificationObserver`), con pasos para demo en vivo. | 2h | 1h | **Completado** ✅ | `bd22d6a` |
| **SCRUM-76** | Colección y ejecución de pruebas anómalas en Postman sobre exportación y errores 500, verificando sanitización de errores. | 4h | 1h | **Completado** ✅ | `8e8deeb` |
| **SCRUM-77** | Pruebas en dispositivo/emulador de recordatorios locales, recuperación ante error global y resiliencia en Modo Avión. | 4h | 1h | **Completado** ✅ | `c476ff2` |
| **TOTAL** | **Historia completa SCRUM-63** | **10h** | **3h** | **Completado** ✅ | *(Un commit firmado por subtarea)* |

---

## Registro Consolidado de Subtareas de Cierre de Sprint 3

Además de `SCRUM-63`, en esta rama se completaron las subtareas pendientes que bloqueaban el cierre del Sprint 3:

| Tarea Padre | Subtarea | Resumen | Tiempo Invertido | Estado Jira | Commit Firmado |
|---|---|---|---|---|---|
| `SCRUM-62` | **SCRUM-74** | Filtro global de excepciones en backend (`AllExceptionsFilter`) para ocultar detalles internos. | 1h | **Listo** ✅ | `088be4e` |
| `SCRUM-62` | **SCRUM-75** | Pruebas e2e en backend contra fuga de datos internos y simulación de desconexión. | 1h | **Listo** ✅ | `1498973` |
| `SCRUM-61` | **SCRUM-72** | ErrorBoundary con pantalla de recuperación en mobile y sanitización de credenciales. | 1h | **Listo** ✅ | `c5a922e` |
| `SCRUM-61` | **SCRUM-73** | Handlers globales de excepciones no capturadas y promesas rechazadas en mobile. | 1h | **Listo** ✅ | `1741da0` |
| `SCRUM-63` | **SCRUM-78** | Trazabilidad documental de Singleton, Strategy y Observer en `docs/patrones-de-diseno.md`. | 1h | **Listo** ✅ | `bd22d6a` |
| `SCRUM-63` | **SCRUM-76** | Pruebas anómalas en Postman y colección en `docs/postman/`. | 1h | **Listo** ✅ | `8e8deeb` |
| `SCRUM-63` | **SCRUM-77** | Pruebas de recordatorios, error global y modo avión en dispositivo. | 1h | **Listo** ✅ | *(este commit)* |

Con esto, el 100% de las subtareas del Sprint 3 se encuentran finalizadas, probadas y registradas con sus respectivos tiempos en Jira.
