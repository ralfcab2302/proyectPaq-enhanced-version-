"use strict";
import { Router } from "express";
import { getAll, getById, create, update, remove } from "../controllers/empresa.controller.js";
import { verificarToken, soloSuperadmin } from "../middleware/auth.middleware.js";

export const empresaRouter = Router();

empresaRouter.use(verificarToken);

empresaRouter.get("/", getAll);
empresaRouter.get("/:id", soloSuperadmin, getById);
empresaRouter.post("/", soloSuperadmin, create);
empresaRouter.put("/:id", soloSuperadmin, update);
empresaRouter.delete("/:id", soloSuperadmin, remove);
