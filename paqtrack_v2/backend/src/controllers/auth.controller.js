"use strict";
import { pool }  from "../config/db.js";
import jwt       from "jsonwebtoken";
import bcrypt    from "bcryptjs";

// Clave secreta para firmar los tokens JWT — cambiar en producción
const SECRET     = process.env.JWT_SECRET || "clave_secreta_cambiar_en_produccion";
const EXPIRACION = "8h";

// Inicia sesión con correo y contraseña
// Devuelve un token JWT y los datos básicos del usuario
export const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena)
    return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });

  try {
    // Buscamos el usuario por correo
    const [rows] = await pool.query(
      `SELECT codigo_usuario, codigo_empresa, correo, contrasena, rol
       FROM usuarios
       WHERE correo = ?
       LIMIT 1`,
      [correo]
    );

    // Mismo mensaje tanto si el usuario no existe como si la contraseña es incorrecta
    // para no dar pistas sobre qué correos están registrados
    if (rows.length === 0)
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });

    const usuario = rows[0];

    // Comparamos la contraseña con el hash guardado en la BD
    const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!coincide)
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });

    // Metemos en el token los datos que necesitamos en cada petición
    // para no tener que ir a la BD en cada request
    const payload = {
      codigo_usuario: usuario.codigo_usuario,
      codigo_empresa: usuario.codigo_empresa, // null si es superadmin
      correo        : usuario.correo,
      rol           : usuario.rol
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: EXPIRACION });

    return res.status(200).json({
      token,
      usuario: {
        codigo_usuario: usuario.codigo_usuario,
        codigo_empresa: usuario.codigo_empresa,
        correo        : usuario.correo,
        rol           : usuario.rol
      }
    });

  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// Devuelve los datos del usuario que está haciendo la petición
// El usuario se saca del token JWT que verifica el middleware
export const perfil = async (req, res) => {
  try {
    // Traemos también el nombre de la empresa con un JOIN
    const [rows] = await pool.query(
      `SELECT u.codigo_usuario, u.codigo_empresa, u.correo, u.rol,
              e.nombre AS nombre_empresa
       FROM usuarios u
       LEFT JOIN empresa e ON e.codigo = u.codigo_empresa
       WHERE u.codigo_usuario = ?
       LIMIT 1`,
      [req.usuario.codigo_usuario]
    );

    if (rows.length === 0)
      return res.status(404).json({ mensaje: "Usuario no encontrado" });

    return res.status(200).json({ usuario: rows[0] });

  } catch (err) {
    console.error("Error en perfil:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};