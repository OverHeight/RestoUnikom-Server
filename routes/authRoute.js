import { Router } from "express";
import { login } from "../controllers/authController.js";
import { auditLog } from "../middlewares/auditMiddleware.js";

const router = Router();

router.post("/login", auditLog('USER_LOGIN'), login);

export default router;
