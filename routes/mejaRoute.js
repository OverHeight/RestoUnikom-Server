import { Router } from "express";
import * as controller from "../controllers/mejaController.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/available", controller.getAvailable);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.patch("/:id/status", controller.updateStatus);
router.delete("/:id", controller.remove);

export default router;
