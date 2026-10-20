# 04 · Búsqueda de secretos en el repositorio (criterio 4)

**Objetivo:** comprobar que no hay contraseñas ni claves reales versionadas y que `.env` no está
trackeado.

**Método:** `git grep` sobre **solo archivos trackeados** (lo que se sube a GitHub), en la rama de la
verificación.

## Resultados

### 4.1 ¿Archivos `.env` trackeados?

```text
$ git ls-files | grep -E '\.env$'
(sin resultados)   → ✅ .env NO está versionado
```

Solo existen plantillas `.env.example` (raíz y `mobile/`), cuyos valores son placeholders:

```text
[.env.example]                [mobile/.env.example]
DB_HOST=<placeholder>         EXPO_PUBLIC_API_URL=<placeholder>
DB_PORT=<placeholder>         (documentado: las variables EXPO_PUBLIC_* son visibles en el
DB_NAME=<placeholder>          bundle y nunca deben contener secretos)
DB_USER=<placeholder>
DB_PASSWORD=<placeholder>
PORT=<placeholder>
JWT_SECRET=<placeholder>
JWT_EXPIRES_IN=<placeholder>
```

### 4.2 Patrones de credenciales reales

Búsqueda de claves privadas, access keys de AWS, tokens de GitHub, Slack, OpenAI y URLs de base de
datos con contraseña embebida:

```text
$ git grep -nEI "BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-|sk-[A-Za-z0-9]{20,}|postgres(ql)?://…:…@"
(sin coincidencias)   → ✅
```

### 4.3 Literales tipo "contraseña" con valor

La búsqueda de asignaciones `password|secret|api_key = "…"` encontró únicamente **fixtures de
pruebas** con valores falsos evidentes, propios de los tests del proyecto:

```text
backend/src/database/database-connection.spec.ts   password: 'unit-test-password'
backend/src/users/users.service.spec.ts            password: 'Secreta123'
backend/test/auth.e2e-spec.ts                      password: 'OtraClave123'  /  secret: 'otro-secreto'
backend/test/register.e2e-spec.ts                  password: 'Secreta123' (y variantes inválidas a propósito)
mobile/src/features/auth/*.test.ts                 password: 'Secreta123' (peticiones simuladas)
```

Son valores inventados dentro de pruebas (no corresponden a ningún servicio real) → ✅ sin
credenciales reales.

### 4.4 Contraseña de la cuenta local de pruebas

```text
$ git grep -n "Segura123"
(sin coincidencias)   → ✅ la contraseña de la cuenta local no aparece en el repo
```

## Conclusión

- ✅ `.env` y `mobile/.env` **no** están versionados (solo `.env.example` con placeholders).
- ✅ Sin claves privadas, tokens de servicios ni URLs con credenciales.
- ✅ Los únicos literales de "contraseña" son datos falsos de pruebas unitarias/e2e.
- Recordatorio operativo (del propio `.env.example`): generar `JWT_SECRET` propio y nunca versionarlo;
  si un secreto llega a exponerse, rotarlo (no basta con borrarlo del historial).
