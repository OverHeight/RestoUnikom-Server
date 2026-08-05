import { Router } from "express";
import {
  getAll,
  create,
  markAsRead,
  markAllAsRead
} from "../controllers/notifikasiController.js";

const router = Router();

router.get("/", getAll);
router.post("/", create);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

export default router;
