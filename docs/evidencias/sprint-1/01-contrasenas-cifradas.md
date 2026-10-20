# 01 · Contraseñas cifradas en la base de datos (criterio 1)

**Objetivo:** comprobar que en la tabla `users` todos los registros tienen `password_hash` con
prefijo `$argon2id$`, que no existe ninguna columna con la contraseña original y que **dos usuarios
registrados con la misma contraseña obtienen hashes distintos** (sal aleatoria por registro).

**Método:** consulta directa a la base local (`secureplan`) con `psql` dentro del contenedor
Docker `secureplan-db-1` — el equivalente por línea de comandos a lo que se muestra en pgAdmin.
Los cuatro usuarios se crearon con el **flujo real de registro** (`POST /api/auth/register`);
tres de ellos con contraseñas distintas entre sí y dos de ellos **a propósito con la misma
contraseña** para la prueba de la última sección.
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

## Listado completo de usuarios (equivalente a pgAdmin)

```sql
SELECT id, email, password_hash FROM users ORDER BY email;
```

```text
                  id                  |      email      |                                           password_hash
--------------------------------------+-----------------+---------------------------------------------------------------------------------------------------
 2cd36187-91cc-4979-897a-58424f7365d0 | ana@example.com | $argon2id$v=19$m=65536,p=4,t=3$BYKWj2lCtGREVTEZdI2LNg$ryC/L661qTYDo6VqE4BYx1gGCQZn6Xx1ZXHBpnnWEk8
 3e12cfc3-4d11-4ca5-bee8-502b48f9760e | jose@demo.com   | $argon2id$v=19$m=65536,p=4,t=3$oE1n60M+UPHoFgXYqFOcfg$imFsldd15CFaRRpjjoKmPk8urhNIEG8CIYvPfypnl+Q
 9c958ab0-1164-41ff-890f-8b08802d8505 | lucas@demo.com  | $argon2id$v=19$m=65536,p=4,t=3$vegXZJjP0e3HVdSZfiydUg$/XpJr2vBeQb7kIvwVgUj7iYaqLBg7CUXC4Dc9ftXI9E
 a0e2f503-f9e8-41c8-8440-d4e729b63f66 | maria@demo.com  | $argon2id$v=19$m=65536,p=4,t=3$VAi+OqOEsjBU5sHTFmyTLg$lon25PkpprdLZa4CU3rEs5ITPVdFEmtADPyR+ATPHcM
(4 rows)
```

Ninguna fila contiene la contraseña original; todos los valores empiezan por `$argon2id$`.

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
 lucas@demo.com  | $argon2id$ |         97 | t
 maria@demo.com  | $argon2id$ |         97 | t
(4 rows)
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
              4 |            4 |            0
(1 row)
```

## Misma contraseña ⇒ hashes distintos (sal por usuario)

Dos cuentas creadas con **exactamente la misma contraseña** (no publicada en el repositorio)
producen `password_hash` distintos, gracias a la sal aleatoria que Argon2id genera en cada
registro:

```sql
-- Dos cuentas creadas con LA MISMA contraseña (no publicada) => hashes distintos
SELECT a.email                                     AS usuario_a,
       b.email                                     AS usuario_b,
       a.password_hash = b.password_hash           AS mismos_hashes,
       a.password_hash                             AS hash_a,
       b.password_hash                             AS hash_b
FROM users a, users b
WHERE a.email = 'jose@demo.com' AND b.email = 'lucas@demo.com';
```

```text
   usuario_a   |   usuario_b    | mismos_hashes |                    hash_a                    |                    hash_b
---------------+----------------+---------------+----------------------------------------------+----------------------------------------------
 jose@demo.com | lucas@demo.com | f             | $argon2id$v=19$m=65536,p=4,t=3$oE1n60M+UPHo | $argon2id$v=19$m=65536,p=4,t=3$vegXZJjP0e3HV
               |                |               | FgXYqFOcfg$imFsldd15CFaRRpjjoKmPk8urhNIEG8C | dSZfiydUg$/XpJr2vBeQb7kIvwVgUj7iYaqLBg7CUX
               |                |               | IYvPfypnl+Q                                  | C4Dc9ftXI9E
(1 row)
```

`mismos_hashes = f` → los hashes **no coinciden** pese a compartir contraseña (ambos íntegros en
el listado de la sección anterior). Es la demostración directa de la sal por usuario.

## Conclusión

- ✅ **4/4 usuarios** con hash Argon2id (`$argon2id$…`, 97 caracteres); **0** sin el prefijo.
- ✅ Ninguna columna almacena la contraseña original.
- ✅ **Misma contraseña → hashes distintos** (`mismos_hashes = f`), demostrando la sal aleatoria
  por registro.
- El hashing se produce en `backend/src/users/password.service.ts` con `argon2` en modo **argon2id**
  y **sal aleatoria por usuario** (cada registro genera un hash distinto aunque la clave fuera igual).
