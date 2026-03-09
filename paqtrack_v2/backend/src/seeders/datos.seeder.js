"use strict";
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
const empresas = [
    { nombre: "GLS", contacto: "gls@gls.com" },
    { nombre: "SEUR", contacto: "seur@seur.com" },
    { nombre: "MRW", contacto: "mrw@mrw.com" }
];
function codigoBarrasAleatorio() {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numeros = "0123456789";
    let codigo = "";
    for (let i = 0; i < 3; i++) codigo += letras[Math.floor(Math.random() * letras.length)];
    for (let i = 0; i < 9; i++) codigo += numeros[Math.floor(Math.random() * numeros.length)];
    return codigo;
}
function fechaAleatoria() {
    const ahora = new Date();
    const diasAtras = Math.floor(Math.random() * 30);
    const horasAleatorias = Math.floor(Math.random() * 24);
    const minutosAleatorios = Math.floor(Math.random() * 60);
    ahora.setDate(ahora.getDate() - diasAtras);
    ahora.setHours(horasAleatorias, minutosAleatorios, 0);
    return ahora;
}
export async function datosSeeder() {
    const [empresasExistentes] = await pool.query("SELECT codigo FROM empresa LIMIT 1");
    if (empresasExistentes.length > 0) {
        console.log("ℹ️  Datos de ejemplo ya existen, saltando seeder");
        return;
    }
    const hash = await bcrypt.hash("admin123", 10);
    const hashUsuario = await bcrypt.hash("usuario123", 10);
    for (const empresa of empresas) {
        const [resultEmpresa] = await pool.query(
            "INSERT INTO empresa (nombre, contacto) VALUES (?, ?)",
            [empresa.nombre, empresa.contacto]
        );
        const codigoEmpresa = resultEmpresa.insertId;
        await pool.query(
            "INSERT INTO usuarios (codigo_empresa, correo, contrasena, rol) VALUES (?, ?, ?, ?)",
            [codigoEmpresa, `admin@${empresa.nombre.toLowerCase()}.com`, hash, "admin"]
        );
        await pool.query(
            "INSERT INTO usuarios (codigo_empresa, correo, contrasena, rol) VALUES (?, ?, ?, ?)",
            [codigoEmpresa, `usuario1@${empresa.nombre.toLowerCase()}.com`, hashUsuario, "usuario"]
        );
        await pool.query(
            "INSERT INTO usuarios (codigo_empresa, correo, contrasena, rol) VALUES (?, ?, ?, ?)",
            [codigoEmpresa, `usuario2@${empresa.nombre.toLowerCase()}.com`, hashUsuario, "usuario"]
        );
        for (let i = 0; i < 300; i++) {
            const nroSalida = Math.floor(Math.random() * 40) + 1
            const codBarras = codigoBarrasAleatorio();
            const fecha = fechaAleatoria();
            await pool.query(
                "INSERT INTO salidas (codigo_empresa, nro_salida, codigo_barras, fecha_salida) VALUES (?, ?, ?, ?)",
                [codigoEmpresa, nroSalida, codBarras, fecha]
            );
        }
        console.log(`✅ ${empresa.nombre} creada con 300 salidas`);
    }
    console.log("✅ Seeder de datos completado");
}