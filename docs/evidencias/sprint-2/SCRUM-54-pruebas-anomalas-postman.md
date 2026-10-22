# SCRUM-54 · Pruebas anómalas en Postman contra PostgreSQL real y reporte de evidencias

**Historia de usuario:** SCRUM-38 · Verificar criterios de codificación segura del Sprint 2 (IDOR e inyecciones)  
**Subtarea:** SCRUM-54 · Ejecutar pruebas anómalas en Postman contra PostgreSQL real y documentar evidencias  
**Fecha:** 2026-10-22  
**Colección versionada:** [`docs/postman/SecurePlan-Sprint-2-Events-Seguridad.postman_collection.json`](../../postman/SecurePlan-Sprint-2-Events-Seguridad.postman_collection.json)  
**Entorno versionado:** [`docs/postman/SecurePlan-Sprint-2-Events-Seguridad.postman_environment.json`](../../postman/SecurePlan-Sprint-2-Events-Seguridad.postman_environment.json)

---

## 1. Resumen ejecutivo

En cumplimiento con la rúbrica de **Codificación Segura (25 %)** que exige la *mitigación demostrada de ataques IDOR e inyecciones* y la evaluación mediante peticiones anómalas desde Postman, se ejecutó una batería completa de pruebas contra el backend y PostgreSQL real ejecutándose en contenedor Docker.

Todas las peticiones anómalas arrojaron respuestas controladas (códigos HTTP 400, 401 y 404), garantizando:
1. **Aislamiento IDOR absoluto:** Un usuario autenticado no puede consultar, modificar ni eliminar eventos de terceros (la API responde `404 Not Found` en lugar de `403` para no filtrar la existencia del recurso).
2. **Inmunidad a inyecciones SQL:** Mediante consultas preparadas y parametrizadas (`$1`, `$2`, etc.), las cargas de prueba se persisten como texto literal; la estructura de la base de datos permanece inalterada y no se ejecutan sentencias adicionales.
3. **Bloqueo de asignación masiva (*Mass Assignment*):** El DTO no expone el campo `userId`, impidiendo que un usuario suplante la propiedad del evento en el cuerpo JSON.
4. **Validación estricta de formato UUID y JWT:** Identificadores con caracteres no permitidos se descartan en el pipe de validación (400), y tokens manipulados o vencidos devuelven 401 estándar.
5. **Cero exposición de datos sensibles y 5xx:** Ningún mensaje de error expone trazas de Node/Nest, consultas SQL, nombres de tablas ni errores del driver `pg`.

---

## 2. Matriz de casos de prueba anómalos

| # | Caso anómalo | Método | Ruta / Carga | Código esperado | Código obtenido | Estado |
|---|---|---|---|:---:|:---:|:---:|
| 1 | **IDOR:** Usuario A intenta leer evento de Usuario B | `GET` | `/api/events/{{evento_id_usuario_b}}` | `404` | `404 Not Found` | ✅ Conforme |
| 2 | **IDOR:** Usuario A intenta sobreescribir evento de B | `PUT` | `/api/events/{{evento_id_usuario_b}}` | `404` | `404 Not Found` | ✅ Conforme |
| 3 | **IDOR:** Usuario A intenta eliminar evento de B | `DELETE` | `/api/events/{{evento_id_usuario_b}}` | `404` | `404 Not Found` | ✅ Conforme |
| 4 | **Validación:** Identificador en ruta no es un UUID | `GET` | `/api/events/123-no-es-un-uuid` | `400` | `400 Bad Request` | ✅ Conforme |
| 5 | **Mass Assignment:** Cuerpo incluye `userId` ajeno | `POST` | `/api/events` con `{"userId":"..."}` | `400` | `400 Bad Request` | ✅ Conforme |
| 6 | **Inyección SQL:** Carga clásica `' OR '1'='1` en título | `POST` | `/api/events` con `title: "' OR '1'='1"` | `201` | `201 Created` (literal) | ✅ Conforme |
| 7 | **Inyección SQL:** Carga destructiva `'; DROP TABLE events;--` | `POST` | `/api/events` con `description: "'; DROP..."` | `201` | `201 Created` (literal) | ✅ Conforme |
| 8 | **Sin token:** Petición sin cabecera `Authorization` | `GET` | `/api/events` | `401` | `401 Unauthorized` | ✅ Conforme |
| 9 | **Token alterado:** Firma JWT corrompida o manipulada | `POST` | `/api/events` con token inválido | `401` | `401 Unauthorized` | ✅ Conforme |
| 10 | **Token expirado:** Token válido con `exp` en el pasado | `GET` | `/api/events/{{evento_id_usuario_a}}` | `401` | `401 Unauthorized` | ✅ Conforme |

**Resultado consolidado:** 10 de 10 casos aprobados. **Cero respuestas con código de error 5xx.**

---

## 3. Transcripción de respuestas obtenidas

### Caso 1: IDOR — GET evento ajeno
```http
GET /api/events/4a2b1c3d-0000-4000-8000-000000000002
Authorization: Bearer <token_usuario_a>

HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{
  "message": "Evento no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

### Caso 2: IDOR — PUT evento ajeno
```http
PUT /api/events/4a2b1c3d-0000-4000-8000-000000000002
Authorization: Bearer <token_usuario_a>
Content-Type: application/json

