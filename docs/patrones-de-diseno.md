# Patrones de Diseño de Software — SecurePlan (Sprint 3)

Este documento detalla la arquitectura y trazabilidad de los tres patrones de diseño implementados y evaluados en el proyecto integrador **SecurePlan**, cubriendo el problema que resuelven, la ubicación exacta en el código fuente y el procedimiento para demostrarlos en vivo.

---

## 1. Patrón Creacional: Singleton

### Problema que resuelve
En aplicaciones backend que interactúan con bases de datos relacionales, abrir conexiones sin control satura el servidor de base de datos y agota los recursos de memoria. El patrón **Singleton** asegura que exista una única instancia compartida del gestor de conexiones a PostgreSQL en toda la aplicación, centralizando la configuración, el ciclo de vida del pool (`pg.Pool`) y el cierre ordenado de conexiones al apagar el servidor.

### Ubicación en el código
- **Archivo:** [`backend/src/database/database-connection.ts`](../backend/src/database/database-connection.ts)
- **Clase:** `DatabaseConnection`

### Elementos clave de implementación
- **Constructor privado:** Impide que otras clases creen instancias arbitrarias con `new DatabaseConnection()`.
- **Instancia estática:** Propiedad privada `static instance: DatabaseConnection | null = null`.
- **Punto de acceso global:** Método estático `DatabaseConnection.getInstance(config?)` que devuelve la instancia existente o la inicializa la primera vez.
- **Ciclo de vida en NestJS:** Implementa `OnApplicationShutdown` para cerrar el pool de conexiones (`pool.end()`) y liberar la instancia única al recibir señales `SIGTERM`/`SIGINT`.

### Cómo demostrarlo en vivo
1. Abrir la prueba unitaria [`backend/src/database/database-connection.spec.ts`](../backend/src/database/database-connection.spec.ts) o ejecutar en Node:
   ```ts
   const db1 = DatabaseConnection.getInstance(config);
   const db2 = DatabaseConnection.getInstance();
   console.log(db1 === db2); // true (misma referencia en memoria)
   ```
2. Ejecutar la prueba e2e de health check (`npm run test:e2e -- backend/test/health.e2e-spec.ts`):
   - Se comprueba que `GET /api/health` utiliza el Singleton real para consultar `SELECT 1`.
   - Se comprueba que al llamar `app.close()`, el Singleton se destruye limpiamente y no quedan conexiones colgadas.

---

## 2. Patrón de Comportamiento: Strategy

### Problema que resuelve
El módulo de exportación de la agenda debe soportar múltiples formatos de salida (`JSON` y `CSV` con RFC 4180 y protección contra inyección de fórmulas CSV), con la previsión de incorporar nuevos formatos en el futuro (ej. `iCal` o `PDF`) sin modificar el controlador ni romper el principio Abierto/Cerrado (*Open/Closed Principle*). El patrón **Strategy** encapsula cada algoritmo de formateo en clases intercambiables que implementan una interfaz común.

### Ubicación en el código
- **Interfaz Strategy:** [`backend/src/events/export/export-strategy.interface.ts`](../backend/src/events/export/export-strategy.interface.ts) (`ExportStrategy`)
- **Estrategia JSON:** [`backend/src/events/export/json-export.strategy.ts`](../backend/src/events/export/json-export.strategy.ts) (`JsonExportStrategy`)
- **Estrategia CSV:** [`backend/src/events/export/csv-export.strategy.ts`](../backend/src/events/export/csv-export.strategy.ts) (`CsvExportStrategy`)
- **Contexto:** [`backend/src/events/export/events-export.service.ts`](../backend/src/events/export/events-export.service.ts) (`EventsExportService`)
- **Controlador:** [`backend/src/events/events.controller.ts`](../backend/src/events/events.controller.ts) (`GET /api/events/export`)

### Elementos clave de implementación
- **Contrato común:**
  ```ts
  export interface ExportStrategy {
    readonly format: 'json' | 'csv';
    readonly contentType: string;
    readonly fileExtension: string;
    serialize(events: Event[]): string;
  }
  ```
- **Selección dinámica en el servicio:** `EventsExportService` recibe un mapa de estrategias indexado por formato (`Map<ExportFormat, ExportStrategy>`). Al procesar la solicitud, selecciona la estrategia correspondiente y ejecuta `strategy.serialize(events)` sin sentencias condicionales acopladas.

