"use strict";
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
const SELECT_CAMPOS = `
  u.codigo_usuario,
  u.codigo_empresa,
  u.correo,
  u.rol,
  e.nombre AS nombre_empresa
`;
export const getAll = async (req, res) => {
  try {
    let query = `SELECT ${SELECT_CAMPOS} FROM usuarios u LEFT JOIN empresa e ON e.codigo = u.codigo_empresa`;
    let params = [];
    if (req.usuario.rol !== "superadmin") {
      query += " WHERE u.codigo_empresa = ?";
      params.push(req.usuario.codigo_empresa);
    }
    query += " ORDER BY u.codigo_usuario ASC";
    const [rows] = await pool.query(query, params);
    return res.status(200).json({ usuarios: rows });
  } catch (err) {
    console.error("Error en getAll usuarios:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
export const getById = async (req, res) => {
  const { id } = req.params;
  try {
    let query = `SELECT ${SELECT_CAMPOS} FROM usuarios u LEFT JOIN empresa e ON e.codigo = u.codigo_empresa WHERE u.codigo_usuario = ?`;
    let params = [id];
    if (req.usuario.rol !== "superadmin") {
      query += " AND u.codigo_empresa = ?";
      params.push(req.usuario.codigo_empresa);
    }
    const [rows] = await pool.query(query, params);
    if (rows.length === 0)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    return res.status(200).json({ usuario: rows[0] });
  } catch (err) {
    console.error("Error en getById usuario:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
export const create = async (req, res) => {
  let { correo, contrasena, rol, codigo_empresa } = req.body;
  if (!correo || !contrasena)
    return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
  if (req.usuario.rol === "admin") {
    rol = "usuario";
    codigo_empresa = req.usuario.codigo_empresa;
  } else {
    rol = rol || "usuario";
    codigo_empresa = codigo_empresa || null;
  }
  const rolesValidos = ["superadmin", "admin", "usuario"];
  if (!rolesValidos.includes(rol))
    return res.status(400).json({ mensaje: `Rol inválido. Valores permitidos: ${rolesValidos.join(", ")}` });
  try {
    const [existe] = await pool.query(
      "SELECT codigo_usuario FROM usuarios WHERE correo = ? LIMIT 1",
      [correo]
    );
    if (existe.length > 0)
      return res.status(409).json({ mensaje: "Ya existe un usuario con ese correo" });
    const hash = await bcrypt.hash(contrasena, 10);
    const [result] = await pool.query(
      "INSERT INTO usuarios (codigo_empresa, correo, contrasena, rol) VALUES (?, ?, ?, ?)",
      [codigo_empresa, correo, hash, rol]
    );
    return res.status(201).json({
      mensaje: "Usuario creado correctamente",
      usuario: {
        codigo_usuario: result.insertId,
        codigo_empresa,
        correo,
        rol
      }
    });
  } catch (err) {
    console.error("Error en create usuario:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
export const update = async (req, res) => {
  const { id } = req.params;
  const { correo, contrasena, rol } = req.body;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE codigo_usuario = ? LIMIT 1",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    const objetivo = rows[0];
    if (req.usuario.rol === "admin") {
      if (objetivo.codigo_empresa !== req.usuario.codigo_empresa)
        return res.status(403).json({ mensaje: "No puedes editar usuarios de otra empresa" });
      if (objetivo.rol !== "usuario")
        return res.status(403).json({ mensaje: "No puedes editar admins o superadmins" });
      if (rol && rol !== "usuario")
        return res.status(403).json({ mensaje: "No puedes asignar ese rol" });
    }
    const campos = [];
    const params = [];
    if (correo) {
      const [duplicado] = await pool.query(
        "SELECT codigo_usuario FROM usuarios WHERE correo = ? AND codigo_usuario != ? LIMIT 1",
        [correo, id]
      );
      if (duplicado.length > 0)
        return res.status(409).json({ mensaje: "Ese correo ya está en uso" });
      campos.push("correo = ?");
      params.push(correo);
    }
    if (contrasena) {
      const hash = await bcrypt.hash(contrasena, 10);
      campos.push("contrasena = ?");
      params.push(hash);
    }
    if (rol && req.usuario.rol === "superadmin") {
      const rolesValidos = ["superadmin", "admin", "usuario"];
      if (!rolesValidos.includes(rol))
        return res.status(400).json({ mensaje: "Rol inválido" });
      campos.push("rol = ?");
      params.push(rol);
    }
    if (campos.length === 0)
      return res.status(400).json({ mensaje: "No se enviaron campos para actualizar" });
    params.push(id);
    await pool.query(`UPDATE usuarios SET ${campos.join(", ")} WHERE codigo_usuario = ?`, params);
    return res.status(200).json({ mensaje: "Usuario actualizado correctamente" });
  } catch (err) {
    console.error("Error en update usuario:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
export const remove = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE codigo_usuario = ? LIMIT 1",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    const objetivo = rows[0];
    if (objetivo.codigo_usuario === req.usuario.codigo_usuario)
      return res.status(400).json({ mensaje: "No puedes eliminar tu propio usuario" });
    if (req.usuario.rol === "admin") {
      if (objetivo.codigo_empresa !== req.usuario.codigo_empresa)
        return res.status(403).json({ mensaje: "No puedes eliminar usuarios de otra empresa" });
      if (objetivo.rol !== "usuario")
        return res.status(403).json({ mensaje: "No puedes eliminar admins o superadmins" });
    }
    await pool.query("DELETE FROM usuarios WHERE codigo_usuario = ?", [id]);
    return res.status(200).json({ mensaje: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error("Error en remove usuario:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
