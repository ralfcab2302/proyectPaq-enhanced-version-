"use strict";

// Importa la conexión al pool de la base de datos
import { pool } from "../config/db.js";

// Importa bcrypt para encriptar la contraseña del usuario
import bcrypt from "bcryptjs";

// Función que crea un usuario superadmin en la base de datos
export async function superadminSeeder() {

  // Consulta si ya existe algún usuario con rol "superadmin"
  const [rows] = await pool.query(
    "SELECT codigo_usuario FROM usuarios WHERE rol = 'superadmin' LIMIT 1"
  );

  // Si ya existe un superadmin, no se ejecuta el seeder
  if (rows.length > 0) {
    console.log("ℹ️  Superadmin ya existe, saltando seeder");
    return;
  }

  // Encripta la contraseña "admin123"
  // El número 10 es el número de salt rounds (nivel de seguridad)
  const hash = await bcrypt.hash("admin123", 10);

  // Inserta el usuario superadmin en la tabla usuarios
  // codigo_empresa se guarda como NULL porque el superadmin
  // no pertenece a ninguna empresa específica
  await pool.query(
    `INSERT INTO usuarios (codigo_empresa, correo, contrasena, rol)
     VALUES (NULL, ?, ?, 'superadmin')`,
    ["admin@paqtrack.com", hash]
  );

  // Mensaje de confirmación en consola
  console.log("✅ Superadmin creado: admin@paqtrack.com / admin123");
}