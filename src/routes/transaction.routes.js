import express from "express";
import * as transactionController from "../controllers/transaction.controller.js";

const router = express.Router();

router.post("/adjust", transactionController.adjustTransaction);
router.get("/:shopId", transactionController.getTransactionRecordsByShopId);
router.get("/notes/:shopId", transactionController.getUserwiseTransactionSummary);

export default router;
