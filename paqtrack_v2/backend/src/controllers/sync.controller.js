"use strict";
import { pool } from "../config/db.js";

const CAMPOS_REQUERIDOS = ['nro_salida', 'codigo_barras', 'fecha_salida'];

export const syncSalidas = async (req, res) => {
  const apiKeyEsperada = process.env.SYNC_API_KEY || "sync_secret_key";
  if (req.headers["x-api-key"] !== apiKeyEsperada) {
    console.warn("⚠️  Intento de sync con API key inválida");
    return res.status(401).json({ error: "API key inválida" });
  }

  const { codigo_empresa, salidas } = req.body;
  if (!codigo_empresa)                return res.status(400).json({ error: "codigo_empresa es obligatorio" });
  if (!Array.isArray(salidas))        return res.status(400).json({ error: "salidas debe ser un array" });
  if (salidas.length === 0)           return res.status(400).json({ error: "El array de salidas está vacío" });

  const conn = await pool.getConnection();
  try {
    const [empresas] = await conn.query("SELECT nombre FROM empresa WHERE codigo = ?", [codigo_empresa]);
    if (empresas.length === 0)
      return res.status(404).json({ error: `No existe empresa con codigo ${codigo_empresa}` });

    const nombreEmpresa = empresas[0].nombre;
    console.log(`📥 Sync de ${nombreEmpresa} (id: ${codigo_empresa}) — ${salidas.length} registros`);

    let insertadas = 0, duplicadas = 0, invalidas = 0;

    await conn.beginTransaction();
    for (const { nro_salida, codigo_barras, fecha_salida } of salidas) {
      if (!nro_salida || !codigo_barras || !fecha_salida) { invalidas++; continue; }

      const fecha = new Date(fecha_salida).toISOString().slice(0, 19).replace("T", " ");

      const [existe] = await conn.query(
        "SELECT 1 FROM salidas WHERE codigo_empresa=? AND codigo_barras=? AND fecha_salida=?",
        [codigo_empresa, codigo_barras, fecha]
      );
      if (existe.length > 0) { duplicadas++; continue; }

      await conn.query(
        "INSERT INTO salidas (codigo_empresa, nro_salida, codigo_barras, fecha_salida) VALUES (?,?,?,?)",
        [codigo_empresa, nro_salida, codigo_barras, fecha]
      );
      insertadas++;
    }
    await conn.commit();

    console.log(`✅ ${nombreEmpresa} — insertadas: ${insertadas} | duplicadas: ${duplicadas} | inválidas: ${invalidas}`);
    return res.json({ ok: true, empresa: nombreEmpresa, insertadas, duplicadas, invalidas, total_recibidas: salidas.length });

  } catch (err) {
    await conn.rollback();
    console.error("❌ Rollback:", err.message);
    return res.status(500).json({ error: "Error interno al sincronizar" });
  } finally {
    conn.release();
  }
};