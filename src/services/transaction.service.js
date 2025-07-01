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

export const getMonthlyTransactionSummary = async (
  shopId,
  monthStr = null,
  userId = null
) => {
  try {
    const shop = await Shop.findOne({ id: shopId }).lean();
    if (!shop) throw new Error("Shop not found");

    const Model =
      shop.shopType === "wholesale" ? WholesaleTransaction : RetailTransaction;

    const query = {
      shopId,
      userId: userId ? Number(userId) : { $ne: null },
    };

    if (monthStr) {
      const parsedMonth = dayjs(monthStr, "YYYY-MM", true);
      if (!parsedMonth.isValid()) {
        throw new Error("Invalid month format. Use YYYY-MM");
      }
      const start = parsedMonth.startOf("month").toDate();
      const end = parsedMonth.endOf("month").toDate();
      query.createdAt = { $gte: start, $lte: end };
    }

    const transactions = await Model.find(query).lean();
    if (!transactions.length) return { summary: [], totalAmount: 0 };

    const userIds = [
      ...new Set(transactions.map((t) => t.userId).filter((id) => id != null)),
    ];

    const users = await CreditDebitUser.find({ id: { $in: userIds } })
      .select("id name phone")
      .lean();

    const userMap = {};
    for (const user of users) {
      userMap[user.id] = user;
    }

    if (userId) {
      const details = transactions
        .filter((txn) => txn.amount > 0)
        .map((txn) => ({
          date: dayjs(txn.createdAt).format("YYYY-MM-DD"),
          name: userMap[txn.userId]?.name || "Unknown",
          type: txn.type,
          amount: txn.amount,
          description: txn.description || null,
        }));

      return {
        summary: details,
        totalAmount: details.reduce((sum, txn) => sum + txn.amount, 0),
      };
    }

    const grouped = {};

    for (const txn of transactions) {
      const uid = txn.userId;
      if (!grouped[uid]) {
        grouped[uid] = {
          userId: uid,
          name: userMap[uid]?.name || "Unknown",
          phone: userMap[uid]?.phone || null,
          totalCredit: 0,
          totalDebit: 0,
          records: [],
        };
      }

      if (txn.type === "credit") grouped[uid].totalCredit += txn.amount;
      else if (txn.type === "debit") grouped[uid].totalDebit += txn.amount;

      grouped[uid].records.push({
        date: dayjs(txn.createdAt).format("YYYY-MM-DD"),
        type: txn.type,
        amount: txn.amount,
        description: txn.description || null,
      });
    }

    const summary = Object.values(grouped).map((entry) => ({
      ...entry,
      balanceAmount: entry.totalCredit - entry.totalDebit,
    }));

    const totalAmount = summary.reduce(
      (sum, user) => sum + user.balanceAmount,
      0
    );

    return {
      summary,
      totalAmount,
    };
  } catch (err) {
    logger.error(
      `[transaction.service.js] [getMonthlyTransactionSummary] - ${err.message}`
    );
    throw new Error(`Error in getMonthlyTransactionSummary: ${err.message}`);
  }
};
