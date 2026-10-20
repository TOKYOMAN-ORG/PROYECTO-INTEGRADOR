# Evidencias — Sprint 1 · SCRUM-9: verificación de criterios de codificación segura

- **Fecha de la verificación:** 2026-10-20
- **Rama:** `feature/SCRUM-9-verificacion-seguridad`
- **Entorno evaluado:** backend NestJS en ejecución (`http://localhost:3001/api`), PostgreSQL local en
  Docker (`secureplan-db-1`, proyecto `secureplan`) y app Expo SDK 57.
- **Cuenta de prueba local:** creada mediante `POST /api/auth/register`. Las credenciales **no se
  publican** en el repositorio; cada integrante crea la suya propia (ver "Cómo reproducir").

## Resultado por criterio de aceptación

| # | Criterio (SCRUM-9) | Resultado | Evidencia |
|---|---|---|---|
| 1 | Todos los usuarios con `password_hash` prefijo `$argon2id$`; ninguna columna con la contraseña original | ✅ 2/2 usuarios con `$argon2id$` (0 sin prefijo); la tabla `users` no tiene columna de contraseña | [01-contrasenas-cifradas.md](01-contrasenas-cifradas.md) |
| 2 | ≥ 6 casos Postman (409 duplicado, 400 vacío, 401 genérico, SQLi sin autenticar, token alterado, token expirado); ninguno responde 500 | ✅ **10 peticiones**: 409, 400, 400, 401, 400, 400, 401, 401, 401, 401 — **sin ninguna 5xx** | [02-casos-postman.md](02-casos-postman.md) · [postman-coleccion.json](postman-coleccion.json) |
| 3 | El token solo se lee/escribe mediante Expo SecureStore (sin AsyncStorage ni localStorage) | ✅ único punto de acceso: `mobile/src/storage/secure-token-storage.ts` | [03-almacenamiento-token-movil.md](03-almacenamiento-token-movil.md) |
| 4 | Búsqueda de secretos sin credenciales reales; `.env` sin versionar | ✅ sin coincidencias de credenciales reales; `.env` no trackeado; solo `.env.example` con placeholders | [04-busqueda-de-secretos.md](04-busqueda-de-secretos.md) |
| 5 | Evidencias en `docs/evidencias/sprint-1/` | ✅ este directorio | — |

## Capturas (pgAdmin / Postman)

La verificación se ejecutó de forma **reproducible por línea de comandos** (psql dentro del contenedor
y curl contra la API), por lo que las "capturas" equivalentes son las transcripciones de salida
incluidas en los archivos `01`–`04`. Si la evaluación en clase exige capturas gráficas, déjalas en
este mismo directorio con estos nombres y enlázalas aquí:

- `pgadmin-users.png` — pgAdmin → tabla `users` (muestra los hashes `$argon2id$`).
- `postman-casos.png` → Postman → colección importada ejecutando los casos (códigos 409/400/401).

## Cómo reproducir

1.Levanta la base y el backend (desde la raíz del repo, con tu `.env` local):
   ```bash
   docker compose up -d db
   cd backend && npm run start:dev   # o node dist/main
   ```
2. Crea tu cuenta de prueba: `POST http://localhost:3001/api/auth/register` con
   `{"name":"Prueba","email":"tu@correo.com","password":"TuClave123"}`.
3. Importa [postman-coleccion.json](postman-coleccion.json) en Postman y define las variables
   `test_email` / `test_password` con tus datos. Ejecuta la colección.
4. Para la consulta de pgAdmin, ejecuta la sentencia SQL del archivo `01` sobre la base `secureplan`.

> Nota: el backend evaluado corresponde a `develop` + el commit de CORS (`app.enableCors()`) de la rama
> `feature/SCRUM-8-navegacion-protegida`, que no altera la lógica de autenticación verificada aquí.
