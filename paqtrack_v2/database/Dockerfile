FROM mysql:8

# Variables de entorno por defecto (se sobreescriben con .env en docker-compose)
ENV MYSQL_ROOT_PASSWORD=root
ENV MYSQL_DATABASE=paqtrack_db

# Si quisieras cargar un SQL inicial al crear la base de datos,
# coloca el archivo .sql en esta carpeta y descomenta la siguiente línea:
# COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 3306
