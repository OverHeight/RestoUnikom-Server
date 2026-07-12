import { Router } from "express";
import * as controller from "../controllers/transaksiController.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/order/:orderId", controller.getByOrder);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.patch("/:id/pay", controller.processPayment);
router.delete("/:id", controller.remove);

export default router;
