import { Router } from "express";
import * as controller from "../controllers/menuHarianController.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/date/:date", controller.getByDate);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
