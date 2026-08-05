import { Router } from "express";
import {
  getAll,
  getById,
  create,
  toggleStatus,
  remove,
} from "../controllers/jadwalSesiController.js";

const router = Router();

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.patch("/:id/toggle", toggleStatus);
router.delete("/:id", remove);

export default router;
