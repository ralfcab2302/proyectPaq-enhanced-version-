"use strict";

import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";

const empresas = [
  { nombre: "El Corte Inglés", contacto: "eci@elcorteingles.es" },
  { nombre: "Silbon", contacto: "info@silbon.es" },
  { nombre: "Zara", contacto: "zara@inditex.com" },
  { nombre: "Mango", contacto: "mango@mango.com" },
  { nombre: "MediaMarkt", contacto: "info@mediamarkt.es" },
  { nombre: "Decathlon", contacto: "decathlon@decathlon.es" },
  { nombre: "IKEA", contacto: "ikea@ikea.es" },
  { nombre: "Apple", contacto: "apple@apple.com" },
  { nombre: "Samsung", contacto: "samsung@samsung.es" },
  { nombre: "Leroy Merlin", contacto: "info@leroymerlin.es" },
  { nombre: "Nike", contacto: "nike@nike.com" },
  { nombre: "Adidas", contacto: "adidas@adidas.es" },
  { nombre: "Pull&Bear", contacto: "pullbear@inditex.com" },
  { nombre: "Bershka", contacto: "bershka@inditex.com" },
  { nombre: "H&M", contacto: "hm@hm.com" },
  { nombre: "Springfield", contacto: "springfield@workinprogress.es" },
  { nombre: "Primark", contacto: "primark@primark.com" },
  { nombre: "Amazon", contacto: "amazon@amazon.es" },
  { nombre: "Fnac", contacto: "fnac@fnac.es" },
  { nombre: "PC Componentes", contacto: "info@pccomponentes.com" },
  { nombre: "Worten", contacto: "worten@worten.es" },
  { nombre: "Carrefour", contacto: "carrefour@carrefour.es" },
  { nombre: "Lidl", contacto: "lidl@lidl.es" },
  { nombre: "Alcampo", contacto: "alcampo@auchan.es" },
  { nombre: "Mercadona", contacto: "mercadona@mercadona.es" },
];

const codigoBarrasAleatorio = () => {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numeros = "0123456789";
  return (
    Array.from({ length: 3 }, () => letras[Math.floor(Math.random() * letras.length)]).join('') +
    Array.from({ length: 9 }, () => numeros[Math.floor(Math.random() * numeros.length)]).join('')
  );
};

const fechaAleatoria = (soloHoy = false) => {
  const fecha = new Date();
  if (!soloHoy) fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30));
  fecha.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0);
  return fecha;
};

const insertarSalidas = async (codigoEmpresa, cantidad, soloHoy = false) => {
  for (let i = 0; i < cantidad; i++) {
    await pool.query(
      "INSERT INTO salidas (codigo_empresa, nro_salida, codigo_barras, fecha_salida) VALUES (?, ?, ?, ?)",
      [codigoEmpresa, Math.floor(Math.random() * 40) + 1, codigoBarrasAleatorio(), fechaAleatoria(soloHoy)]
    );
  }
};

export async function datosSeeder() {
  const [existe] = await pool.query("SELECT codigo FROM empresa LIMIT 1");
  if (existe.length > 0) {
    console.log("ℹ️  Datos ya existen, saltando seeder");
    return;
  }

  const hash = await bcrypt.hash("admin123", 10);
  const hashUsuario = await bcrypt.hash("usuario123", 10);

  for (const empresa of empresas) {
    const [res] = await pool.query(
      "INSERT INTO empresa (nombre, contacto) VALUES (?, ?)",
      [empresa.nombre, empresa.contacto]
    );
    const id = res.insertId;
    const slug = empresa.nombre.toLowerCase().replace(/[^a-z0-9]/g, '');

    await pool.query("INSERT INTO usuarios (codigo_empresa, correo, contrasena, rol) VALUES (?, ?, ?, ?)", [id, `admin@${slug}.com`, hash, "admin"]);
    await pool.query("INSERT INTO usuarios (codigo_empresa, correo, contrasena, rol) VALUES (?, ?, ?, ?)", [id, `usuario1@${slug}.com`, hashUsuario, "usuario"]);
    await pool.query("INSERT INTO usuarios (codigo_empresa, correo, contrasena, rol) VALUES (?, ?, ?, ?)", [id, `usuario2@${slug}.com`, hashUsuario, "usuario"]);

    await insertarSalidas(id, 40);        // 40 aleatorias últimos 30 días
    await insertarSalidas(id, 10, true);  // 10 de hoy

    console.log(`✅ ${empresa.nombre}`);
  }

  console.log("✅ Seeder completado — 25 empresas, 50 salidas cada una (10 de hoy)");
}