### Cómo demostrarlo en vivo
1. Iniciar el backend (`npm run start:dev` en `backend/`).
2. Obtener un token JWT con `POST /api/auth/login`.
3. Ejecutar las dos variantes de exportación demostrando la respuesta según la estrategia activa:
   - **Formato JSON:**
     ```bash
     curl -i -H "Authorization: Bearer <token>" "http://localhost:3001/api/events/export?format=json"
     # Cabecera Content-Type: application/json; Content-Disposition: attachment; filename="agenda-....json"
     ```
   - **Formato CSV:**
     ```bash
     curl -i -H "Authorization: Bearer <token>" "http://localhost:3001/api/events/export?format=csv"
     # Cabecera Content-Type: text/csv; Content-Disposition: attachment; filename="agenda-....csv"
     ```
4. Mostrar en el código que agregar un nuevo formato requeriría únicamente implementar una nueva clase `ExportStrategy` sin tocar el controlador de eventos.

---

## 3. Patrón de Comportamiento: Observer

### Problema que resuelve
En la aplicación móvil, cuando un usuario crea, edita, elimina o sincroniza eventos de su agenda, es necesario actualizar automáticamente los recordatorios y notificaciones locales nativas del sistema operativo. Acoplar el servicio de eventos directamente a `expo-notifications` violaría el principio de responsabilidad única (*Single Responsibility Principle*) e impediría agregar otros interesados futuros (ej. analíticas, registro local o widgets). El patrón **Observer** desacopla el sujeto que origina el evento de los observadores suscritos.

### Ubicación en el código
- **Sujeto (Subject):** [`mobile/src/features/events/events-subject.ts`](../mobile/src/features/events/events-subject.ts) (`EventsSubject`)
- **Contrato del Observador:** [`mobile/src/features/events/events-subject.ts`](../mobile/src/features/events/events-subject.ts) (`EventObserver`)
- **Observador Concreto:** [`mobile/src/features/reminders/notification-observer.ts`](../mobile/src/features/reminders/notification-observer.ts) (`NotificationObserver`)
- **Gestión de Sesión:** [`mobile/src/features/reminders/reminders-session.ts`](../mobile/src/features/reminders/reminders-session.ts)

### Elementos clave de implementación
- **Contrato del Observer:**
  ```ts
  export interface EventObserver {
    update(change: EventChange): void;
  }
  ```
- **Notificación asíncrona segura:** En `EventsSubject.notify(change)`, cada observador suscrito recibe el cambio. Si un observador lanza una excepción, el sujeto captura el error sin interrumpir a los demás observadores.
- **Reacción del NotificationObserver:**
  - `created` / `updated`: Cancela el recordatorio previo del evento y agenda uno nuevo 10 minutos antes de la hora acordada.
  - `deleted`: Cancela el recordatorio programado en el sistema operativo.
  - `loaded`: Programa las notificaciones de los eventos futuros al iniciar sesión.

### Cómo demostrarlo en vivo
1. Ejecutar las pruebas unitarias de integración del patrón en mobile:
   ```bash
   npm test --prefix mobile
   ```
2. Observar la suite `EventsSubject` y `NotificationObserver`:
   - Verifica que `eventsSubject.notify({ type: 'created', event })` dispara `NotificationObserver.update()`.
   - Verifica que cancelar la suscripción mediante `subscribe()` previene la entrega de futuros eventos.
   - Verifica que al cerrar sesión (`reminders-session.ts`), el observador se desuscribe y todos los recordatorios locales pendientes se cancelan inmediatamente con `cancelAllReminders()`.

---

## Resumen de Trazabilidad para la Evaluación

| Patrón | Tipo | Archivo Principal | Clase / Interfaz | Demostración |
|---|---|---|---|---|
| **Singleton** | Creacional | `backend/src/database/database-connection.ts` | `DatabaseConnection` | Única referencia del pool a PostgreSQL y ciclo de vida en `health.e2e-spec.ts`. |
| **Strategy** | Comportamiento | `backend/src/events/export/export-strategy.interface.ts` | `JsonExportStrategy`, `CsvExportStrategy` | `GET /api/events/export?format=json` vs `format=csv`. |
| **Observer** | Comportamiento | `mobile/src/features/events/events-subject.ts` | `EventsSubject`, `NotificationObserver` | Sincronización automática de mutaciones de agenda con notificaciones nativas en `notification-observer.test.ts`. |
