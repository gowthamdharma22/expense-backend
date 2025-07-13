import * as transactionService from "../services/transaction.service.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import logger from "../utils/logger.js";
import * as Activity from "../services/activity.service.js";
import Shop from "../models/Shop.js";

export const adjustTransaction = async (req, res) => {
  try {
    const { shopId, amount, userId, description, type = "adjust" } = req.body;

    if ((type === "credit" || type === "debit") && !userId) {
      throw new Error("userId is required for credit or debit transactions.");
    }

    const shop = await Shop.findOne({ id: shopId });
    if (!shop) {
      throw new Error("Shop not found");
    }

    const result = await transactionService.recordTransaction({
      shopType: shop.shopType,
      shopId,
      amount,
      type,
      description,
      dayExpenseId: 0,
      userId,
    });

    Activity.Logger({ shopId, amount }, `Manual ${type} recorded: ₹${amount}`);

    sendSuccess(res, result, "Transaction recorded successfully", 201);
  } catch (err) {
    logger.error(
      `[transaction.controller.js] [adjustTransaction] - ${err.message}`
    );
    sendError(
      res,
      { message: err.message },
      "Transaction failed",
      err.status || 500
    );
  }
};

export const getTransactionRecordsByShopId = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { month } = req.query;
    const { userId } = req.query;

    const result = await transactionService.getMonthlyTransactionSummary(
      Number(shopId),
      month,
      Number(userId)
    );

    sendSuccess(res, result, "Transaction records fetched successfully", 200);
  } catch (err) {
    logger.error(
      `[transaction.controller.js] [getTransactionRecordsByShopId] - ${err.message}`
    );
    sendError(
      res,
      { message: err.message },
      "Failed to fetch transaction records",
      err.status || 500
    );
  }
};

export const verifyAdjustment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isAdjustmentVerified } = req.body;

    if (typeof isAdjustmentVerified !== "boolean") {
      return res
        .status(400)
        .json({ message: "isAdjustmentVerified must be a boolean" });
    }

    const result = await transactionService.verifyAdjustment(
      id,
      isAdjustmentVerified
    );

    res
      .status(200)
      .json({ message: "Adjustment verification updated", data: result });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};
