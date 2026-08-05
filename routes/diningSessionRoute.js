import { Router } from "express";
import {
  getAll,
  getById,
  create,
  checkInQR,
  endSession
} from "../controllers/diningSessionController.js";

const router = Router();

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.post("/checkin/:token", checkInQR);
router.patch("/:id/end", endSession);

export default router;
