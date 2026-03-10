# PaqTrack v2

Sistema de seguimiento de paquetes por salidas de máquinas clasificadoras. Cada empresa tiene una máquina con varias salidas físicas (cintas) y cada vez que un paquete pasa por una salida se registra su código de barras, el número de salida y la fecha.

---

## Tecnologías

**Backend central**
- Node.js + Express — API REST
- MySQL 8 — Base de datos
- JWT + bcryptjs — Autenticación y cifrado de contraseñas
- Docker + Docker Compose — Contenedores

**Backend cliente**
- Node.js — Script de sincronización automática cada 15 minutos
- MySQL 8 — Base de datos local del cliente
- setInterval — Sincronización periódica sin dependencias externas

**Frontend**
- Angular 17 — Standalone components
- Tailwind CSS — Estilos

---

## Estructura del proyecto

```
paqtrack_v2/
├── .env
├── docker-compose.yml
├── database/                        # Dockerfile MySQL compartido
├── backend/                         # API central
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── config/
│       │   ├── db.js                # Pool de conexión MySQL
│       │   └── db.init.js           # Creación de tablas
│       ├── middleware/
│       │   └── auth.middleware.js   # verificarToken, soloAdmin, soloSuperadmin, filtroEmpresa
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── empresa.controller.js
│       │   ├── usuarios.controller.js
│       │   ├── salidas.controller.js
│       │   └── sync.controller.js   # Recibe datos del backend cliente
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── empresa.routes.js
│       │   ├── usuarios.routes.js
│       │   ├── salidas.routes.js
│       │   └── sync.routes.js
│       └── seeders/
│           ├── superadmin.seeder.js
│           └── datos.seeder.js
├── backend_cliente/                 # Script de sincronización del cliente
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js                 # Arranque + setInterval cada 15 min
│       ├── db.js                    # Conexión a la BD local del cliente
│       ├── db.init.js               # Crea tablas y datos de prueba
│       └── sync.js                  # Lógica de sincronización con el central
└── frontend/
    └── frontend-angular/
        └── src/app/
            ├── models/models.ts     # Interfaces TypeScript
            ├── services/            # auth, empresa, salidas, usuarios
            ├── guards/
            │   └── auth.guard.ts    # Protege rutas privadas
            └── pages/
                ├── login/
                ├── dashboard/       # Vista diferente según rol
                └── busqueda/
```

---

## Arquitectura de sincronización

```
BD local cliente → backend_cliente → POST /api/sync → backend_central → BD central
                        ↑
                  cada 15 minutos
                  (setInterval)
```

El `backend_cliente` guarda en su tabla `sync_log` la fecha de la última sincronización exitosa. En cada ciclo solo envía los registros más nuevos que esa fecha, evitando duplicados.

---

## Base de datos central

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
| codigo_empresa | INT FK | Empresa (NULL si superadmin) |
| correo | VARCHAR | Email único |
| contrasena | VARCHAR | Hasheada con bcrypt |
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
| **superadmin** | Ve todo — empresas, usuarios y salidas de todas las empresas |
| **admin** | Ve solo su empresa — usuarios y salidas propias |
| **usuario** | Solo puede buscar paquetes por código de barras |

---

## Arranque

### Requisitos
- Docker Desktop instalado

### Levantar el proyecto completo

```bash
docker-compose up --build
```

Levanta 4 contenedores:
- `paqtrack_db_central` — MySQL BD central
- `paqtrack_api` — Backend central en puerto 3000
- `paqtrack_db_cliente` — MySQL BD del cliente (simulación)
- `paqtrack_cliente` — Script de sync, sincroniza cada 15 min

Al arrancar por primera vez:
```
✅ MySQL listo
✅ Tablas creadas / verificadas
✅ Superadmin creado: admin@paqtrack.com / admin123
✅ GLS creada con 300 salidas
✅ SEUR creada con 300 salidas
✅ MRW creada con 300 salidas
🚀 Servidor en http://localhost:3000

✅ MySQL cliente listo
✅ 50 salidas de prueba insertadas en BD cliente
⏰ Sincronización cada 15 minutos
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

### Usuarios
| Método | Ruta | Descripción | Rol mínimo |
|---|---|---|---|
| GET | /api/usuarios | Lista de usuarios | admin |
| GET | /api/usuarios/:id | Detalle de un usuario | admin |

### Salidas
| Método | Ruta | Descripción | Rol mínimo |
|---|---|---|---|
| GET | /api/salidas | Lista con filtros y paginación | usuario |
| GET | /api/salidas/estadisticas | Estadísticas | usuario |
| GET | /api/salidas/buscar/:codigoBarras | Historial de un paquete | usuario |
| GET | /api/salidas/:id | Detalle de una salida | usuario |

### Sync (uso interno)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | /api/sync | Recibe salidas del backend cliente | API Key |

---

## Variables de entorno

```
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=paqtrack_db
JWT_SECRET=clave_secreta_cambiar_en_produccion
DB_HOST=db_central
DB_USER=root
DB_PASSWORD=root
DB_NAME=paqtrack_db
PORT=3000
SYNC_API_KEY=sync_secret_key
```

> ⚠️ Cambia `JWT_SECRET` y `SYNC_API_KEY` por valores seguros antes de desplegar en producción.
