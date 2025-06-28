import WholesaleTransaction from "../models/WholeSaleTransaction.js";
import RetailTransaction from "../models/RetailTransaction.js";
import CreditDebitUser from "../models/CreditDebitUser.js";
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
  userId,
  isAdjustment = false,
}) => {
  try {
    const data = {
      shopId,
      amount,
      type,
      description,
      dayExpenseId,
      userId,
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

    const records = await Model.find(query)
      .sort({ createdAt: -1 })
      .populate("userId", "id name phone")
      .lean();

    const credit = records
      .filter((r) => r.type === "credit")
      .reduce((sum, r) => sum + r.amount, 0);

    const debit = records
      .filter((r) => r.type === "debit")
      .reduce((sum, r) => sum + r.amount, 0);

    const pendingAmount = credit - debit;

    const formattedRecords = records.map((r) => ({
      ...r,
      user: r.userId
        ? {
            id: r.userId.id,
            name: r.userId.name,
            phone: r.userId.phone || null,
          }
        : null,
    }));

    return {
      records: formattedRecords,
      pendingAmount,
      shopType,
    };
  } catch (err) {
    logger.error(
      `[transaction.service.js] [getTransactionsByShopId] - ${err.message}`
    );
    throw new Error(err.message || "Transaction lookup failed");
  }
};

export const getUserwiseTransactionSummary = async (shopId, userId = null) => {
  const shop = await Shop.findOne({ id: shopId }).lean();
  if (!shop) throw new Error("Shop not found");

  const Model =
    shop.shopType === "wholesale" ? WholesaleTransaction : RetailTransaction;

  const query = { shopId };
  if (userId) {
    query.userId = userId;
  } else {
    query.userId = { $ne: null };
  }

  const transactions = await Model.find(query).lean();

  if (userId) {
    const user = await CreditDebitUser.findOne({ id: userId }).lean();
    if (!user) throw new Error("User not found");

    return transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((txn) => ({
        date: txn.createdAt,
        name: user.name,
        type: txn.type,
        amount: txn.amount,
        description: txn.description || "",
      }));
  }

  const summaryMap = {};

  for (const txn of transactions) {
    const uId = txn.userId;
    if (!summaryMap[uId]) {
      summaryMap[uId] = { totalCredit: 0, totalDebit: 0 };
    }

    if (txn.type === "credit") {
      summaryMap[uId].totalCredit += txn.amount;
    } else if (txn.type === "debit") {
      summaryMap[uId].totalDebit += txn.amount;
    }
  }

  const userIds = Object.keys(summaryMap).map((id) => Number(id));
  const users = await CreditDebitUser.find({ id: { $in: userIds } }).lean();

  return users.map((user) => {
    const data = summaryMap[user.id] || { totalCredit: 0, totalDebit: 0 };
    return {
      userId: user.id,
      name: user.name,
      phone: user.phone || null,
      totalCredit: data.totalCredit,
      totalDebit: data.totalDebit,
      balanceAmount: data.totalCredit - data.totalDebit,
    };
  });
};
