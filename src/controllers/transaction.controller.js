import * as transactionService from "../services/transaction.service.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import logger from "../utils/logger.js";
import * as Activity from "../services/activity.service.js";
import Shop from "../models/Shop.js";

export const adjustTransaction = async (req, res) => {
  try {
    const { shopId, amount, description } = req.body;

    const shop = await Shop.findOne({ id: shopId });
    if (!shop) {
      throw new Error("Shop not found");
    }

    const { shopType } = shop;

    const result = await transactionService.recordTransaction({
      shopType,
      shopId,
      amount,
      type: "debit",
      description,
      dayExpenseId: 0,
      isAdjustment: true,
    });

    Activity.Logger(
      { shopId, amount },
      `Manual Adjustment recorded: ₹${amount}`
    );
    sendSuccess(res, result, "Adjustment successful", 201);
  } catch (err) {
    logger.error(
      `[transaction.controller.js] [adjustTransaction] - ${err.message}`
    );
    sendError(
      res,
      { message: err.message },
      "Adjustment failed",
      err.status || 500
    );
  }
};

export const getTransactionRecordsByShopId = async (req, res) => {
  try {
    const { shopId } = req.params;
    const result = await transactionService.getTransactionsByShopId(
      Number(shopId)
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
