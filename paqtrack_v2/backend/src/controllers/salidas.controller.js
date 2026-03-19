"use strict";
import { pool } from "../config/db.js";

export const  getAll = async (req, res) => {
  try {
    const { nro_salida, codigo_barras, desde, hasta, codigo_empresa } = req.query;
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;
    const offset = (pagina - 1) * limite;
    const condiciones = [];
    const params = [];

    if (req.empresaFiltro !== null) {
      condiciones.push("s.codigo_empresa = ?");
      params.push(req.empresaFiltro);
    }
    if (codigo_empresa && req.empresaFiltro === null) {
      condiciones.push("s.codigo_empresa = ?");
      params.push(parseInt(codigo_empresa));
    }
    if (nro_salida) {
      condiciones.push("s.nro_salida = ?");
      params.push(parseInt(nro_salida));
    }
    if (codigo_barras) {
      condiciones.push("s.codigo_barras LIKE ?");
      params.push(`%${codigo_barras}%`);
    }
    if (desde) {
      condiciones.push("DATE(s.fecha_salida) >= DATE(?)");
      params.push(desde);
    }
    if (hasta) {
      condiciones.push("DATE(s.fecha_salida) <= DATE(?)");
      params.push(hasta);
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

    const [totales] = await pool.query(
      `SELECT COUNT(*) AS total FROM salidas s ${where}`,
      params
    );
    const total = totales[0].total;

    const [rows] = await pool.query(
      `SELECT
         s.codigo,
         s.codigo_empresa,
         e.nombre AS nombre_empresa,
         s.nro_salida,
         s.codigo_barras,
         s.fecha_salida
       FROM salidas s
       LEFT JOIN empresa e ON e.codigo = s.codigo_empresa
       ${where}
       ORDER BY s.fecha_salida DESC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    return res.status(200).json({
      total,
      pagina,   
      limite,
      paginas: Math.ceil(total / limite),
      salidas: rows
    });
  } catch (err) {
    console.error("Error en getAll salidas:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT
         s.codigo,
         s.codigo_empresa,
         e.nombre AS nombre_empresa,
         s.nro_salida,
         s.codigo_barras,
         s.fecha_salida
       FROM salidas s
       LEFT JOIN empresa e ON e.codigo = s.codigo_empresa
       WHERE s.codigo = ?`,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ mensaje: "Salida no encontrada" });
    if (req.usuario.rol !== "superadmin") {
      if (rows[0].codigo_empresa !== req.usuario.codigo_empresa)
        return res.status(403).json({ mensaje: "No tienes acceso a esta salida" });
    }
    return res.status(200).json({ salida: rows[0] });
  } catch (err) {
    console.error("Error en getById salida:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const buscarPorCodigo = async (req, res) => {
  try {
    const { codigoBarras } = req.params;
    const condiciones = ["s.codigo_barras = ?"];
    const params = [codigoBarras];
    if (req.empresaFiltro !== null) {
      condiciones.push("s.codigo_empresa = ?");
      params.push(req.empresaFiltro);
    }
    const where = `WHERE ${condiciones.join(" AND ")}`;
    const [rows] = await pool.query(
      `SELECT
         s.codigo,
         s.codigo_empresa,
         e.nombre AS nombre_empresa,
         s.nro_salida,
         s.codigo_barras,
         s.fecha_salida
       FROM salidas s
       LEFT JOIN empresa e ON e.codigo = s.codigo_empresa
       ${where}
       ORDER BY s.fecha_salida DESC`,
      params
    );
    if (rows.length === 0)
      return res.status(404).json({ mensaje: "No se encontraron registros para ese código de barras" });
    return res.status(200).json({
      codigo_barras: codigoBarras,
      total: rows.length,
      historial: rows
    });
  } catch (err) {
    console.error("Error en buscarPorCodigo:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const create = async (req, res) => {
  try {
    const { nro_salida, codigo_barras, fecha_salida } = req.body;
    if (!nro_salida || !codigo_barras)
      return res.status(400).json({ mensaje: "nro_salida y codigo_barras son obligatorios" });

    let codigo_empresa;
    if (req.usuario.rol === "admin") {
      codigo_empresa = req.usuario.codigo_empresa;
    } else {
      codigo_empresa = req.body.codigo_empresa;
      if (!codigo_empresa)
        return res.status(400).json({ mensaje: "codigo_empresa es obligatorio" });
    }

    const fecha = fecha_salida || new Date();
    const [result] = await pool.query(
      `INSERT INTO salidas (codigo_empresa, nro_salida, codigo_barras, fecha_salida)
       VALUES (?, ?, ?, ?)`,
      [codigo_empresa, nro_salida, codigo_barras, fecha]
    );
    return res.status(201).json({
      mensaje: "Salida registrada correctamente",
      salida: {
        codigo: result.insertId,
        codigo_empresa,
        nro_salida,
        codigo_barras,
        fecha_salida: fecha
      }
    });
  } catch (err) {
    console.error("Error en create salida:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT codigo FROM salidas WHERE codigo = ? LIMIT 1",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ mensaje: "Salida no encontrada" });
    await pool.query("DELETE FROM salidas WHERE codigo = ?", [id]);
    return res.status(200).json({ mensaje: "Salida eliminada correctamente" });
  } catch (err) {
    console.error("Error en remove salida:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const estadisticas = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const condiciones = [];
    const params = [];

    if (req.empresaFiltro !== null) {
      condiciones.push("s.codigo_empresa = ?");
      params.push(req.empresaFiltro);
    }
    if (desde) {
      condiciones.push("DATE(s.fecha_salida) >= DATE(?)");
      params.push(desde);
    }
    if (hasta) {
      condiciones.push("DATE(s.fecha_salida) <= DATE(?)");
      params.push(hasta);
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

    const [totalRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM salidas s ${where}`,
      params
    );
    const [porSalida] = await pool.query(
      `SELECT s.nro_salida, COUNT(*) AS total
       FROM salidas s ${where}
       GROUP BY s.nro_salida
       ORDER BY s.nro_salida ASC`,
      params
    );
    const [porEmpresa] = await pool.query(
      `SELECT e.nombre AS nombre_empresa, COUNT(*) AS total
       FROM salidas s
       LEFT JOIN empresa e ON e.codigo = s.codigo_empresa
       ${where}
       GROUP BY s.codigo_empresa
       ORDER BY total DESC`,
      params
    );
    const [porDia] = await pool.query(
      `SELECT DATE(s.fecha_salida) AS dia, COUNT(*) AS total
       FROM salidas s ${where}
       ${condiciones.length > 0 ? "AND" : "WHERE"} DATE(s.fecha_salida) >= DATE(DATE_SUB(NOW(), INTERVAL 30 DAY))
       GROUP BY DATE(s.fecha_salida)
       ORDER BY dia ASC`,
      params
    );

    return res.status(200).json({
      total: totalRows[0].total,
      porSalida,
      porEmpresa,
      porDia
    });
  } catch (err) {
    console.error("Error en estadisticas:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};