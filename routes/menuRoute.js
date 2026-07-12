import { Router } from "express";
import * as controller from "../controllers/menuController.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/category/:kategori", controller.getByCategory);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.patch("/:id/toggle", controller.toggleActive);
router.delete("/:id", controller.remove);

export default router;
