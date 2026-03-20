beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    console.error.mockRestore();
});



jest.mock('../config/db.js', () => ({
    pool: {
        query: jest.fn(),
        end: jest.fn(),
        getConnection: jest.fn().mockResolvedValue({ release: jest.fn() })
    }
}));

import request from 'supertest';
import app from '../index.js';
import { pool } from '../config/db.js';

afterEach(() => {
    jest.clearAllMocks();
});

// ── GET /api/salidas ──────────────────────────────────────────────────────
describe('GET /api/salidas', () => {
    let token;

    beforeAll(async () => {
        pool.query.mockResolvedValueOnce([[{
            codigo_usuario: 1,
            codigo_empresa: 1,
            correo: 'admin@gls.com',
            contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            rol: 'admin'
        }]]);
        const res = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'admin@gls.com', contrasena: 'password' });
        token = res.body.token;
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app).get('/api/salidas');
        expect(res.statusCode).toBe(401);
    });

    it('devuelve 200 con lista de salidas', async () => {
        pool.query.mockResolvedValueOnce([[{ total: 2 }]]);
        pool.query.mockResolvedValueOnce([[
            { codigo: 1, codigo_empresa: 1, nro_salida: 5, codigo_barras: 'ABC123', fecha_salida: '2026-01-01' },
            { codigo: 2, codigo_empresa: 1, nro_salida: 3, codigo_barras: 'XYZ456', fecha_salida: '2026-01-02' }
        ]]);
        const res = await request(app)
            .get('/api/salidas')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('salidas');
        expect(res.body).toHaveProperty('total');
        expect(res.body.salidas.length).toBe(2);
    });

    it('devuelve solo salidas de la empresa del admin', async () => {
        pool.query.mockResolvedValueOnce([[{ total: 1 }]]);
        pool.query.mockResolvedValueOnce([[
            { codigo: 1, codigo_empresa: 1, nro_salida: 5, codigo_barras: 'ABC123', fecha_salida: '2026-01-01' }
        ]]);
        const res = await request(app)
            .get('/api/salidas')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.salidas.length).toBe(1);
    });
});

// ── GET /api/salidas/:id ──────────────────────────────────────────────────
describe('GET /api/salidas/:id', () => {
    let token;

    beforeAll(async () => {
        pool.query.mockResolvedValueOnce([[{
            codigo_usuario: 1,
            codigo_empresa: 1,
            correo: 'admin@gls.com',
            contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            rol: 'admin'
        }]]);
        const res = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'admin@gls.com', contrasena: 'password' });
        token = res.body.token;
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app).get('/api/salidas/1');
        expect(res.statusCode).toBe(401);
    });

    it('devuelve 200 con el detalle de una salida', async () => {
        pool.query.mockResolvedValueOnce([[{
            codigo: 1,
            codigo_empresa: 1,
            nro_salida: 5,
            codigo_barras: 'ABC123',
            fecha_salida: '2026-01-01'
        }]]);
        const res = await request(app)
            .get('/api/salidas/1')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('salida');
        expect(res.body.salida.codigo).toBe(1);
    });

    it('devuelve 404 si la salida no existe', async () => {
        pool.query.mockResolvedValueOnce([[]]); // array vacío
        const res = await request(app)
            .get('/api/salidas/999')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(404);
    });
});

// ── GET /api/salidas/buscar/:codigoBarras ─────────────────────────────────
describe('GET /api/salidas/buscar/:codigoBarras', () => {
    let token;

    beforeAll(async () => {
        pool.query.mockResolvedValueOnce([[{
            codigo_usuario: 1,
            codigo_empresa: 1,
            correo: 'admin@gls.com',
            contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            rol: 'admin'
        }]]);
        const res = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'admin@gls.com', contrasena: 'password' });
        token = res.body.token;
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app).get('/api/salidas/buscar/ABC123');
        expect(res.statusCode).toBe(401);
    });

    it('devuelve 200 con el historial del paquete', async () => {
        pool.query.mockResolvedValueOnce([[
            { codigo: 1, nro_salida: 5, codigo_barras: 'ABC123', fecha_salida: '2026-01-01' },
            { codigo: 2, nro_salida: 3, codigo_barras: 'ABC123', fecha_salida: '2026-01-02' }
        ]]);
        const res = await request(app)
            .get('/api/salidas/buscar/ABC123')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('historial');
        expect(res.body.historial.length).toBe(2);
    });

    it('devuelve 404 si el código no existe', async () => {
        pool.query.mockResolvedValueOnce([[]]); // sin resultados
        const res = await request(app)
            .get('/api/salidas/buscar/NOEXISTE')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(404);
    });
});

