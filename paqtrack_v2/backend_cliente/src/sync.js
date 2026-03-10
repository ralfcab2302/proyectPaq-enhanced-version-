import { pool } from "./db.js";
const CENTRAL_URL = process.env.CENTRAL_URL || "http://backend_central:3000"
const SYNC_API_KEY = process.env.SYNC_API_KEY || "sync_secret_key";
const CODIGO_EMPRESA = parseInt(process.env.CODIGO_EMPRESA || "1");
export async function sincronizar() {
  const conn = await pool.getConnection();
  try {
    const [logRows] = await conn.query("SELECT ultima_sync FROM sync_log LIMIT 1");
    const ultimaSync = logRows[0].ultima_sync;
    console.log(`🔄 Buscando salidas nuevas desde: ${ultimaSync}`);
    const [salidasNuevas] = await conn.query(
      "SELECT nro_salida, codigo_barras, fecha_salida FROM salidas WHERE fecha_salida > ?",
      [ultimaSync]
    );
    if (salidasNuevas.length === 0) {
      console.log("ℹ️  No hay salidas nuevas que sincronizar");
      return;
    }
    console.log(`📦 Se encontraron ${salidasNuevas.length} salidas nuevas, enviando al central...`);
    const respuesta = await fetch(`${CENTRAL_URL}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": SYNC_API_KEY
      },
      body: JSON.stringify({
        codigo_empresa: CODIGO_EMPRESA,
        salidas: salidasNuevas.map(salida => ({
          nro_salida: salida.nro_salida,
          codigo_barras: salida.codigo_barras,
          fecha_salida: salida.fecha_salida
        }))
      })
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
      console.error("❌ El central respondió con error:", resultado);
      return;
    }
    console.log(`✅ Sync completada correctamente:`);
    console.log(`   - Insertadas en central: ${resultado.insertadas}`);
    console.log(`   - Ya existían (duplicadas): ${resultado.duplicadas}`);
    await conn.query("UPDATE sync_log SET ultima_sync = NOW()");
    console.log("📅 Fecha de última sync actualizada a ahora");
  } catch (err) {
    console.error("❌ Error al conectar con el central:", err.message);
    console.log("⚠️  Se reintentará en el próximo ciclo");
  } finally {
    conn.release();
  }
}
