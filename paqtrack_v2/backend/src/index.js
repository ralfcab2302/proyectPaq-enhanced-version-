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
import { datosSeeder } from "./seeders/datos.seeder.js";

const server = express();

const corsOpciones = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};
server.use(cors(corsOpciones));
server.options("*", cors(corsOpciones));
server.use(express.json());

server.get("/", (_req, res) => res.json({ mensaje: "PaqTrack API v2 funcionando" }));

server.use("/api/auth", authRouter);
server.use("/api/empresas", empresaRouter);
server.use("/api/usuarios", usuariosRouter);
server.use("/api/salidas", salidasRouter);

async function esperarMySQL(intentos = 15) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const conn = await pool.getConnection();
      conn.release();
      console.log("✅ MySQL listo");
      return;
    } catch {
      console.log(`⏳ Esperando MySQL... intento ${i}/${intentos}`);
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
  await datosSeeder()

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
  });
}

arrancar();
