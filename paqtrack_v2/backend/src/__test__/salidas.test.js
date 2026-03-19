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