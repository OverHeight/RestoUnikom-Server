import { Router } from "express";
import * as controller from "../controllers/usersController.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.patch("/:id/password", controller.changePassword);
router.delete("/:id", controller.remove);

export default router;

