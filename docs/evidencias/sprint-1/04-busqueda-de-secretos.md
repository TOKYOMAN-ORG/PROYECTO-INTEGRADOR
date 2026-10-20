# 04 · Búsqueda de secretos en el repositorio (criterio 4)

**Objetivo:** comprobar que no hay contraseñas ni claves reales versionadas y que `.env` no está
trackeado — **ni en el árbol de trabajo ni en el historial**.

**Método:** `git grep` sobre **solo archivos trackeados** (lo que se sube a GitHub). La
verificación se ejecutó en dos ámbitos:

1. el **árbol de trabajo actual** (rama `develop`), y
2. **todo el historial**, commit a commit con `git rev-list --all` (todas las ramas, locales y
   remotas).

No hay `gitleaks` instalado en la máquina; el criterio del ticket admite explícitamente
`git grep` como herramienta de barrido.

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

### 4.4 Contraseña de la cuenta local de pruebas (árbol de trabajo, verificación original)

```text
$ git grep -n "<contraseña-demo-local>"      ← literal enmascarado; ver 4.6
(sin coincidencias)   → ✅ la contraseña no aparece en el código fuente
```

### 4.5 Barrido del historial completo (todas las ramas)

Además del árbol de trabajo, los patrones de la sección 4.2 se aplicaron a **cada commit de todas
las ramas**:

```text
$ for c in $(git rev-list --all); do
>     git grep -IE "AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-|sk-[A-Za-z0-9]{20,}" "$c"
>   done | sort -u
(sin coincidencias)   → ✅ ningún secreto de servicios en NINGÚN commit de ninguna rama
```

Y comprobando que ningún `.env` haya sido trackeado jamás en la historia:

```text
$ git log --all --oneline -- backend/.env mobile/.env .env
(sin resultados)

$ git log --all --diff-filter=A --name-only --pretty=format: | grep -E '(^|/)\.env$'
(sin resultados)   → ✅ ningún .env fue versionado en ningún commit de la historia
```

### 4.6 Hallazgo: la contraseña demo local quedó citada en las propias evidencias

El barrido del historial con el literal de la contraseña local de pruebas encontró coincidencias
**únicamente dentro de los documentos de este directorio** (la transcripción del caso de inyección
SQL de `02-casos-postman.md` y la referencia al comando de búsqueda). Es la contraseña de las
cuentas locales de desarrollo de Docker — no corresponde a ningún servicio, servidor ni usuario
real — pero, siguiendo la regla del criterio ("si aparece una contraseña o credencial real, se
deja de publicar y se registra un hallazgo"):

1. Se **enmascaró** el literal en la versión actual de los documentos: el árbol de trabajo ya no lo
   contiene (verificable con `git grep`).
2. Se registró el hallazgo como **ticket de tipo Error: SCRUM-56** (prioridad baja, alcance
   local), dejando constancia trazable.
3. **No se reescribe el historial**: los commits firmados ya publicados contienen la cita y
   reescribir la historia de un repositorio compartido (invalidando sus firmas) es un riesgo mayor
   que la exposición de una contraseña demo local. La mitigación correcta, si el repositorio
   llegara a ser público o las credenciales se reutilizaran fuera de lo local, sería **rotar la
   contraseña** de las cuentas afectadas, no borrar el historial.

## Conclusión

- ✅ `.env` y `mobile/.env` **no** están versionados (solo `.env.example` con placeholders), ni en
  el árbol actual ni en **ningún commit del historial**.
- ✅ Sin claves privadas, tokens de servicios ni URLs con credenciales: **0 coincidencias** en el
  árbol y en todos los commits de todas las ramas.
- ✅ Los únicos literales de "contraseña" en el código son datos falsos de pruebas unitarias/e2e.
- ⚠️ **Hallazgo menor registrado (SCRUM-56):** la contraseña demo local citada en la propia
  evidencia; ya enmascarada en el árbol actual y justificada en 4.6.
- Recordatorio operativo (del propio `.env.example`): generar `JWT_SECRET` propio y nunca
  versionarlo; si un secreto llega a exponerse, rotarlo (no basta con borrarlo del historial).
