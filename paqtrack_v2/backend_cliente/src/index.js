import { pool } from "./db.js";
import { initClienteDB } from "./db.init.js";
import { sincronizar } from "./sync.js";

const INTERVALO_MS = 5 * 1000; // 15 minutos en milisegundos

async function esperarMySQL(intentos = 15) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const conn = await pool.getConnection();
      conn.release();
      console.log("✅ MySQL cliente listo");
      return;
    } catch {
      console.log(`⏳ Esperando MySQL cliente... intento ${i}/${intentos}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.error("❌ No se pudo conectar a MySQL cliente");
  process.exit(1);
}

async function arrancar() {
  await esperarMySQL();
  await initClienteDB();

  console.log("🚀 Backend cliente arrancado");
  console.log("⏰ Sincronización cada 15 minutos");

  // Primera sync al arrancar
  await sincronizar();

  // Sync cada 15 minutos
  setInterval(async () => {
    console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Ejecutando sync programada...`);
    await sincronizar();
  }, INTERVALO_MS);
}

arrancar();
