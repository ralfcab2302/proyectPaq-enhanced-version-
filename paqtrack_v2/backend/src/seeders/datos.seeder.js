"use strict"; 

// Importa la conexión a la base de datos desde el archivo de configuración
import { pool } from "../config/db.js";

// Importa bcrypt para poder encriptar las contraseñas
import bcrypt from "bcryptjs";

// Array con empresas de ejemplo que se insertarán en la base de datos
const empresas = [
    { nombre: "GLS", contacto: "gls@gls.com" },
    { nombre: "SEUR", contacto: "seur@seur.com" },
    { nombre: "MRW", contacto: "mrw@mrw.com" }
];


// Genera un código de barras aleatorio
// Formato: 3 letras + 9 números (ejemplo: ABC123456789)
function codigoBarrasAleatorio() {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numeros = "0123456789";
    let codigo = "";

    // Genera 3 letras aleatorias
    for (let i = 0; i < 3; i++) 
        codigo += letras[Math.floor(Math.random() * letras.length)];

    // Genera 9 números aleatorios
    for (let i = 0; i < 9; i++) 
        codigo += numeros[Math.floor(Math.random() * numeros.length)];

    return codigo;
}


// Genera una fecha aleatoria dentro de los últimos 30 días
function fechaAleatoria() {
    const ahora = new Date();

    // Número de días aleatorios hacia atrás (0-29)
    const diasAtras = Math.floor(Math.random() * 30);

    // Hora y minutos aleatorios
    const horasAleatorias = Math.floor(Math.random() * 24);
    const minutosAleatorios = Math.floor(Math.random() * 60);

    // Resta los días aleatorios a la fecha actual
    ahora.setDate(ahora.getDate() - diasAtras);

    // Establece hora y minutos aleatorios
    ahora.setHours(horasAleatorias, minutosAleatorios, 0);

    return ahora;
}


// Función principal que inserta datos de prueba en la base de datos
export async function datosSeeder() {

    // Comprueba si ya existen empresas en la base de datos
    const [empresasExistentes] = await pool.query("SELECT codigo FROM empresa LIMIT 1");

    // Si ya hay datos, se cancela el seeder
    if (empresasExistentes.length > 0) {
        console.log("ℹ️  Datos de ejemplo ya existen, saltando seeder");
        return;
    }

    // Encripta la contraseña del admin
    const hash = await bcrypt.hash("admin123", 10);

    // Encripta la contraseña de los usuarios normales
    const hashUsuario = await bcrypt.hash("usuario123", 10);

    // Recorre cada empresa del array
    for (const empresa of empresas) {

        // Inserta la empresa en la base de datos
        const [resultEmpresa] = await pool.query(
            "INSERT INTO empresa (nombre, contacto) VALUES (?, ?)",
            [empresa.nombre, empresa.contacto]
        );

        // Obtiene el ID generado automáticamente
        const codigoEmpresa = resultEmpresa.insertId;

        // Inserta un usuario administrador para la empresa
        await pool.query(
            "INSERT INTO usuarios (codigo_empresa, correo, contrasena, rol) VALUES (?, ?, ?, ?)",
            [codigoEmpresa, `admin@${empresa.nombre.toLowerCase()}.com`, hash, "admin"]
        );

        // Inserta el primer usuario normal
        await pool.query(
            "INSERT INTO usuarios (codigo_empresa, correo, contrasena, rol) VALUES (?, ?, ?, ?)",
            [codigoEmpresa, `usuario1@${empresa.nombre.toLowerCase()}.com`, hashUsuario, "usuario"]
        );

        // Inserta el segundo usuario normal
        await pool.query(
            "INSERT INTO usuarios (codigo_empresa, correo, contrasena, rol) VALUES (?, ?, ?, ?)",
            [codigoEmpresa, `usuario2@${empresa.nombre.toLowerCase()}.com`, hashUsuario, "usuario"]
        );

        // Genera 300 registros de salidas para cada empresa
        for (let i = 0; i < 300; i++) {

            // Número de salida aleatorio entre 1 y 40
            const nroSalida = Math.floor(Math.random() * 40) + 1

            // Genera código de barras aleatorio
            const codBarras = codigoBarrasAleatorio();

            // Genera fecha aleatoria
            const fecha = fechaAleatoria();

            // Inserta la salida en la base de datos
            await pool.query(
                "INSERT INTO salidas (codigo_empresa, nro_salida, codigo_barras, fecha_salida) VALUES (?, ?, ?, ?)",
                [codigoEmpresa, nroSalida, codBarras, fecha]
            );
        }

        // Mensaje en consola indicando que la empresa fue creada
        console.log(`✅ ${empresa.nombre} creada con 300 salidas`);
    }

    // Mensaje final cuando el seeder termina
    console.log("✅ Seeder de datos completado");
}