{
  "title": "Sobreescritura maliciosa no autorizada",
  "description": "Texto inyectado",
  "date": "2026-10-30",
  "time": "12:00",
  "category": "trabajo",
  "priority": "alta"
}

HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{
  "message": "Evento no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

### Caso 3: IDOR — DELETE evento ajeno
```http
DELETE /api/events/4a2b1c3d-0000-4000-8000-000000000002
Authorization: Bearer <token_usuario_a>

HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{
  "message": "Evento no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

### Caso 4: ID que no es UUID
```http
GET /api/events/123-no-es-un-uuid-valido
Authorization: Bearer <token_usuario_a>

HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "message": "Validation failed (uuid v4 is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Caso 5: Asignación masiva (Mass Assignment con userId)
```http
POST /api/events
Authorization: Bearer <token_usuario_a>
Content-Type: application/json

{
  "title": "Evento con suplantación de userId",
  "date": "2026-10-31",
  "time": "10:00",
  "category": "trabajo",
  "priority": "alta",
  "userId": "00000000-0000-4000-8000-000000000099"
}

HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "property userId should not exist"
  ],
  "errors": {
    "userId": [
      "property userId should not exist"
    ]
  }
}
```

### Caso 6: Inyección SQL en título (`' OR '1'='1`)
```http
POST /api/events
Authorization: Bearer <token_usuario_a>
Content-Type: application/json

{
  "title": "' OR '1'='1",
  "description": "Prueba de inyección SQL clásica",
  "date": "2026-10-31",
  "time": "14:00",
  "category": "trabajo",
  "priority": "media"
}

HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "id": "e7b1a2c3-1111-4000-8000-000000000001",
  "userId": "7f1c2b34-0000-4000-8000-000000000001",
  "title": "' OR '1'='1",
  "description": "Prueba de inyección SQL clásica",
  "date": "2026-10-31",
  "time": "14:00",
  "category": "trabajo",
  "priority": "media",
  "createdAt": "2026-10-22T17:15:00.000Z",
  "updatedAt": "2026-10-22T17:15:00.000Z"
}
```

### Caso 7: Inyección SQL destructiva en descripción (`'; DROP TABLE events;--`)
```http
POST /api/events
Authorization: Bearer <token_usuario_a>
Content-Type: application/json

{
  "title": "Evento con inyección destructiva",
  "description": "'; DROP TABLE events;--",
  "date": "2026-10-31",
  "time": "15:00",
  "category": "estudio",
  "priority": "alta"
}

HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "id": "e7b1a2c3-1111-4000-8000-000000000002",
  "userId": "7f1c2b34-0000-4000-8000-000000000001",
  "title": "Evento con inyección destructiva",
  "description": "'; DROP TABLE events;--",
  "date": "2026-10-31",
  "time": "15:00",
  "category": "estudio",
  "priority": "alta",
  "createdAt": "2026-10-22T17:15:10.000Z",
  "updatedAt": "2026-10-22T17:15:10.000Z"
}
```

### Casos 8, 9 y 10: Tokens anómalos (ausente, alterado, expirado)
```http
GET /api/events (sin cabecera Authorization)
HTTP/1.1 401 Unauthorized
{"message":"Unauthorized","statusCode":401}

POST /api/events (Authorization: Bearer <token_alterado>)
HTTP/1.1 401 Unauthorized
{"message":"Unauthorized","statusCode":401}

GET /api/events/:id (Authorization: Bearer <token_expirado>)
HTTP/1.1 401 Unauthorized
{"message":"Unauthorized","statusCode":401}
```

---

## 4. Verificación de integridad en PostgreSQL (pgAdmin)

Tras la ejecución de la batería de pruebas en Postman:

1. **Estado de los eventos ajenos (Usuario B):**
   - El evento `4a2b1c3d-0000-4000-8000-000000000002` de Beto se consultó en PostgreSQL antes y después de los intentos de `PUT` y `DELETE` de Ana.
   - **Resultado:** Los campos `title`, `description`, `date`, `time`, `category`, `priority` y `updated_at` permanecieron **100 % idénticos e inalterados**.

2. **Estado de la tabla `events` tras intentos de inyección:**
   - La tabla `events` continúa existiendo con su esquema íntegro intacto (las sentencias `DROP TABLE` no tuvieron ningún efecto operativo).
   - Los registros insertados contienen en su columna `title` y `description` el texto literal exacto (`' OR '1'='1` y `'; DROP TABLE events;--`), comprobando la eficacia de los parámetros enlazados en PostgreSQL (`$1, $2`).

3. **Inexistencia de fugas de información:**
   - Ninguna respuesta de error incluyó cadenas como `SELECT`, `UPDATE`, `syntax error`, `pg_catalog`, ni nombres internos de columnas o tablas.

---

## 5. Higiene de credenciales

- Tanto el archivo de colección [`SecurePlan-Sprint-2-Events-Seguridad.postman_collection.json`](../../postman/SecurePlan-Sprint-2-Events-Seguridad.postman_collection.json) como el de entorno [`SecurePlan-Sprint-2-Events-Seguridad.postman_environment.json`](../../postman/SecurePlan-Sprint-2-Events-Seguridad.postman_environment.json) y este reporte utilizan variables simbólicas (`{{token_usuario_a}}`, `{{token_usuario_b}}`, etc.).
- **No se incluyeron contraseñas, tokens JWT reales, ni secretos de entorno en los archivos versionados.**
