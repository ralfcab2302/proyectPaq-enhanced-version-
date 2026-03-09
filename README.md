# PaqTrack v2

Sistema de seguimiento de paquetes por salidas de máquinas clasificadoras. Cada empresa tiene una máquina con varias salidas físicas (cintas) y cada vez que un paquete pasa por una salida se registra su código de barras, el número de salida y la fecha.

---

## Tecnologías

- **Node.js + Express** — API REST
- **MySQL 8** — Base de datos
- **JWT + bcryptjs** — Autenticación y cifrado de contraseñas
- **Docker + Docker Compose** — Contenedores

---

## Estructura del proyecto

```
paqtrack_v2/
├── .env
├── docker-compose.yml
├── database/
│   └── Dockerfile
└── backend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── index.js
        ├── config/
        │   ├── db.js              # Pool de conexión MySQL
        │   └── db.init.js         # Creación de tablas
        ├── middleware/
        │   └── auth.middleware.js # verificarToken, soloAdmin, soloSuperadmin, filtroEmpresa
        ├── controllers/
        │   ├── auth.controller.js
        │   ├── empresa.controller.js
        │   ├── usuarios.controller.js
        │   └── salidas.controller.js
        ├── routes/
        │   ├── auth.routes.js
        │   ├── empresa.routes.js
        │   ├── usuarios.routes.js
        │   └── salidas.routes.js
        └── seeders/
            ├── superadmin.seeder.js  # Crea el superadmin inicial
            └── datos.seeder.js       # Crea empresas, usuarios y salidas de ejemplo
```

---

## Base de datos

### Tablas

**empresa**
| Campo | Tipo | Descripción |
|---|---|---|
| codigo | INT PK | Id de la empresa |
| nombre | VARCHAR | Nombre de la empresa |
| contacto | VARCHAR | Email de contacto |

**usuarios**
| Campo | Tipo | Descripción |
|---|---|---|
| codigo_usuario | INT PK | Id del usuario |
| codigo_empresa | INT FK | Empresa a la que pertenece (NULL si superadmin) |
| correo | VARCHAR | Email único |
| contrasena | VARCHAR | Contraseña hasheada con bcrypt |
| rol | ENUM | superadmin / admin / usuario |

**salidas**
| Campo | Tipo | Descripción |
|---|---|---|
| codigo | INT PK | Id del registro |
| codigo_empresa | INT FK | Empresa de la máquina |
| nro_salida | INT | Número físico de la cinta (1-40) |
| codigo_barras | VARCHAR | Código del paquete |
| fecha_salida | DATETIME | Fecha y hora de clasificación |

---

## Roles

| Rol | Permisos |
|---|---|
| **superadmin** | Ve y gestiona todo — empresas, usuarios y salidas de todas las empresas |
| **admin** | Ve y gestiona solo su empresa — usuarios y salidas propias |
| **usuario** | Solo puede buscar paquetes por código de barras |

---

## Arranque

### Requisitos
- Docker Desktop instalado

### Levantar el proyecto

```bash
docker-compose up --build
```

Al arrancar por primera vez se ejecutan automáticamente los seeders:

```
✅ MySQL listo
✅ Tablas creadas / verificadas
✅ Superadmin creado: admin@paqtrack.com / admin123
✅ GLS creada con 300 salidas
✅ SEUR creada con 300 salidas
✅ MRW creada con 300 salidas
🚀 Servidor en http://localhost:3000
```

### Parar el proyecto

```bash
docker-compose down
```

### Parar y borrar todos los datos

```bash
docker-compose down -v
```

---

## Usuarios de prueba

| Correo | Contraseña | Rol |
|---|---|---|
| admin@paqtrack.com | admin123 | superadmin |
| admin@gls.com | admin123 | admin GLS |
| admin@seur.com | admin123 | admin SEUR |
| admin@mrw.com | admin123 | admin MRW |
| usuario1@gls.com | usuario123 | usuario GLS |
| usuario2@gls.com | usuario123 | usuario GLS |

---

## Endpoints

### Auth
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | /api/auth/login | Login, devuelve JWT | No |
| GET | /api/auth/perfil | Datos del usuario logueado | Sí |

### Empresas
| Método | Ruta | Descripción | Rol mínimo |
|---|---|---|---|
| GET | /api/empresas | Lista de empresas | admin |
| GET | /api/empresas/:id | Detalle de una empresa | admin |
| POST | /api/empresas | Crear empresa | superadmin |
| PUT | /api/empresas/:id | Editar empresa | superadmin |
| DELETE | /api/empresas/:id | Eliminar empresa | superadmin |

### Usuarios
| Método | Ruta | Descripción | Rol mínimo |
|---|---|---|---|
| GET | /api/usuarios | Lista de usuarios | admin |
| GET | /api/usuarios/:id | Detalle de un usuario | admin |
| POST | /api/usuarios | Crear usuario | admin |
| PUT | /api/usuarios/:id | Editar usuario | admin |
| DELETE | /api/usuarios/:id | Eliminar usuario | admin |

### Salidas
| Método | Ruta | Descripción | Rol mínimo |
|---|---|---|---|
| GET | /api/salidas | Lista de salidas con filtros y paginación | usuario |
| GET | /api/salidas/estadisticas | Estadísticas de salidas | usuario |
| GET | /api/salidas/buscar/:codigoBarras | Historial de un código de barras | usuario |
| GET | /api/salidas/:id | Detalle de una salida | usuario |
| POST | /api/salidas | Registrar una salida | admin |
| DELETE | /api/salidas/:id | Eliminar una salida | superadmin |

---

## Ejemplos de uso

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@paqtrack.com","contrasena":"admin123"}'
```

### Obtener salidas con filtros
```
GET /api/salidas?nro_salida=5&desde=2026-01-01&pagina=1&limite=20
```

### Buscar paquete por código de barras
```
GET /api/salidas/buscar/ABC123456789
```

---

## Variables de entorno

El archivo `.env` contiene:

```
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=paqtrack_db
JWT_SECRET=clave_secreta_cambiar_en_produccion
DB_HOST=db
DB_USER=root
DB_PASSWORD=root
DB_NAME=paqtrack_db
PORT=3000
```

> ⚠️ Cambia `JWT_SECRET` por una clave segura antes de desplegar en producción.
