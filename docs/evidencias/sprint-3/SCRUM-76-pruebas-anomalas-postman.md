# Evidencia de Pruebas Anómalas en Postman (SCRUM-76)

- **Subtarea:** `SCRUM-76` (Ejecutar pruebas anómalas en Postman sobre la exportación y los errores 500)
- **Historia Principal:** `SCRUM-63` (Verificar criterios de codificación segura y trazabilidad de patrones del Sprint 3)
- **Épica:** `SCRUM-57` (Sprint 3 – Patrones Avanzados y Capacidades del Dispositivo)
- **Colección asociada:** `docs/postman/SecurePlan-Sprint-3-Export-Errores500.postman_collection.json`
- **Fecha de ejecución:** 2026-10-30
- **Tiempo invertido:** 1 hora

---

## 1. Objetivo y Criterios de Aceptación

Validar la robustez del backend frente a peticiones anómalas, maliciosas o malformadas dirigidas a los endpoints de exportación (`/api/events/export`) y a los endpoints transaccionales (`/api/events`, `/api/auth/login`), verificando que:
1. Las peticiones con tokens inexistentes, expirados o con firma manipulada devuelvan `401 Unauthorized` sin revelar información criptográfica interna.
2. Los parámetros no soportados (`?format=xml`) o con rangos invertidos (`startDate > endDate`) sean interceptados por la capa de validación devolviendo `400 Bad Request`.
3. Payloads JSON corruptos (corte de conexión o sintaxis incompleta) sean capturados por el filtro global devolviendo `400 Bad Request` con mensaje controlado (`"Cuerpo JSON malformado"`), sin volcar trazas del middleware `body-parser`.
4. Ante situaciones de error no controlado (código 500), el cuerpo de respuesta NUNCA exponga:
   - Stack traces o referencias a números de línea o archivos TypeScript/JavaScript (`.ts`, `.js`).
   - Nombres de tablas, esquemas, columnas o consultas SQL (`SELECT`, `INSERT`, `FROM`, etc.).
   - Rutas internas del sistema de archivos (`/home/`, `/app/node_modules/`, etc.).
   - Parámetros de conexión o puertos de la base de datos (`5432`, `ECONNREFUSED`).

---

## 2. Matriz de Casos de Prueba Ejecutados

| ID | Caso de Prueba | Método / Endpoint | Parámetros / Body | Status Esperado | Status Obtenido | Resultado |
|---|---|---|---|---|---|---|
| **CP-01** | Exportar sin token o token manipulado | `GET /api/events/export?format=json` | `Authorization: Bearer <invalido>` | `401 Unauthorized` | `401 Unauthorized` | **PASÓ** ✅ |
| **CP-02** | Formato no soportado | `GET /api/events/export?format=xml` | `format=xml` | `400 Bad Request` | `400 Bad Request` | **PASÓ** ✅ |
| **CP-03** | Rango de fechas invertido | `GET /api/events/export` | `startDate=2026-12-31&endDate=2026-01-01` | `400 Bad Request` | `400 Bad Request` | **PASÓ** ✅ |
| **CP-04** | Exportación sin eventos en rango | `GET /api/events/export` | `startDate=1970-01-01&endDate=1970-01-02` | `200 OK` (`[]`) | `200 OK` (`[]`) | **PASÓ** ✅ |
| **CP-05** | Payload JSON corrupto en POST | `POST /api/auth/login` | `{"email": "test@example.com", "password": ` | `400 Bad Request` | `400 Bad Request` | **PASÓ** ✅ |
| **CP-06** | Inyección SQL en parámetro format | `GET /api/events/export?format=json' OR '1'='1` | `format=json' OR '1'='1` | `400 Bad Request` | `400 Bad Request` | **PASÓ** ✅ |
| **CP-07** | Fallo no controlado / BD desconectada | `GET /api/events` | Simulación desconexión pool | `500 Internal Error` | `500 Internal Error` | **PASÓ** ✅ |
| **CP-08** | Descarga legítima JSON | `GET /api/events/export?format=json` | Token válido | `200 OK` (`application/json`) | `200 OK` | **PASÓ** ✅ |
| **CP-09** | Descarga legítima CSV | `GET /api/events/export?format=csv` | Token válido | `200 OK` (`text/csv`) | `200 OK` | **PASÓ** ✅ |

---

## 3. Detalle de Respuestas y Verificación de Seguridad

### Caso 1: Token inválido / firma alterada (CP-01)
- **Petición:** `GET /api/events/export?format=json` con token alterado.
- **Respuesta HTTP:** `401 Unauthorized`
- **Body obtenido:**
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized"
  }
  ```
- **Evaluación de seguridad:** No se filtran algoritmos de cifrado, secretos ni trazas de `jsonwebtoken`.

### Caso 2: Formato no soportado (CP-02)
- **Petición:** `GET /api/events/export?format=xml`
- **Respuesta HTTP:** `400 Bad Request`
- **Body obtenido:**
  ```json
  {
    "statusCode": 400,
    "message": [
      "format must be one of the following values: json, csv"
    ],
    "error": "Bad Request"
  }
  ```
- **Evaluación de seguridad:** Validación estricta en el DTO antes de llegar a la lógica de negocio.

### Caso 5: JSON corrupto a endpoint POST (CP-05)
- **Petición:** `POST /api/auth/login` con cuerpo truncado.
- **Respuesta HTTP:** `400 Bad Request`
- **Body obtenido:**
  ```json
  {
    "statusCode": 400,
    "message": "Cuerpo JSON malformado",
    "error": "Bad Request"
  }
  ```
- **Evaluación de seguridad:** Interceptado por `AllExceptionsFilter`. La traza original de Node.js (`SyntaxError: Unexpected end of JSON input`) fue suprimida completamente.

### Caso 7: Fallo no controlado (CP-07)
- **Petición:** `GET /api/events` forzando caída en capa de persistencia (`ECONNREFUSED`).
- **Respuesta HTTP:** `500 Internal Server Error`
- **Body obtenido:**
  ```json
  {
    "statusCode": 500,
    "message": "Error interno del servidor"
  }
  ```
- **Inspección de fugas:**
  - `stack` presente: **NO** ❌
  - Nombres de tablas SQL (`events`, `users`): **NO** ❌
  - Rutas del sistema (`/home/.../src/`): **NO** ❌
  - Detalles de red / driver (`pg`, `port 5432`): **NO** ❌

---

## 4. Conclusión

El comportamiento del servidor cumple en su totalidad con las directrices de seguridad OWASP y con los criterios de aceptación de `SCRUM-76`. Todas las solicitudes anómalas reciben respuestas normalizadas y sanitizadas.
