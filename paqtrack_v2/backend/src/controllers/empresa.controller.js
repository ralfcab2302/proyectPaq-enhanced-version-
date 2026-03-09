"use strict";
import { pool } from "../config/db.js";

export const getAll = async (req, res) => {
  try {
    if (req.usuario.rol === "superadmin") {
      const [rows] = await pool.query("SELECT * FROM empresa");
      return res.status(200).json({ empresas: rows });
    } else {
      const [rows] = await pool.query("SELECT * FROM empresa WHERE codigo = ?", [req.usuario.codigo_empresa]);
      return res.status(200).json({ empresas: rows });
    }
  } catch (error) {
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query("SELECT * FROM empresa WHERE codigo = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Empresa no encontrada" });
    }

    if (req.usuario.rol !== "superadmin" && rows[0].codigo !== req.usuario.codigo_empresa) {
      return res.status(403).json({ mensaje: "No tienes acceso a esta empresa" });
    }

    return res.status(200).json({ empresa: rows[0] });

  } catch (error) {
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const create = async (req, res) => {
  try {
    const { nombre, contacto } = req.body;

    if (!nombre) {
      return res.status(400).json({ mensaje: "El nombre es obligatorio" });
    }

    const [existe] = await pool.query("SELECT codigo FROM empresa WHERE nombre = ? LIMIT 1", [nombre]);
    if (existe.length > 0) {
      return res.status(409).json({ mensaje: "Ya existe una empresa con ese nombre" });
    }

    const [result] = await pool.query(
      "INSERT INTO empresa (nombre, contacto) VALUES (?, ?)",
      [nombre, contacto || null]
    );

    return res.status(201).json({
      mensaje: "Empresa creada correctamente",
      empresa: {
        codigo: result.insertId,
        nombre,
        contacto: contacto || null
      }
    });

  } catch (error) {
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto } = req.body;

    if (!nombre && !contacto) {
      return res.status(400).json({ mensaje: "No se enviaron campos para actualizar" });
    }

    const [rows] = await pool.query("SELECT * FROM empresa WHERE codigo = ? LIMIT 1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Empresa no encontrada" });
    }

    if (nombre) {
      const [duplicado] = await pool.query(
        "SELECT codigo FROM empresa WHERE nombre = ? AND codigo != ? LIMIT 1",
        [nombre, id]
      );
      if (duplicado.length > 0) {
        return res.status(409).json({ mensaje: "Ya existe una empresa con ese nombre" });
      }
    }

    const campos = [];
    const params = [];

    if (nombre) {
      campos.push("nombre = ?");
      params.push(nombre);
    }
    if (contacto) {
      campos.push("contacto = ?");
      params.push(contacto);
    }

    params.push(id);
    await pool.query(`UPDATE empresa SET ${campos.join(", ")} WHERE codigo = ?`, params);

    return res.status(200).json({ mensaje: "Empresa actualizada correctamente" });

  } catch (error) {
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query("SELECT * FROM empresa WHERE codigo = ? LIMIT 1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Empresa no encontrada" });
    }

    const [usuarios] = await pool.query("SELECT codigo_usuario FROM usuarios WHERE codigo_empresa = ? LIMIT 1", [id]);
    if (usuarios.length > 0) {
      return res.status(400).json({ mensaje: "No se puede eliminar una empresa que tiene usuarios asociados" });
    }

    const [totalEmpresas] = await pool.query("SELECT COUNT(*) AS total FROM empresa");
    if (totalEmpresas[0].total <= 1) {
      return res.status(400).json({ mensaje: "No se puede eliminar la única empresa existente" });
    }

    await pool.query("DELETE FROM empresa WHERE codigo = ?", [id]);

    return res.status(200).json({ mensaje: "Empresa eliminada correctamente" });

  } catch (error) {
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};