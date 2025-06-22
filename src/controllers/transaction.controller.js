import * as transactionService from "../services/transaction.service.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import logger from "../utils/logger.js";
import * as Activity from "../services/activity.service.js";
import Shop from "../models/Shop.js";

export const adjustTransaction = async (req, res) => {
  try {
    const { shopId, amount, description, type } = req.body;

    const shop = await Shop.findOne({ id: shopId });
    if (!shop) {
      throw new Error("Shop not found");
    }

    const { shopType } = shop;

    const result = await transactionService.recordTransaction({
      shopType,
      shopId,
      amount,
      type,
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
    const { filter } = req.query;

    let month = null;
    let day = null;

    console.log("query", filter);
    if (filter) {
      if (/^\d{4}-\d{1,2}-\d{2}$/.test(filter)) {
        day = filter;
      } else if (/^\d{4}-\d{1,2}$/.test(filter)) {
        month = filter;
      }
    }

    console.log(month, day, "DAY");
    const result = await transactionService.getTransactionsByShopId({
      shopId: Number(shopId),
      month,
      day,
    });

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

export const getUserwiseTransactionSummary = async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return sendError(
        res,
        { message: "Missing shopId in query" },
        "Missing shopId",
        400
      );
    }

    const result = await transactionService.getUserwiseTransactionSummary(
      Number(shopId)
    );

    sendSuccess(res, result, "User-wise transaction summary fetched", 200);
  } catch (err) {
    logger.error(
      `[transaction.controller.js] [getUserwiseTransactionSummary] - ${err.message}`
    );
    sendError(
      res,
      { message: err.message },
      "Failed to fetch user-wise transaction summary",
      err.status || 500
    );
  }
};
