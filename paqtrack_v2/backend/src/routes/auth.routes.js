"use strict";
import { Router } from "express";
import { login, perfil } from "../controllers/auth.controller.js";
import { verificarToken } from "../middleware/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/login",  login);
authRouter.get("/perfil",  verificarToken, perfil);
