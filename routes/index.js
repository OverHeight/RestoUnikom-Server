import { Router } from "express";
import authRoutes from "./authRoute.js";
import customerRoutes from "./customerRoute.js";
import sesiMakanRoutes from "./sesiMakanRoute.js";
import jadwalSesiRoutes from "./jadwalSesiRoute.js";
import diningSessionRoutes from "./diningSessionRoute.js";
import mejaRoutes from "./mejaRoute.js";
import menuRoutes from "./menuRoute.js";
import menuHarianRoutes from "./menuHarianRoute.js";
import reservasiRoutes from "./reservasiRoute.js";
import orderRoutes from "./orderRoute.js";
import bahanRoutes from "./bahanRoute.js";
import resepRoutes from "./resepRoute.js";
import transaksiRoutes from "./transaksiRoute.js";
import userRoutes from "./userRoute.js";
import inventoryLogRoutes from "./inventoryLogRoute.js";

import notifikasiRoutes from "./notifikasiRoute.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/customers", customerRoutes);
router.use("/sesi-makan", sesiMakanRoutes);
router.use("/jadwal-sesi", jadwalSesiRoutes);
router.use("/dining-session", diningSessionRoutes);
router.use("/dining-sessions", diningSessionRoutes);
router.use("/meja", mejaRoutes);
router.use("/tables", mejaRoutes);
router.use("/menu", menuRoutes);
router.use("/menu-harian", menuHarianRoutes);
router.use("/reservasi", reservasiRoutes);
router.use("/orders", orderRoutes);
router.use("/bahan", bahanRoutes);
router.use("/ingredients", bahanRoutes);
router.use("/resep", resepRoutes);
router.use("/transaksi", transaksiRoutes);
router.use("/users", userRoutes);
router.use("/workers", userRoutes);
router.use("/inventory-log", inventoryLogRoutes);
router.use("/notifikasi", notifikasiRoutes);
router.use("/notifications", notifikasiRoutes);

export default router;
