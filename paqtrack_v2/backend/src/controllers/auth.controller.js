"use strict";
import { pool }  from "../config/db.js";
import jwt       from "jsonwebtoken";
import bcrypt    from "bcryptjs";

const SECRET      = process.env.JWT_SECRET || "clave_secreta_cambiar_en_produccion";
const EXPIRACION  = "8h"; 

export const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  
  if (!correo || !contrasena)
    return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });

  try {
    
    const [rows] = await pool.query(
      `SELECT codigo_usuario, codigo_empresa, correo, contrasena, rol
       FROM usuarios
       WHERE correo = ?
       LIMIT 1`,
      [correo]
    );

    if (rows.length === 0)
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });

    const usuario = rows[0];

    
    const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!coincide)
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });

    
    const payload = {
      codigo_usuario:  usuario.codigo_usuario,
      codigo_empresa:  usuario.codigo_empresa, 
      correo:          usuario.correo,
      rol:             usuario.rol
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: EXPIRACION });

    
    return res.status(200).json({
      token,
      usuario: {
        codigo_usuario: usuario.codigo_usuario,
        codigo_empresa: usuario.codigo_empresa,
        correo:         usuario.correo,
        rol:            usuario.rol
      }
    });

  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const perfil = async (req, res) => {
  
  try {
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
