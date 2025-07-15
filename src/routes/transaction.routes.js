import express from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/adjust", transactionController.adjustTransaction);
router.get(
  "/notes/:shopId",
  transactionController.getTransactionRecordsByShopId
);
router.patch("/verify/:id", admin, transactionController.verifyAdjustment);

export default router;
