"use strict";
import { pool } from "../config/db.js";
export const syncSalidas = async (req, res) => {
  const apiKeyRecibida = req.headers["x-api-key"];
  const apiKeyEsperada = process.env.SYNC_API_KEY || "sync_secret_key";
  if (apiKeyRecibida !== apiKeyEsperada) {
    console.warn("⚠️  Intento de sync con API key inválida");
    return res.status(401).json({ error: "API key inválida" });
  }
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
    let insertadas = 0;
    let duplicadas = 0;
    let invalidas  = 0;
    await conn.beginTransaction();
    for (const salida of salidas) {
      const { nro_salida, codigo_barras, fecha_salida } = salida;
      if (!nro_salida || !codigo_barras || !fecha_salida) {
        console.warn(`   ⚠️  Registro inválido saltado:`, salida);
        invalidas++;
        continue;
      }
      const fechaParaMySQL = new Date(fecha_salida)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      const [registroExistente] = await conn.query(
        `SELECT codigo 
         FROM salidas 
         WHERE codigo_empresa = ? 
           AND codigo_barras  = ? 
           AND fecha_salida   = ?`,
        [codigo_empresa, codigo_barras, fechaParaMySQL]
      );
      if (registroExistente.length > 0) {
        duplicadas++;
        continue;
      }
      await conn.query(
        `INSERT INTO salidas (codigo_empresa, nro_salida, codigo_barras, fecha_salida) 
         VALUES (?, ?, ?, ?)`,
        [codigo_empresa, nro_salida, codigo_barras, fechaParaMySQL]
      );
      insertadas++;
    }
    await conn.commit();
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
    await conn.rollback();
    console.error("❌ Error durante la sync, se ha hecho rollback:", err.message);
    return res.status(500).json({ error: "Error interno al sincronizar las salidas" });
  } finally {
    conn.release();
  }
};
