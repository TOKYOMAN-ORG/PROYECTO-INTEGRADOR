# Imagen oficial de Liquibase + driver JDBC de PostgreSQL.
# Desde Liquibase 5.0 la imagen no incluye drivers; se instalan con `lpm` al construir la imagen
# (no en cada ejecución), así las migraciones no dependen de la red ni de versiones flotantes.
FROM liquibase/liquibase:5.0.4

USER root
RUN lpm add postgresql@42.7.13 --global && chown -R liquibase:liquibase /liquibase/lib
USER liquibase
