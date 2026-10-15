# Guía de contribución

Reglas para que todo cambio sea trazable al ticket de Jira, esté firmado y llegue al repositorio mediante Pull Request.

## Flujo de trabajo

1. Parte de `develop` actualizada y crea una rama por ticket.
2. Haz commits pequeños, con mensajes convencionales y firmados.
3. Abre una Pull Request hacia `develop` con la plantilla precargada.
4. Una persona distinta a quien la abrió la revisa y la aprueba.
5. Tras la aprobación se integra en `develop`. `main` recibe cambios únicamente desde `develop`, también por Pull Request.

Nunca hagas `git push` directo a `main` ni a `develop`, ni fuerces el historial (`--force`) de ramas compartidas.

## Convención de ramas

Formato: `<tipo>/SCRUM-<n>-<descripcion-corta>`, en minúsculas y con guiones.

| Prefijo | Uso |
|---|---|
| `feature/` | Funcionalidad nueva, tareas e infraestructura |
| `fix/` | Corrección de errores |
| `chore/` | Mantenimiento y configuración sin impacto funcional |

Ejemplos:

```text
feature/SCRUM-3-flujo-git-prs-firmadas
fix/SCRUM-42-error-login-token-expirado
```

La clave `SCRUM-<n>` es la del ticket (o subtarea) de Jira que atiende la rama.

## Convención de commits

Se usa [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/): `<tipo>(<alcance opcional>): <resumen en imperativo>`.

| Tipo | Uso |
|---|---|
| `feat:` | Funcionalidad nueva |
| `fix:` | Corrección de un error |
| `chore:` | Mantenimiento, configuración o dependencias |
| `docs:` | Solo documentación |
| `refactor:` | Reestructuración sin cambio funcional |
| `test:` | Alta o cambio de pruebas |

Ejemplos:

```text
feat(auth): registrar usuario con contraseña cifrada con Argon2
fix(auth): rechazar el login cuando el JWT está expirado
chore: agregar plantilla de Pull Request
```

Reglas: resumen de hasta ~72 caracteres, una idea por commit y, cuando ayude, la clave del ticket en el cuerpo.

## Firma de commits

Todos los commits deben llevar firma verificable. Con una clave SSH (la forma más simple):

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

1. En GitHub: **Settings → SSH and GPG keys → New SSH key**, y elige el tipo **Signing Key** (aunque ya la tengas como clave de autenticación, debe registrarse también como firma).
2. El correo de `git config user.email` debe estar **verificado en tu cuenta de GitHub**; si no, el commit no aparecerá como *Verified*.
3. Para comprobar la firma en local, indica a Git qué claves son de confianza:

   ```bash
   echo "$(git config user.email) $(cat ~/.ssh/id_ed25519.pub)" > ~/.ssh/allowed_signers
   git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
   git log --show-signature -1
   ```

Si prefieres GPG, consulta la [documentación de GitHub](https://docs.github.com/es/authentication/managing-commit-signature-verification). Nunca versiones ni compartas tu clave privada.

## Pull Requests

- El título lleva la clave del ticket: `SCRUM-3: establecer flujo Git con PR obligatorias`.
- Completa la plantilla: ticket, descripción, tipo de cambio, pruebas y checklist de seguridad.
- La PR debe contener solo cambios relacionados con el ticket.
- Mínimo **1 aprobación** de otra persona antes de integrar; no te apruebes tu propia PR.
- Si llegan nuevos commits tras una aprobación, vuelve a pedir revisión.

## Seguridad

- Nunca subas credenciales, tokens, claves ni archivos `.env`; usa `.env.example` con valores ficticios.
- Ninguna contraseña en texto plano (solo hashes Argon2) y el JWT únicamente en Expo SecureStore.
- Si detectas un secreto expuesto, avisa de inmediato al equipo para revocarlo o rotarlo; borrarlo del último commit no lo elimina del historial.
