import { Router } from "express";
import * as controller from "../controllers/customerController.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/phone/:phone", controller.getByPhone);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.patch("/:id/visit", controller.incrementVisit);
router.delete("/:id", controller.remove);

export default router;
