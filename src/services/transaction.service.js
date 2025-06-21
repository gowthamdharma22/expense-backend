import WholesaleTransaction from "../models/WholeSaleTransaction.js";
import RetailTransaction from "../models/RetailTransaction.js";
import logger from "../utils/logger.js";
import Shop from "../models/Shop.js";
import dayjs from "dayjs";
export const recordTransaction = async ({
  shopType,
  shopId,
  amount,
  type,
  description,
  dayExpenseId = 0,
  isAdjustment = false,
}) => {
  try {
    const data = {
      shopId,
      amount,
      type,
      description,
      dayExpenseId,
      isAdjustment,
    };

    if (shopType === "wholesale") {
      return await WholesaleTransaction.create(data);
    } else {
      return await RetailTransaction.create(data);
    }
  } catch (err) {
    logger.error(
      `[transaction.service.js] [recordTransaction] - ${err.message}`
    );
    throw new Error("Transaction recording failed");
  }
};

export const getTransactionsByShopId = async ({ shopId, month, day }) => {
  try {
    const shop = await Shop.findOne({ id: shopId });
    if (!shop) {
      throw new Error("Shop not found");
    }

    const shopType = shop.shopType;
    const Model =
      shopType === "wholesale" ? WholesaleTransaction : RetailTransaction;

    const query = { shopId };

    if (day) {
      const parsedDay = dayjs(day, "YYYY-MM-DD", true);
      if (!parsedDay.isValid()) {
        throw new Error("Invalid day format. Expected YYYY-MM-DD.");
      }

      const start = parsedDay.startOf("day").toDate();
      const end = parsedDay.endOf("day").toDate();
      query.createdAt = { $gte: start, $lte: end };
    } else if (month) {
      const parsedMonth = dayjs(month, "YYYY-MM", true);
      if (!parsedMonth.isValid()) {
        throw new Error("Invalid month format. Expected YYYY-MM.");
      }

      const start = parsedMonth.startOf("month").toDate();
      const end = parsedMonth.endOf("month").toDate();
      query.createdAt = { $gte: start, $lte: end };
    }

    const records = await Model.find(query).sort({ createdAt: -1 });

    const credit = records
      .filter((r) => r.type === "credit")
      .reduce((sum, r) => sum + r.amount, 0);

    const debit = records
      .filter((r) => r.type === "debit")
      .reduce((sum, r) => sum + r.amount, 0);

    const pendingAmount = credit - debit;

    return { records, pendingAmount, shopType };
  } catch (err) {
    logger.error(
      `[transaction.service.js] [getTransactionsByShopId] - ${err.message}`
    );
    throw new Error(err.message || "Transaction lookup failed");
  }
};
