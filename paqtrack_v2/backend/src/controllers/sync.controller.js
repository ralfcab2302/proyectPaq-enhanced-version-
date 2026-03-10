"use strict";
import { pool } from "../config/db.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sync
//
// Este endpoint lo llama el backend del cliente cada X minutos.
// Le manda un array de salidas nuevas que aún no se han enviado al central.
//
// Para que funcione el cliente tiene que mandar en la cabecera HTTP:
//   x-api-key: <valor de SYNC_API_KEY en el .env>
//
// El body tiene que tener este formato:
//   {
//     "codigo_empresa": 1,
//     "salidas": [
//       { "nro_salida": 5, "codigo_barras": "ABC123456789", "fecha_salida": "2026-03-09T10:00:00.000Z" },
//       ...
//     ]
//   }
// ─────────────────────────────────────────────────────────────────────────────

export const syncSalidas = async (req, res) => {

  // ── 1. AUTENTICACIÓN POR API KEY ─────────────────────────────────────────
  // El cliente manda su API key en el header "x-api-key"
  // Si no coincide con la que tenemos en el .env, rechazamos la petición
  const apiKeyRecibida = req.headers["x-api-key"];
  const apiKeyEsperada = process.env.SYNC_API_KEY || "sync_secret_key";

  if (apiKeyRecibida !== apiKeyEsperada) {
    console.warn("⚠️  Intento de sync con API key inválida");
    return res.status(401).json({ error: "API key inválida" });
  }

  // ── 2. VALIDACIÓN DEL BODY ───────────────────────────────────────────────
  // Comprobamos que el body tiene los campos obligatorios
  const { codigo_empresa, salidas } = req.body;

  if (!codigo_empresa) {
    return res.status(400).json({ error: "El campo codigo_empresa es obligatorio" });
  }

  if (!Array.isArray(salidas)) {
    return res.status(400).json({ error: "El campo salidas tiene que ser un array" });
  }

  if (salidas.length === 0) {
    return res.status(400).json({ error: "El array de salidas está vacío" });
  }

  // ── 3. VERIFICAR QUE LA EMPRESA EXISTE ──────────────────────────────────
  // Antes de insertar nada comprobamos que la empresa existe en nuestra BD central
  const conn = await pool.getConnection();

  try {
    const [empresaEncontrada] = await conn.query(
      "SELECT codigo, nombre FROM empresa WHERE codigo = ?",
      [codigo_empresa]
    );

    if (empresaEncontrada.length === 0) {
      return res.status(404).json({
        error: `No existe ninguna empresa con codigo ${codigo_empresa} en la base de datos central`
      });
    }

    const nombreEmpresa = empresaEncontrada[0].nombre;
    console.log(`📥 Sync recibida de empresa: ${nombreEmpresa} (id: ${codigo_empresa})`);
    console.log(`   Total registros recibidos: ${salidas.length}`);

    // ── 4. PROCESAR CADA SALIDA ────────────────────────────────────────────
    // Usamos una transacción para que si algo falla a mitad no queden datos a medias
    let insertadas = 0;
    let duplicadas = 0;
    let invalidas  = 0;

    await conn.beginTransaction();

    for (const salida of salidas) {
      const { nro_salida, codigo_barras, fecha_salida } = salida;

      // Saltamos registros que no tienen todos los campos
      if (!nro_salida || !codigo_barras || !fecha_salida) {
        console.warn(`   ⚠️  Registro inválido saltado:`, salida);
        invalidas++;
        continue;
      }

      // Convertimos la fecha de formato ISO (que manda JavaScript)
      // al formato que entiende MySQL: "2026-03-09 10:00:00"
      // JavaScript manda: "2026-03-09T10:00:00.000Z"
      // MySQL necesita:   "2026-03-09 10:00:00"
      const fechaParaMySQL = new Date(fecha_salida)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      // Comprobamos si este registro ya existe en la BD central
      // para evitar duplicados si el cliente manda el mismo registro dos veces
      const [registroExistente] = await conn.query(
        `SELECT codigo 
         FROM salidas 
         WHERE codigo_empresa = ? 
           AND codigo_barras  = ? 
           AND fecha_salida   = ?`,
        [codigo_empresa, codigo_barras, fechaParaMySQL]
      );

      if (registroExistente.length > 0) {
        // Ya existe, no lo insertamos de nuevo
        duplicadas++;
        continue;
      }

      // Insertamos el registro nuevo
      await conn.query(
        `INSERT INTO salidas (codigo_empresa, nro_salida, codigo_barras, fecha_salida) 
         VALUES (?, ?, ?, ?)`,
        [codigo_empresa, nro_salida, codigo_barras, fechaParaMySQL]
      );
      insertadas++;
    }

    // Si todo fue bien confirmamos la transacción
    await conn.commit();

    // ── 5. RESPUESTA ─────────────────────────────────────────────────────
    console.log(`✅ Sync de ${nombreEmpresa} completada:`);
    console.log(`   - Insertadas: ${insertadas}`);
    console.log(`   - Duplicadas (ya existían): ${duplicadas}`);
    console.log(`   - Inválidas (campos vacíos): ${invalidas}`);

    return res.json({
      ok        : true,
      empresa   : nombreEmpresa,
      insertadas,
      duplicadas,
      invalidas,
      total_recibidas: salidas.length
    });

  } catch (err) {
    // Si algo falla revertimos todos los cambios de esta sync
    await conn.rollback();
    console.error("❌ Error durante la sync, se ha hecho rollback:", err.message);
    return res.status(500).json({ error: "Error interno al sincronizar las salidas" });

  } finally {
    // Siempre liberamos la conexión al pool aunque haya habido un error
    conn.release();
  }
};
