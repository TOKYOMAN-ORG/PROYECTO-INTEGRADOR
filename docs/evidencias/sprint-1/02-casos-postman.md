# 02 · Casos de peticiones anómalas (criterio 2)

**Objetivo:** demostrar que la API responde de forma controlada ante peticiones anómalas, con los
casos mínimos que pide SCRUM-9 (y extras), y que **ninguna** responde 5xx.

**Método:** `curl` contra `http://localhost:3001/api` (equivalente reproducible a la colección de
Postman adjunta: [postman-coleccion.json](postman-coleccion.json)).
*(Espacio reservado para `postman-casos.png` al ejecutar la colección en Postman.)*

## Resumen de resultados

| # | Caso | Petición | Esperado (SCRUM-9) | Obtenido | OK |
|---|---|---|---|---|---|
| 1 | Correo duplicado | `POST /api/auth/register` | 409 | `409 Conflict` | ✅ |
| 2 | Registro con cuerpo vacío | `POST /api/auth/register` | 400 | `400` con errores por campo | ✅ |
| 2b | Login con cuerpo vacío | `POST /api/auth/login` | 400 | `400` con errores por campo | ✅ |
| 3 | Credenciales inválidas | `POST /api/auth/login` | 401 genérico | `401` «Credenciales inválidas» | ✅ |
| 4 | Inyección SQL en el correo (login) | `POST /api/auth/login` | no autentica | `400` (rechazo en validación) | ✅ |
| 4b | Inyección SQL en el correo (registro) | `POST /api/auth/register` | no crea ni autentica | `400` (rechazo en validación) | ✅ |
| 5 | Token alterado (1 carácter de la firma) | `GET /api/auth/me` | 401 | `401` | ✅ |
| 6 | Token expirado (`exp` en el pasado) | `GET /api/auth/me` | 401 | `401` | ✅ |
| 7 | Sin cabecera Authorization *(extra)* | `GET /api/auth/me` | 401 | `401` | ✅ |
| 8 | Token firmado con otro secreto *(extra)* | `GET /api/auth/me` | 401 | `401` | ✅ |

**Códigos devueltos:** `409 400 400 401 400 400 401 401 401 401` → ✅ **ninguna respuesta 5xx.**

## Transcripción completa

```text
CASO 1: Registro con correo duplicado (cuenta existente)
POST /api/auth/register  {"name":"Otro Usuario","email":"<cuenta existente>","password":"OtraClave123"}
HTTP 409
{"message":"El correo ya está registrado","error":"Conflict","statusCode":409}

CASO 2: Registro con cuerpo vacío
POST /api/auth/register  {}
HTTP 400
{"statusCode":400,"error":"Bad Request","message":["El nombre debe tener entre 2 y 100 caracteres",
"El nombre es obligatorio","El correo no puede superar 255 caracteres","El correo no tiene un formato
válido","La contraseña no puede superar 128 caracteres","La contraseña debe tener al menos 8 caracteres",
"La contraseña es obligatoria"],"errors":{…por campo…}}

CASO 2b: Login con cuerpo vacío
POST /api/auth/login  {}
HTTP 400
{"statusCode":400,"error":"Bad Request","message":["El correo no puede superar 255 caracteres",
"El correo no tiene un formato válido","La contraseña no puede superar 128 caracteres",
"La contraseña es obligatoria","La contraseña es obligatoria"],"errors":{…por campo…}}

CASO 3: Login con credenciales inválidas (contraseña incorrecta)
POST /api/auth/login  {"email":"<cuenta existente>","password":"NoEsLaClave99"}
HTTP 401
{"message":"Credenciales inválidas","error":"Unauthorized","statusCode":401}

CASO 4: Inyección SQL en el correo del login (' OR 1=1;--)
POST /api/auth/login  {"email":"' OR 1=1;--","password":"x"}
HTTP 400
{"statusCode":400,"error":"Bad Request","message":["El correo no tiene un formato válido"],
"errors":{"email":["El correo no tiene un formato válido"]}}

CASO 4b: Inyección SQL en el correo del registro
POST /api/auth/register  {"name":"Atacante","email":"' OR 1=1;--","password":"<contraseña-demo>"}
HTTP 400
{"statusCode":400,"error":"Bad Request","message":["El correo no tiene un formato válido"],
"errors":{"email":["El correo no tiene un formato válido"]}}

CASO 5: Token alterado (1 carácter de la firma cambiado)
GET /api/auth/me  Authorization: Bearer <token válido con un carácter mutado>
HTTP 401
{"message":"Unauthorized","statusCode":401}

CASO 6: Token expirado (firmado con el mismo secreto pero exp en el pasado)
GET /api/auth/me  Authorization: Bearer <token desechable ya expirado>
HTTP 401
{"message":"Unauthorized","statusCode":401}

CASO 7: GET /auth/me sin token (extra)
GET /api/auth/me
HTTP 401
{"message":"Unauthorized","statusCode":401}

CASO 8: Token firmado con otro secreto (extra)
GET /api/auth/me  Authorization: Bearer <token con firma ajena>
HTTP 401
{"message":"Unauthorized","statusCode":401}
```

## Análisis

- **Misma respuesta 401 genérico** para «credenciales inválidas» (login), token alterado, token
  expirado, token ausente y token ajeno: no se distingue la causa ni se filtra qué correos existen
  (`backend/src/auth/auth.service.ts`, `backend/src/auth/jwt-auth.guard.ts`).
- **Inyección SQL bloqueada en dos capas:** (1) el DTO exige un correo con formato válido
  (`@IsEmail` en `backend/src/auth/dto/*.ts`), por lo que el payload nunca llega a la base; y (2) el
  repositorio usa **consultas parametrizadas** con `$1` (`backend/src/users/users.repository.ts`),
  donde un valor nunca puede interpretarse como SQL.
- **Payload del JWT mínimo** (solo `sub`, `iat`, `exp`; ni correo ni datos del usuario):
  `{"sub":"3e12cfc3-…-502b48f9760e","iat":1792525247,"exp":1792526147}`.
- **Errores de validación 400 con lista por campo** (`message` + `errors`) y sin volcado de stack
  (`backend/src/common/app-setup.ts`).
