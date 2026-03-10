"use strict";
import { pool } from "../config/db.js";

export const syncSalidas = async (req, res) => {

  // Comprobamos que la API key sea correcta
  const apiKeyEsperada = process.env.SYNC_API_KEY || "sync_secret_key";
  if (req.headers["x-api-key"] !== apiKeyEsperada) {
    return res.status(401).json({ error: "API key inválida" });
  }

  // Sacamos los datos del body
  const { codigo_empresa, salidas } = req.body;

  // Validaciones básicas
  if (!codigo_empresa) {
    return res.status(400).json({ error: "codigo_empresa es obligatorio" });
  }
  if (!Array.isArray(salidas)) {
    return res.status(400).json({ error: "salidas debe ser un array" });
  }
  if (salidas.length === 0) {
    return res.status(400).json({ error: "El array de salidas está vacío" });
  }

  // Obtenemos una conexión del pool
  const conn = await pool.getConnection();

  try {
    // Comprobamos que la empresa existe
    const [empresas] = await conn.query(
      "SELECT nombre FROM empresa WHERE codigo = ?",
      [codigo_empresa]
    );

    if (empresas.length === 0) {
      return res.status(404).json({ error: `No existe empresa con codigo ${codigo_empresa}` });
    }

    const nombreEmpresa = empresas[0].nombre;

    // Contadores para el resumen final
    let insertadas = 0;
    let duplicadas = 0;
    let invalidas  = 0;

    // Iniciamos la transacción para que si algo falla se revierta todo
    await conn.beginTransaction();

    // Recorremos cada salida que nos han enviado
    for (const salida of salidas) {
      const { nro_salida, codigo_barras, fecha_salida } = salida;

      if (!nro_salida || !codigo_barras || !fecha_salida) {
        invalidas++;
      } else {
        // Convertimos la fecha al formato que acepta MySQL
        const fecha = new Date(fecha_salida).toISOString().slice(0, 19).replace("T", " ");

        // Comprobamos si ya existe ese registro para evitar duplicados
        const [existe] = await conn.query(
          "SELECT 1 FROM salidas WHERE codigo_empresa = ? AND codigo_barras = ? AND fecha_salida = ?",
          [codigo_empresa, codigo_barras, fecha]
        );

        if (existe.length > 0) {
          duplicadas++;
        } else {
          // Insertamos el registro
          await conn.query(
            "INSERT INTO salidas (codigo_empresa, nro_salida, codigo_barras, fecha_salida) VALUES (?, ?, ?, ?)",
            [codigo_empresa, nro_salida, codigo_barras, fecha]
          );
          insertadas++;
        }
      }
    }

    // Si todo fue bien confirmamos la transacción
    await conn.commit();

    console.log(`✅ Sync de ${nombreEmpresa} completada — insertadas: ${insertadas} | duplicadas: ${duplicadas} | inválidas: ${invalidas}`);

    return res.json({
      ok             : true,
      empresa        : nombreEmpresa,
      insertadas,
      duplicadas,
      invalidas,
      total_recibidas: salidas.length
    });

  } catch (err) {
    // Si algo falla revertimos todos los cambios
    await conn.rollback();
    console.error("❌ Error en la sync, rollback aplicado:", err.message);
    return res.status(500).json({ error: "Error interno al sincronizar" });

  } finally {
    // Siempre liberamos la conexión aunque haya error
    conn.release();
  }
};