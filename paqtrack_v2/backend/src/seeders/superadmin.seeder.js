"use strict";
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
export async function superadminSeeder() {
  const [rows] = await pool.query(
    "SELECT codigo_usuario FROM usuarios WHERE rol = 'superadmin' LIMIT 1"
  );
  if (rows.length > 0) {
    console.log("ℹ️  Superadmin ya existe, saltando seeder");
    return;
  }
  const hash = await bcrypt.hash("admin123", 10);
  await pool.query(
    `INSERT INTO usuarios (codigo_empresa, correo, contrasena, rol)
     VALUES (NULL, ?, ?, 'superadmin')`,
    ["admin@paqtrack.com", hash]
  );
  console.log("✅ Superadmin creado: admin@paqtrack.com / admin123");
}
