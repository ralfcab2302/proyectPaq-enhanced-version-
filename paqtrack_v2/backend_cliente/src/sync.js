import { pool } from "./db.js";

// ─────────────────────────────────────────────────────────────────────────────
// Variables de entorno
// CENTRAL_URL  → URL del backend central (por defecto apunta al contenedor Docker)
// SYNC_API_KEY → Clave secreta compartida con el backend central
// CODIGO_EMPRESA → ID de esta empresa en la BD central
// ─────────────────────────────────────────────────────────────────────────────
const CENTRAL_URL    = process.env.CENTRAL_URL    || "http://backend_central:3000";
const SYNC_API_KEY   = process.env.SYNC_API_KEY   || "sync_secret_key";
const CODIGO_EMPRESA = parseInt(process.env.CODIGO_EMPRESA || "1");

export async function sincronizar() {
  const conn = await pool.getConnection();

  try {
    // ── 1. LEER LA ÚLTIMA FECHA DE SINCRONIZACIÓN ────────────────────────
    // La tabla sync_log guarda cuándo fue la última vez que enviamos datos
    // Si es la primera vez que arranca, la fecha será 1970-01-01 00:00:00
    // con lo que cogerá TODOS los registros de la BD del cliente
    const [logRows] = await conn.query("SELECT ultima_sync FROM sync_log LIMIT 1");
    const ultimaSync = logRows[0].ultima_sync;

    console.log(`🔄 Buscando salidas nuevas desde: ${ultimaSync}`);

    // ── 2. OBTENER LAS SALIDAS NUEVAS ────────────────────────────────────
    // Solo cogemos las salidas que tienen fecha_salida mayor que la última sync
    // Así evitamos mandar registros que ya se enviaron antes
    const [salidasNuevas] = await conn.query(
      "SELECT nro_salida, codigo_barras, fecha_salida FROM salidas WHERE fecha_salida > ?",
      [ultimaSync]
    );

    // Si no hay nada nuevo no hacemos la petición al central
    if (salidasNuevas.length === 0) {
      console.log("ℹ️  No hay salidas nuevas que sincronizar");
      return;
    }

    console.log(`📦 Se encontraron ${salidasNuevas.length} salidas nuevas, enviando al central...`);

    // ── 3. ENVIAR AL BACKEND CENTRAL ─────────────────────────────────────
    // Hacemos un POST al endpoint /api/sync del backend central
    // Mandamos la API key en el header para que el central nos identifique
    const respuesta = await fetch(`${CENTRAL_URL}/api/sync`, {
      method : "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key"   : SYNC_API_KEY      // clave secreta compartida
      },
      body: JSON.stringify({
        codigo_empresa: CODIGO_EMPRESA,
        salidas: salidasNuevas.map(salida => ({
          nro_salida   : salida.nro_salida,
          codigo_barras: salida.codigo_barras,
          fecha_salida : salida.fecha_salida   // el central convierte el formato
        }))
      })
    });

    // ── 4. PROCESAR LA RESPUESTA ─────────────────────────────────────────
    const resultado = await respuesta.json();

    // Si el central devuelve un error no actualizamos la última sync
    // para que en la próxima ejecución lo intente de nuevo
    if (!respuesta.ok) {
      console.error("❌ El central respondió con error:", resultado);
      return;
    }

    console.log(`✅ Sync completada correctamente:`);
    console.log(`   - Insertadas en central: ${resultado.insertadas}`);
    console.log(`   - Ya existían (duplicadas): ${resultado.duplicadas}`);

    // ── 5. ACTUALIZAR LA ÚLTIMA SYNC ─────────────────────────────────────
    // Solo actualizamos la fecha si la sync fue exitosa
    // La próxima vez que se ejecute solo cogerá los registros más nuevos que ahora
    await conn.query("UPDATE sync_log SET ultima_sync = NOW()");
    console.log("📅 Fecha de última sync actualizada a ahora");

  } catch (err) {
    // Puede fallar si el central no está disponible (red, caído, etc.)
    // En ese caso no actualizamos ultima_sync y lo reintentará en el próximo ciclo
    console.error("❌ Error al conectar con el central:", err.message);
    console.log("⚠️  Se reintentará en el próximo ciclo");

  } finally {
    // Siempre liberamos la conexión aunque haya habido un error
    conn.release();
  }
}
