import { Router } from "express";
import * as controller from "../controllers/inventoryLogController.js";
import { requireRole } from "../middlewares/requireRole.js";
import { auditLog } from "../middlewares/auditMiddleware.js";

const router = Router();

// Only owner or chef can view/adjust stock logs
router.get("/", requireRole(['CHEF']), controller.getAll);
router.post("/adjust", requireRole(['CHEF']), auditLog('ADJUST_STOCK'), controller.adjustStock);

export default router;
