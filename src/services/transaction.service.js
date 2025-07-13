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
}) => {
  try {
    if ((type === "credit" || type === "debit") && !userId) {
      throw new Error("userId is required for credit or debit transactions.");
    }

    const data = {
      shopId,
      amount,
      type,
      description,
      dayExpenseId,
    };

    if (userId) {
      data.userId = userId;
    }

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

    const baseQuery = { shopId };

    if (monthStr) {
      const parsedMonth = dayjs(monthStr, "YYYY-MM", true);
      if (!parsedMonth.isValid()) {
        throw new Error("Invalid month format. Use YYYY-MM");
      }
      baseQuery.createdAt = {
        $gte: parsedMonth.startOf("month").toDate(),
        $lte: parsedMonth.endOf("month").toDate(),
      };
    }

    const transactions = await Model.find(baseQuery).lean();
    if (!transactions.length)
      return { summary: [], totalAmount: 0, adjustments: [] };

    const userIds = [
      ...new Set(
        transactions
          .filter((t) => t.userId && t.type !== "adjust")
          .map((t) => t.userId)
      ),
    ];

    const users = await CreditDebitUser.find({ id: { $in: userIds } })
      .select("id name phone")
      .lean();

    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const adjustments = transactions
      .filter((t) => t.type === "adjust")
      .map((t) => ({
        id: t.id,
        amount: t.amount,
        type: "adjust",
        description: t.description,
        date: dayjs(t.createdAt).format("YYYY-MM-DD"),
        isAdjustmentVerified: t.isAdjustmentVerified,
      }));

    if (userId) {
      const summary = transactions
        .filter(
          (t) =>
            t.userId === Number(userId) && t.type !== "adjust" && t.amount > 0
        )
        .map((t) => ({
          id: t.id,
          date: dayjs(t.createdAt).format("YYYY-MM-DD"),
          name: userMap[t.userId]?.name || "Unknown",
          type: t.type,
          amount: t.amount,
          description: t.description || null,
        }));

      const totalCreditDebit = summary.reduce((sum, t) => {
        return t.type === "debit" ? sum - t.amount : sum + t.amount;
      }, 0);

      const totalVerifiedAdjustments = adjustments
        .filter((a) => a.isAdjustmentVerified)
        .reduce((sum, a) => sum + a.amount, 0);

      const totalAmount = totalCreditDebit + totalVerifiedAdjustments;

      return { summary, totalAmount, adjustments };
    }

    const grouped = {};

    for (const txn of transactions) {
      if (txn.type === "adjust") continue;

      const uid = txn.userId;
      if (!uid) continue;

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

      const entry = {
        date: dayjs(txn.createdAt).format("YYYY-MM-DD"),
        type: txn.type,
        amount: txn.amount,
        description: txn.description || null,
      };

      if (txn.type === "credit") {
        grouped[uid].totalCredit += txn.amount;
      } else if (txn.type === "debit") {
        grouped[uid].totalDebit += txn.amount;
      }

      grouped[uid].records.push(entry);
    }

    const summary = Object.values(grouped).map((entry) => ({
      ...entry,
      balanceAmount: entry.totalCredit - entry.totalDebit,
    }));

    const totalCreditDebit = summary.reduce(
      (sum, user) => sum + user.balanceAmount,
      0
    );

    const totalVerifiedAdjustments = adjustments
      .filter((a) => a.isAdjustmentVerified)
      .reduce((sum, a) => sum + a.amount, 0);

    const totalAmount = totalCreditDebit + totalVerifiedAdjustments;

    return { summary, totalAmount, adjustments };
  } catch (err) {
    logger.error(
      `[transaction.service.js] [getMonthlyTransactionSummary] - ${err.message}`
    );
    throw new Error(`Error in getMonthlyTransactionSummary: ${err.message}`);
  }
};

export const verifyAdjustment = async (id, isAdjustmentVerified) => {
  const txn =
    (await RetailTransaction.findOne({ id })) ||
    (await WholesaleTransaction.findOne({ id }));

  if (!txn) throw new Error("Transaction not found");

  if (txn.type !== "adjust") {
    throw new Error("Only adjustment transactions can be verified");
  }

  txn.isAdjustmentVerified = isAdjustmentVerified;
  await txn.save();

  return txn.toObject();
};
