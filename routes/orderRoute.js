import { Router } from "express";
import * as controller from "../controllers/orderController.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id/status", controller.updateStatus);
router.patch("/:id/total", controller.updateTotal);
router.delete("/:id", controller.remove);

// Order courses
// FIX Bug #5: Hapus GET /courses/:courseId yang salah dipetakan ke updateCourseStatus (side-effect).
// GET valid hanya /:orderId/courses (ambil semua course untuk 1 order).
router.patch("/courses/:courseId", controller.updateCourseStatus);
router.get("/:orderId/courses", controller.getCourses);
router.post("/:orderId/courses", controller.addCourse);
router.patch("/:orderId/courses/:courseId", controller.updateCourseStatus);

export default router;
