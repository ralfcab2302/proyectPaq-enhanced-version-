"use strict";
import { Router } from "express";
import { syncSalidas } from "../controllers/sync.controller.js";

export const syncRouter = Router();

// POST /api/sync
// No usa verificarToken — usa API key propia en el header x-api-key
syncRouter.post("/", syncSalidas);
