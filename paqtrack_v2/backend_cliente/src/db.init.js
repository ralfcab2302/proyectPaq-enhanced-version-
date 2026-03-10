import { pool } from "./db.js";

export async function initClienteDB() {
  const conn = await pool.getConnection();

  try {
    // ── 1. CREAR TABLA DE SALIDAS ────────────────────────────────────────
    // Esta tabla simula la base de datos local de la máquina clasificadora del cliente
    // En producción real esta tabla ya existiría en el sistema del cliente
    // y nosotros solo leeríamos de ella
    await conn.query(`
      CREATE TABLE IF NOT EXISTS salidas (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        nro_salida    INT          NOT NULL,
        codigo_barras VARCHAR(50)  NOT NULL,
        fecha_salida  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabla salidas lista");

    // ── 2. CREAR TABLA DE CONTROL DE SINCRONIZACIÓN ──────────────────────
    // Esta tabla guarda un único registro con la fecha de la última sync exitosa
    // Sirve para saber qué registros son "nuevos" y cuáles ya se han enviado
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id             INT      AUTO_INCREMENT PRIMARY KEY,
        ultima_sync    DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00',
        actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabla sync_log lista");

    // ── 3. INICIALIZAR EL REGISTRO DE SYNC_LOG ───────────────────────────
    // sync_log solo tiene una fila. Si no existe la creamos con fecha epoch (1970)
    // para que la primera sync recoja TODOS los registros de la BD del cliente
    const [filasLog] = await conn.query("SELECT id FROM sync_log LIMIT 1");

    if (filasLog.length === 0) {
      await conn.query("INSERT INTO sync_log (ultima_sync) VALUES ('1970-01-01 00:00:00')");
      console.log("✅ sync_log inicializado (primera vez)");
    } else {
      console.log("ℹ️  sync_log ya existe, manteniendo fecha de última sync");
    }

    // ── 4. INSERTAR DATOS DE PRUEBA ──────────────────────────────────────
    // Solo insertamos datos si la tabla está vacía (primer arranque)
    // En producción real los datos los genera la máquina clasificadora
    const [salidasExistentes] = await conn.query("SELECT id FROM salidas LIMIT 1");

    if (salidasExistentes.length === 0) {
      console.log("📦 Insertando datos de prueba en la BD del cliente...");

      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const TOTAL_REGISTROS = 50;

      for (let i = 0; i < TOTAL_REGISTROS; i++) {
        // Generar un código de barras aleatorio tipo "ABC123456789"
        const prefijo = letras[Math.floor(Math.random() * 26)] +
                        letras[Math.floor(Math.random() * 26)] +
                        letras[Math.floor(Math.random() * 26)];
        const numeros = String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, "0");
        const codigoBarras = `${prefijo}${numeros}`;

        // Número de salida física de la máquina (entre 1 y 40)
        const nroSalida = Math.floor(Math.random() * 40) + 1;

        // Fecha aleatoria en los últimos 30 días
        const msEnUnDia   = 24 * 60 * 60 * 1000;
        const fechaSalida = new Date(Date.now() - Math.random() * 30 * msEnUnDia);

        await conn.query(
          "INSERT INTO salidas (nro_salida, codigo_barras, fecha_salida) VALUES (?, ?, ?)",
          [nroSalida, codigoBarras, fechaSalida]
        );
      }

      console.log(`✅ ${TOTAL_REGISTROS} salidas de prueba insertadas en BD cliente`);

    } else {
      console.log("ℹ️  La tabla salidas ya tiene datos, no se insertan duplicados");
    }

    console.log("✅ BD cliente inicializada correctamente");

  } catch (err) {
    console.error("❌ Error al inicializar la BD del cliente:", err.message);
    throw err; // relanzamos el error para que el arranque falle y Docker lo reinicie

  } finally {
    conn.release();
  }
}
