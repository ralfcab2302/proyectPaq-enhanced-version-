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

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    console.error.mockRestore();
});

afterEach(() => {
    jest.clearAllMocks();
});

const mockSuperadmin = {
    codigo_usuario: 1,
    codigo_empresa: null,
    correo: 'admin@paqtrack.com',
    contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    rol: 'superadmin'
};

const mockAdmin = {
    codigo_usuario: 2,
    codigo_empresa: 1,
    correo: 'admin@gls.com',
    contrasena: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    rol: 'admin'
};

const mockEmpresa = { codigo: 1, nombre: 'GLS', contacto: 'admin@gls.com' };

// ── GET /api/empresas ─────────────────────────────────────────────────────
describe('GET /api/empresas', () => {
    let tokenSuperadmin;
    let tokenAdmin;

    beforeAll(async () => {
        pool.query.mockResolvedValueOnce([[mockSuperadmin]]);
        const resSa = await request(app)
            .post('/api/auth/login')
            .send({ correo: mockSuperadmin.correo, contrasena: 'password' });
        tokenSuperadmin = resSa.body.token;

        pool.query.mockResolvedValueOnce([[mockAdmin]]);
        const resAd = await request(app)
            .post('/api/auth/login')
            .send({ correo: mockAdmin.correo, contrasena: 'password' });
        tokenAdmin = resAd.body.token;
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app).get('/api/empresas');
        expect(res.statusCode).toBe(401);
    });

    it('superadmin ve todas las empresas', async () => {
        pool.query.mockResolvedValueOnce([[
            mockEmpresa,
            { codigo: 2, nombre: 'SEUR', contacto: 'admin@seur.com' }
        ]]);
        const res = await request(app)
            .get('/api/empresas')
            .set('Authorization', `Bearer ${tokenSuperadmin}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('empresas');
        expect(res.body.empresas.length).toBe(2);
    });

    it('admin solo ve su empresa', async () => {
        pool.query.mockResolvedValueOnce([[mockEmpresa]]);
        const res = await request(app)
            .get('/api/empresas')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.empresas.length).toBe(1);
    });
});

// ── GET /api/empresas/:id ─────────────────────────────────────────────────
describe('GET /api/empresas/:id', () => {
    let tokenSuperadmin;
    let tokenAdmin;

    beforeAll(async () => {
        pool.query.mockResolvedValueOnce([[mockSuperadmin]]);
        const resSa = await request(app)
            .post('/api/auth/login')
            .send({ correo: mockSuperadmin.correo, contrasena: 'password' });
        tokenSuperadmin = resSa.body.token;

        pool.query.mockResolvedValueOnce([[mockAdmin]]);
        const resAd = await request(app)
            .post('/api/auth/login')
            .send({ correo: mockAdmin.correo, contrasena: 'password' });
        tokenAdmin = resAd.body.token;
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app).get('/api/empresas/1');
        expect(res.statusCode).toBe(401);
    });

    it('admin no puede ver empresa por id (403)', async () => {
        const res = await request(app)
            .get('/api/empresas/1')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(403);
    });

    it('superadmin ve el detalle de una empresa', async () => {
        pool.query.mockResolvedValueOnce([[mockEmpresa]]);
        const res = await request(app)
            .get('/api/empresas/1')
            .set('Authorization', `Bearer ${tokenSuperadmin}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('empresa');
        expect(res.body.empresa.nombre).toBe('GLS');
    });

    it('devuelve 404 si la empresa no existe', async () => {
        pool.query.mockResolvedValueOnce([[]]); // no encontrada
        const res = await request(app)
            .get('/api/empresas/999')
            .set('Authorization', `Bearer ${tokenSuperadmin}`);
        expect(res.statusCode).toBe(404);
    });
});

// ── POST /api/empresas ────────────────────────────────────────────────────
describe('POST /api/empresas', () => {
    let tokenSuperadmin;
    let tokenAdmin;

    beforeAll(async () => {
        pool.query.mockResolvedValueOnce([[mockSuperadmin]]);
        const resSa = await request(app)
            .post('/api/auth/login')
            .send({ correo: mockSuperadmin.correo, contrasena: 'password' });
        tokenSuperadmin = resSa.body.token;

        pool.query.mockResolvedValueOnce([[mockAdmin]]);
        const resAd = await request(app)
            .post('/api/auth/login')
            .send({ correo: mockAdmin.correo, contrasena: 'password' });
        tokenAdmin = resAd.body.token;
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app).post('/api/empresas');
        expect(res.statusCode).toBe(401);
    });

    it('devuelve 403 si el rol es admin', async () => {
        const res = await request(app)
            .post('/api/empresas')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ nombre: 'Nueva' });
        expect(res.statusCode).toBe(403);
    });

    it('devuelve 400 si falta el nombre', async () => {
        const res = await request(app)
            .post('/api/empresas')
            .set('Authorization', `Bearer ${tokenSuperadmin}`)
            .send({ contacto: 'test@test.com' });
        expect(res.statusCode).toBe(400);
    });

    it('devuelve 409 si ya existe una empresa con ese nombre', async () => {
        pool.query.mockResolvedValueOnce([[mockEmpresa]]); // ya existe
        const res = await request(app)
            .post('/api/empresas')
            .set('Authorization', `Bearer ${tokenSuperadmin}`)
            .send({ nombre: 'GLS' });
        expect(res.statusCode).toBe(409);
    });

    it('superadmin crea empresa correctamente', async () => {
        pool.query.mockResolvedValueOnce([[]]); // no existe
        pool.query.mockResolvedValueOnce([{ insertId: 4 }]); // insert ok
        const res = await request(app)
            .post('/api/empresas')
            .set('Authorization', `Bearer ${tokenSuperadmin}`)
            .send({ nombre: 'DHL', contacto: 'admin@dhl.com' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('empresa');
        expect(res.body.empresa.nombre).toBe('DHL');
    });
});

