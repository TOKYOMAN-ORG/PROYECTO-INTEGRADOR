## Ticket de Jira

<!-- Clave del ticket. Ejemplo: SCRUM-3 -->
SCRUM-

## Descripción

<!-- Qué cambia y por qué. Enlaza el requerimiento o criterio de aceptación que atiende. -->

## Tipo de cambio

- [ ] Funcionalidad nueva (`feat`)
- [ ] Corrección de error (`fix`)
- [ ] Refactorización sin cambio funcional (`refactor`)
- [ ] Pruebas (`test`)
- [ ] Documentación (`docs`)
- [ ] Mantenimiento, configuración o infraestructura (`chore`)

## Cómo se probó

<!-- Pruebas automatizadas ejecutadas y verificación manual realizada, con su resultado. -->

## Checklist de seguridad

- [ ] No hay credenciales, tokens, claves ni secretos en el código, los commits ni esta PR.
- [ ] `.env` sigue ignorado por git y `.env.example` solo contiene valores ficticios.
- [ ] Ninguna contraseña se guarda ni se registra en texto plano (solo hashes Argon2).
- [ ] El JWT solo se almacena en Expo SecureStore, nunca en almacenamiento común.
- [ ] Los logs y mensajes de error no exponen datos sensibles.
- [ ] Las consultas a la base de datos están parametrizadas.
- [ ] Los cambios de esquema se hacen únicamente con migraciones Liquibase.
- [ ] Las dependencias nuevas o modificadas fueron revisadas y son necesarias.

## Checklist de la PR

- [ ] La rama sigue la convención `feature/SCRUM-<n>-descripcion` (ver `CONTRIBUTING.md`).
- [ ] Los commits siguen Conventional Commits y están firmados (aparecen como *Verified*).
- [ ] Las pruebas y el build pasan en local.
- [ ] Revisé el diff completo y no incluye cambios ajenos al ticket.