// ── GET /api/salidas/estadisticas ─────────────────────────────────────────
describe('GET /api/salidas/estadisticas', () => {
    let token;

    beforeAll(async () => {
        pool.query.mockResolvedValueOnce([[{
            codigo_usuario: 1,
            codigo_empresa: 1,
            correo: 'admin@gls.com',
            contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            rol: 'admin'
        }]]);
        const res = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'admin@gls.com', contrasena: 'password' });
        token = res.body.token;
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app).get('/api/salidas/estadisticas');
        expect(res.statusCode).toBe(401);
    });

    it('devuelve 200 con estadísticas por cinta', async () => {
        // 1. COUNT(*) total
        pool.query.mockResolvedValueOnce([[{ total: 450 }]]);
        // 2. Por salida
        pool.query.mockResolvedValueOnce([[
            { nro_salida: 1, total: 150 },
            { nro_salida: 2, total: 200 },
            { nro_salida: 3, total: 98 }
        ]]);
        // 3. Por empresa
        pool.query.mockResolvedValueOnce([[
            { nombre_empresa: 'GLS', total: 450 }
        ]]);
        // 4. Por día
        pool.query.mockResolvedValueOnce([[
            { dia: '2026-03-18', total: 50 }
        ]]);

        const res = await request(app)
            .get('/api/salidas/estadisticas')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('porSalida');
        expect(res.body).toHaveProperty('porEmpresa');
        expect(res.body).toHaveProperty('porDia');
        expect(res.body.porSalida.length).toBe(3);
    });
});

// ── POST /api/salidas ─────────────────────────────────────────────────────
describe('POST /api/salidas', () => {
    let token;

    beforeAll(async () => {
        pool.query.mockResolvedValueOnce([[{
            codigo_usuario: 1,
            codigo_empresa: 1,
            correo: 'admin@gls.com',
            contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            rol: 'admin'
        }]]);
        const res = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'admin@gls.com', contrasena: 'password' });
        token = res.body.token;
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app).post('/api/salidas');
        expect(res.statusCode).toBe(401);
    });

    it('devuelve 400 si faltan campos', async () => {
        const res = await request(app)
            .post('/api/salidas')
            .set('Authorization', `Bearer ${token}`)
            .send({});
        expect(res.statusCode).toBe(400);
    });

    it('devuelve 201 cuando crea la salida', async () => {
        pool.query.mockResolvedValueOnce([{ insertId: 1 }]);
        const res = await request(app)
            .post('/api/salidas')
            .set('Authorization', `Bearer ${token}`)
            .send({ nro_salida: 3, codigo_barras: 'TEST123' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('salida');
        expect(res.body.salida.nro_salida).toBe(3);
    });

    it('devuelve 403 si el rol es usuario', async () => {
        pool.query.mockResolvedValueOnce([[{
            codigo_usuario: 2,
            codigo_empresa: 1,
            correo: 'usuario1@gls.com',
            contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            rol: 'usuario'
        }]]);
        const login = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'usuario1@gls.com', contrasena: 'password' });
        const tokenUsuario = login.body.token;
        const res = await request(app)
            .post('/api/salidas')
            .set('Authorization', `Bearer ${tokenUsuario}`)
            .send({ nro_salida: 3, codigo_barras: 'TEST123' });
        expect(res.statusCode).toBe(403);
    });

    it('devuelve 500 si falla la BD', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB caída'));
        const res = await request(app)
            .post('/api/salidas')
            .set('Authorization', `Bearer ${token}`)
            .send({ nro_salida: 3, codigo_barras: 'TEST123' });
        expect(res.statusCode).toBe(500);
    });
});

// ── DELETE /api/salidas/:id ───────────────────────────────────────────────
describe('DELETE /api/salidas/:id', () => {
    let tokenSuperadmin;
    let tokenAdmin;

    beforeAll(async () => {
        // Token superadmin
        pool.query.mockResolvedValueOnce([[{
            codigo_usuario: 1,
            codigo_empresa: null,
            correo: 'admin@paqtrack.com',
            contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            rol: 'superadmin'
        }]]);
        const resSa = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'admin@paqtrack.com', contrasena: 'password' });
        tokenSuperadmin = resSa.body.token;

        // Token admin
        pool.query.mockResolvedValueOnce([[{
            codigo_usuario: 2,
            codigo_empresa: 1,
            correo: 'admin@gls.com',
            contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            rol: 'admin'
        }]]);
        const resAd = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'admin@gls.com', contrasena: 'password' });
        tokenAdmin = resAd.body.token;
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app).delete('/api/salidas/1');
        expect(res.statusCode).toBe(401);
    });

    it('devuelve 403 si el rol es admin', async () => {
        const res = await request(app)
            .delete('/api/salidas/1')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(403);
    });

    it('devuelve 404 si la salida no existe', async () => {
        pool.query.mockResolvedValueOnce([[]]); // no encontrada
        const res = await request(app)
            .delete('/api/salidas/999')
            .set('Authorization', `Bearer ${tokenSuperadmin}`);
        expect(res.statusCode).toBe(404);
    });

    it('superadmin puede eliminar una salida', async () => {
        pool.query.mockResolvedValueOnce([[{ codigo: 1 }]]); // salida existe
        pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // delete ok
        const res = await request(app)
            .delete('/api/salidas/1')
            .set('Authorization', `Bearer ${tokenSuperadmin}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('mensaje');
    });
});