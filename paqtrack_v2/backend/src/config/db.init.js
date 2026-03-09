"use strict";
import { pool } from "./db.js";
export async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS empresa (
        codigo       INT AUTO_INCREMENT PRIMARY KEY,
        nombre       VARCHAR(100) NOT NULL,
        contacto     VARCHAR(150)
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        codigo_usuario  INT AUTO_INCREMENT PRIMARY KEY,
        codigo_empresa  INT NULL,
        correo          VARCHAR(150) NOT NULL UNIQUE,
        contrasena      VARCHAR(255) NOT NULL,
        rol             ENUM('superadmin','admin','usuario') NOT NULL DEFAULT 'usuario',
        FOREIGN KEY (codigo_empresa) REFERENCES empresa(codigo) ON DELETE SET NULL
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS salidas (
        codigo          INT AUTO_INCREMENT PRIMARY KEY,
        codigo_empresa  INT NOT NULL,
        nro_salida      INT NOT NULL,
        codigo_barras   VARCHAR(100) NOT NULL,
        fecha_salida    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (codigo_empresa) REFERENCES empresa(codigo) ON DELETE CASCADE
      )
    `);
    console.log("✅ Tablas creadas / verificadas");
  } finally {
    conn.release();
  }
}
