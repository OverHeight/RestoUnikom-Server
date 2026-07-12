import { Router } from "express";
import customerRoutes from "./customerRoute.js";
import sesiMakanRoutes from "./sesiMakanRoute.js";
import mejaRoutes from "./mejaRoute.js";
import menuRoutes from "./menuRoute.js";
import menuHarianRoutes from "./menuHarianRoute.js";
import reservasiRoutes from "./reservasiRoute.js";
import orderRoutes from "./orderRoute.js";
import bahanRoutes from "./bahanRoute.js";
import resepRoutes from "./resepRoute.js";
import transaksiRoutes from "./transaksiRoute.js";
import userRoutes from "./userRoute.js";

const router = Router();

router.use("/customers", customerRoutes);
router.use("/sesi-makan", sesiMakanRoutes);
router.use("/meja", mejaRoutes);
router.use("/menu", menuRoutes);
router.use("/menu-harian", menuHarianRoutes);
router.use("/reservasi", reservasiRoutes);
router.use("/orders", orderRoutes);
router.use("/bahan", bahanRoutes);
router.use("/resep", resepRoutes);
router.use("/transaksi", transaksiRoutes);
router.use("/users", userRoutes);

export default router;
