import { Router } from "express";
import * as controller from "../controllers/sesiMakanController.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id/status", controller.toggleStatus);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
