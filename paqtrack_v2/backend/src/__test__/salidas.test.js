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