// ── PUT /api/empresas/:id ─────────────────────────────────────────────────
describe('PUT /api/empresas/:id', () => {
    let tokenSuperadmin;
    let tokenAdmin;

    beforeAll(async () => {
        pool.query.mockResolvedValueOnce([[mockSuperadmin]]);
        const resSa = await request(app)
            .post('/api/auth/login')
            .send({ correo: mockSuperadmin.correo, contrasena: 'password' });
        tokenSuperadmin = resSa.body.token;

        pool.query.mockResolvedValueOnce([[mockAdmin]]);
        const resAd = await request(app)
            .post('/api/auth/login')
            .send({ correo: mockAdmin.correo, contrasena: 'password' });
        tokenAdmin = resAd.body.token;
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app).put('/api/empresas/1');
        expect(res.statusCode).toBe(401);
    });

    it('devuelve 403 si el rol es admin', async () => {
        const res = await request(app)
            .put('/api/empresas/1')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ nombre: 'Nuevo nombre' });
        expect(res.statusCode).toBe(403);
    });

    it('devuelve 400 si no se envían campos', async () => {
        const res = await request(app)
            .put('/api/empresas/1')
            .set('Authorization', `Bearer ${tokenSuperadmin}`)
            .send({});
        expect(res.statusCode).toBe(400);
    });

    it('devuelve 404 si la empresa no existe', async () => {
        pool.query.mockResolvedValueOnce([[]]); // no encontrada
        const res = await request(app)
            .put('/api/empresas/999')
            .set('Authorization', `Bearer ${tokenSuperadmin}`)
            .send({ nombre: 'Nuevo' });
        expect(res.statusCode).toBe(404);
    });

    it('actualiza la empresa correctamente', async () => {
        pool.query.mockResolvedValueOnce([[mockEmpresa]]); // existe
        pool.query.mockResolvedValueOnce([[]]); // no hay duplicado
        pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // update ok
        const res = await request(app)
            .put('/api/empresas/1')
            .set('Authorization', `Bearer ${tokenSuperadmin}`)
            .send({ nombre: 'GLS Actualizado' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('mensaje', 'Empresa actualizada correctamente');
    });
});

// ── DELETE /api/empresas/:id ──────────────────────────────────────────────
describe('DELETE /api/empresas/:id', () => {
    let tokenSuperadmin;
    let tokenAdmin;

    beforeAll(async () => {
        pool.query.mockResolvedValueOnce([[mockSuperadmin]]);
        const resSa = await request(app)
            .post('/api/auth/login')
            .send({ correo: mockSuperadmin.correo, contrasena: 'password' });
        tokenSuperadmin = resSa.body.token;

        pool.query.mockResolvedValueOnce([[mockAdmin]]);
        const resAd = await request(app)
            .post('/api/auth/login')
            .send({ correo: mockAdmin.correo, contrasena: 'password' });
        tokenAdmin = resAd.body.token;
    });

    it('devuelve 401 sin token', async () => {
        const res = await request(app).delete('/api/empresas/1');
        expect(res.statusCode).toBe(401);
    });

    it('devuelve 403 si el rol es admin', async () => {
        const res = await request(app)
            .delete('/api/empresas/1')
            .set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(403);
    });

    it('devuelve 404 si la empresa no existe', async () => {
        pool.query.mockResolvedValueOnce([[]]); // no encontrada
        const res = await request(app)
            .delete('/api/empresas/999')
            .set('Authorization', `Bearer ${tokenSuperadmin}`);
        expect(res.statusCode).toBe(404);
    });

    it('devuelve 400 si la empresa tiene usuarios', async () => {
        pool.query.mockResolvedValueOnce([[mockEmpresa]]); // existe
        pool.query.mockResolvedValueOnce([[{ codigo_usuario: 1 }]]); // tiene usuarios
        const res = await request(app)
            .delete('/api/empresas/1')
            .set('Authorization', `Bearer ${tokenSuperadmin}`);
        expect(res.statusCode).toBe(400);
    });

    it('devuelve 400 si es la única empresa', async () => {
        pool.query.mockResolvedValueOnce([[mockEmpresa]]); // existe
        pool.query.mockResolvedValueOnce([[]]); // sin usuarios
        pool.query.mockResolvedValueOnce([[{ total: 1 }]]); // es la única
        const res = await request(app)
            .delete('/api/empresas/1')
            .set('Authorization', `Bearer ${tokenSuperadmin}`);
        expect(res.statusCode).toBe(400);
    });

    it('superadmin elimina empresa correctamente', async () => {
        pool.query.mockResolvedValueOnce([[mockEmpresa]]); // existe
        pool.query.mockResolvedValueOnce([[]]); // sin usuarios
        pool.query.mockResolvedValueOnce([[{ total: 3 }]]); // hay más empresas
        pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // delete ok
        const res = await request(app)
            .delete('/api/empresas/1')
            .set('Authorization', `Bearer ${tokenSuperadmin}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('mensaje', 'Empresa eliminada correctamente');
    });
});