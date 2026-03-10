"use strict";
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";

// Campos que se devuelven en todas las consultas de usuarios
const SELECT_CAMPOS = `
  u.codigo_usuario,
  u.codigo_empresa,
  u.correo,
  u.rol,
  e.nombre AS nombre_empresa
`;

// Devuelve todos los usuarios
// Si es superadmin devuelve todos, si es admin solo los de su empresa
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

// Devuelve un usuario por su id
// El admin solo puede ver usuarios de su empresa
export const getById = async (req, res) => {
  const { id } = req.params;
  try {
    let query = `SELECT ${SELECT_CAMPOS} FROM usuarios u LEFT JOIN empresa e ON e.codigo = u.codigo_empresa WHERE u.codigo_usuario = ?`;
    let params = [id];

    // Si no es superadmin añadimos filtro por empresa
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

// Crea un nuevo usuario
// El admin solo puede crear usuarios con rol "usuario" en su empresa
// El superadmin puede crear cualquier rol en cualquier empresa
export const create = async (req, res) => {
  let { correo, contrasena, rol, codigo_empresa } = req.body;

  if (!correo || !contrasena)
    return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });

  // Si es admin forzamos su empresa y rol usuario
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
    // Comprobamos que no haya otro usuario con el mismo correo
    const [existe] = await pool.query(
      "SELECT codigo_usuario FROM usuarios WHERE correo = ? LIMIT 1",
      [correo]
    );
    if (existe.length > 0)
      return res.status(409).json({ mensaje: "Ya existe un usuario con ese correo" });

    // Hasheamos la contraseña ante de guardarla
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

// Actualiza los datos de un usuario
// El admin solo puede editar usuarios de su empresa con rol "usuario"
export const update = async (req, res) => {
  const { id } = req.params;
  const { correo, contrasena, rol } = req.body;

  try {
    // Buscamos el usuario que se quiere editar
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE codigo_usuario = ? LIMIT 1",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const objetivo = rows[0];

    // Comprobaciones de permisos para el rol admin
    if (req.usuario.rol === "admin") {
      if (objetivo.codigo_empresa !== req.usuario.codigo_empresa)
        return res.status(403).json({ mensaje: "No puedes editar usuarios de otra empresa" });
      if (objetivo.rol !== "usuario")
        return res.status(403).json({ mensaje: "No puedes editar admins o superadmins" });
      if (rol && rol !== "usuario")
        return res.status(403).json({ mensaje: "No puedes asignar ese rol" });
    }

    // Construimos la query dinámicamente con solo los campos que llegaron
    const campos = [];
    const params = [];

    if (correo) {
      // Comprobamos que el nuevo correo no esté en uso por otro usuario
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
      // Hasheamos la nueva contraseña
      const hash = await bcrypt.hash(contrasena, 10);
      campos.push("contrasena = ?");
      params.push(hash);
    }

    // Solo el superadmin puede cambiar el rol
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

// Elimina un usuario
// No puedes eliminarte a ti mismo
// El admin solo puede eliminar usuarios de su empresa con rol "usuario"
export const remove = async (req, res) => {
  const { id } = req.params;

  try {
    // Buscamos el usuario que se quiere eliminar
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE codigo_usuario = ? LIMIT 1",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const objetivo = rows[0];

    // No puedes eliminarte a ti mismo
    if (objetivo.codigo_usuario === req.usuario.codigo_usuario)
      return res.status(400).json({ mensaje: "No puedes eliminar tu propio usuario" });

    // Comprobaciones de permisos para el rol admin
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