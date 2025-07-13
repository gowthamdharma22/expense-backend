import express from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/adjust", admin, transactionController.adjustTransaction);
router.get(
  "/notes/:shopId",
  transactionController.getTransactionRecordsByShopId
);

export default router;
