"use strict";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "clave_secreta_cambiar_en_produccion";

export const verificarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; 

  if (!token)
    return res.status(401).json({ mensaje: "Acceso denegado, token requerido" });

  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(403).json({ mensaje: "Token inválido o expirado" });
  }
};

export const soloSuperadmin = (req, res, next) => {
  if (req.usuario.rol !== "superadmin")
    return res.status(403).json({ mensaje: "Requiere rol superadmin" });
  next();
};

export const soloAdmin = (req, res, next) => {
  if (!["superadmin", "admin"].includes(req.usuario.rol))
    return res.status(403).json({ mensaje: "Requiere rol admin o superior" });
  next();
};

export const filtroEmpresa = (req, res, next) => {
  if (req.usuario.rol === "superadmin") {
    req.empresaFiltro = req.query.empresa ? parseInt(req.query.empresa) : null;
  } else {
    req.empresaFiltro = req.usuario.codigo_empresa;
  }
  next();
};
