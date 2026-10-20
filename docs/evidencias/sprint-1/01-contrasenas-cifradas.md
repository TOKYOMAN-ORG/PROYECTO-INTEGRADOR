# 01 · Contraseñas cifradas en la base de datos (criterio 1)

**Objetivo:** comprobar que en la tabla `users` todos los registros tienen `password_hash` con
prefijo `$argon2id$` y que no existe ninguna columna con la contraseña original.

**Método:** consulta directa a la base local (`secureplan`) con `psql` dentro del contenedor
Docker `secureplan-db-1` — el equivalente por línea de comandos a lo que se muestra en pgAdmin.
*(Espacio reservado para `pgAdmin-users.png` al evaluar en clase.)*

## Esquema de la tabla `users`

```sql
SELECT ordinal_position, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

```text
 ordinal_position |     column_name     |          data_type
------------------+---------------------+----------------------------
                1 | id                  | uuid
                2 | name                | character varying
                3 | email               | character varying
                4 | password_hash       | character varying
                5 | created_at          | timestamp with time zone
                6 | updated_at          | timestamp with time zone
```

**Hallazgo:** la única columna relacionada con la contraseña es `password_hash`. No hay columnas
`password`, `password_plain` ni equivalentes.

## Prefijo Argon2id de cada usuario

```sql
SELECT email,
       left(password_hash, 10)                    AS prefijo,
       length(password_hash)                      AS caracteres,
       password_hash LIKE '$argon2id$%'           AS argon2id_ok
FROM users ORDER BY email;
```

```text
      email      |  prefijo   | caracteres | argon2id_ok
-----------------+------------+------------+-------------
 ana@example.com | $argon2id$ |         97 | t
 jose@demo.com   | $argon2id$ |         97 | t
```

## Recuento global

```sql
SELECT count(*)                                                 AS usuarios_total,
       count(*) FILTER (WHERE password_hash LIKE '$argon2id$%') AS con_argon2id,
       count(*) FILTER (WHERE password_hash NOT LIKE '$argon2id$%') AS sin_argon2id
FROM users;
```

```text
 usuarios_total | con_argon2id | sin_argon2id
----------------+--------------+--------------
              2 |            2 |            0
```

## Conclusión

- ✅ **2/2 usuarios** con hash Argon2id (`$argon2id$…`, 97 caracteres); **0** sin el prefijo.
- ✅ Ninguna columna almacena la contraseña original.
- El hashing se produce en `backend/src/users/password.service.ts` con `argon2` en modo **argon2id**
  y **sal aleatoria por usuario** (cada registro genera un hash distinto aunque la clave fuera igual).
