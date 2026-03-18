"use strict";
import express from "express";
import cors from "cors";

import { pool } from "./config/db.js";
import { initDB } from "./config/db.init.js";
import { superadminSeeder } from "./seeders/superadmin.seeder.js";

import { authRouter } from "./routes/auth.routes.js";
import { empresaRouter } from "./routes/empresa.routes.js";
import { usuariosRouter } from "./routes/usuarios.routes.js";
import { salidasRouter } from "./routes/salidas.routes.js";
import { syncRouter } from "./routes/sync.routes.js";
import { datosSeeder } from "./seeders/datos.seeder.js";

const server = express();

// Cabeceras CORS manuales — van ANTES de todo
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

server.use(cors({
  origin: (origin, callback) => callback(null, true),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  credentials: true,
  optionsSuccessStatus: 204
}));
server.options("*", cors());
server.use(express.json());

server.get("/", (_req, res) => res.json({ mensaje: "PaqTrack API v2 funcionando" }));

server.use("/api/auth", authRouter);
server.use("/api/empresas", empresaRouter);
server.use("/api/usuarios", usuariosRouter);
server.use("/api/salidas", salidasRouter);
server.use("/api/sync", syncRouter);

async function esperarMySQL(intentos = 15) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const conn = await pool.getConnection();
      conn.release();
      console.log("✅ MySQL listo");
      await new Promise(r => setTimeout(r, 6000));
      return;
    } catch (err) {
      console.log(`⏳ Esperando MySQL... intento ${i}/${intentos}`);
      console.error(`   Error: ${err.message}`); // ← añade esto
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.error("❌ No se pudo conectar a MySQL");
  process.exit(1);
}

async function arrancar() {
  await esperarMySQL();
  await initDB();
  await superadminSeeder();
  await datosSeeder();

  server.listen(3000, () => {
    console.log("🚀 Servidor en http://localhost:3000");
    console.log("📋 Rutas disponibles:");
    console.log("   POST   /api/auth/login");
    console.log("   GET    /api/auth/perfil");
    console.log("   GET    /api/empresas");
    console.log("   GET    /api/usuarios");
    console.log("   GET    /api/salidas");
    console.log("   GET    /api/salidas/estadisticas");
    console.log("   GET    /api/salidas/buscar/:codigoBarras");
    console.log("   POST   /api/sync  (sync desde clientes)");
  });
}
server.get("/debug-hoy", async (req, res) => {
  const [porFecha] = await pool.query(
    `SELECT DATE(fecha_salida) as dia, COUNT(*) as total 
     FROM salidas 
     GROUP BY DATE(fecha_salida) 
     ORDER BY dia DESC 
     LIMIT 10`
  );
  res.json({ porFecha });
});

arrancar();