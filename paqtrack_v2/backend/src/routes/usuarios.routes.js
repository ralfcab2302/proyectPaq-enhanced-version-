"use strict";
import { Router } from "express";
import { getAll, getById, create, update, remove } from "../controllers/usuarios.controller.js";
import { verificarToken, soloAdmin } from "../middleware/auth.middleware.js";

export const usuariosRouter = Router();

usuariosRouter.use(verificarToken);

usuariosRouter.get("/", soloAdmin, getAll);
usuariosRouter.get("/:id", soloAdmin, getById);
usuariosRouter.post("/", soloAdmin, create);
usuariosRouter.put("/:id", soloAdmin, update);
usuariosRouter.delete("/:id", soloAdmin, remove);
