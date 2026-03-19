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

const usuarioMock = {
    codigo_usuario: 1,
    codigo_empresa: null,
    correo: 'admin@paqtrack.com',
    contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    rol: 'superadmin'
};

describe('POST /api/auth/login', () => {
    it('devuelve 400 si faltan campos', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});
        expect(res.statusCode).toBe(400);
    });

    it('devuelve 200 y token con credenciales correctas', async () => {
        pool.query.mockResolvedValueOnce([[usuarioMock]]);
        const res = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'admin@paqtrack.com', contrasena: 'password' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('devuelve 401 con contraseña incorrecta', async () => {
        pool.query.mockResolvedValueOnce([[usuarioMock]]);
        const res = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'admin@paqtrack.com', contrasena: 'incorrecta' });
        expect(res.statusCode).toBe(401);
    });

    it('devuelve 401 con correo inexistente', async () => {
        pool.query.mockResolvedValueOnce([[]]);
        const res = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'noexiste@test.com', contrasena: 'admin123' });
        expect(res.statusCode).toBe(401);
    });
});

describe('GET /api/auth/perfil', () => {
    let token;

    beforeAll(async () => {
        pool.query.mockResolvedValueOnce([[usuarioMock]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'admin@paqtrack.com', contrasena: 'password' });

        token = res.body.token;
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app)
            .get('/api/auth/perfil');

        expect(res.statusCode).toBe(401);
    });

    it('devuelve 403 con token inválido', async () => {
        const res = await request(app)
            .get('/api/auth/perfil')
            .set('Authorization', 'Bearer tokeninvalido');

        expect(res.statusCode).toBe(403);
    });

    it('devuelve 200 con token válido', async () => {
        pool.query.mockResolvedValueOnce([[{
            ...usuarioMock,
            nombre_empresa: null
        }]]);

        const res = await request(app)
            .get('/api/auth/perfil')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.usuario).toHaveProperty('correo', 'admin@paqtrack.com');
    });
});