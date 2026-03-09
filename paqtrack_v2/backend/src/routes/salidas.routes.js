"use strict";
import { Router } from "express";
import { getAll, getById, buscarPorCodigo, create, remove, estadisticas } from "../controllers/salidas.controller.js";
import { verificarToken, soloAdmin, soloSuperadmin, filtroEmpresa } from "../middleware/auth.middleware.js";

export const salidasRouter = Router();

salidasRouter.use(verificarToken);
salidasRouter.use(filtroEmpresa);

salidasRouter.get("/", getAll);
salidasRouter.get("/estadisticas", estadisticas);
salidasRouter.get("/buscar/:codigoBarras", buscarPorCodigo);
salidasRouter.get("/:id", getById);
salidasRouter.post("/", soloAdmin, create);
salidasRouter.delete("/:id", soloSuperadmin, remove);
