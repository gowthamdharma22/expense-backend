import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import logger from "../utils/logger.js";
import Shop from "../models/Shop.js";
import Days from "../models/Day.js";
import DayExpenses from "../models/DayExpenses.js";
import WholeSaleTransaction from "../models/WholeSaleTransaction.js";
import RetailTransaction from "../models/RetailTransaction.js";
import * as DayExpenseService from "./dayExpense.service.js";
import TemplateExpenseBridge from "../models/TemplateExpenseBridge.js";
import Expense from "../models/Expense.js";
import CreditDebitUser from "../models/CreditDebitUser.js";
dayjs.extend(utc);

const getAllDays = async (shopId) => {
  try {
    const shop = await Shop.findOne({ id: shopId });
    if (!shop) {
      const error = new Error("Shop not found");
      error.status = 404;
      throw error;
    }

    const allowedEditDays = shop.allowedEditDays || 0;
    const today = dayjs().utc();

    const days = await Days.find({ shopId });

    for (const day of days) {
      const diff = today.diff(dayjs(day.date).utc().startOf("day"), "day");
      if (!day.ignoreFrozenCheck && diff > allowedEditDays && !day.isFrozen) {
        day.isFrozen = true;
        await day.save();
      } else if (
        !day.ignoreFrozenCheck &&
        diff <= allowedEditDays &&
        day.isFrozen
      ) {
        day.isFrozen = false;
        await day.save();
      }
    }

    return days;
  } catch (err) {
    logger.error(`[day.service.js] [getAllDays] - Error: ${err.message}`);
    throw new Error("Error fetching all days: " + err.message);
  }
};

const getDayById = async (dayId) => {
  try {
    const day = await Days.findOne({ id: dayId });
    if (!day) {
      const error = new Error("Day not found");
      error.status = 404;
      throw error;
    }

    if (!day.shopId) {
    }

    const shop = await Shop.findOne({ id: day.shopId });
    if (!shop) {
      const error = new Error("Shop not found");
      error.status = 404;
      throw error;
    }

    const allowedEditDays = shop.allowedEditDays || 0;
    const today = dayjs().utc();

    const diff = today.diff(dayjs(day.date).utc().startOf("day"), "day");

    if (!day.ignoreFrozenCheck && diff > allowedEditDays && !day.isFrozen) {
      day.isFrozen = true;
      await day.save();
    } else if (
      !day.ignoreFrozenCheck &&
      diff <= allowedEditDays &&
      day.isFrozen
    ) {
      day.isFrozen = false;
      await day.save();
    }

    return day;
  } catch (err) {
    logger.error(`[day.service.js] [getDayById] - Error: ${err.message}`);
    throw new Error("Error fetching day by ID: " + err.message);
  }
};

const getDayByDate = async (dateStr, shopId) => {
  try {
    const shop = await Shop.findOne({ id: shopId });
    if (!shop) {
      const error = new Error("Shop not found");
      error.status = 404;
      throw error;
    }

    const allowedEditDays = shop.allowedEditDays || 0;
    const today = dayjs().utc();

    const parsedDate = dayjs(dateStr, ["YYYY-MM-DD", "YYYY-MM", "YYYY"], true);
    if (!parsedDate.isValid()) {
      throw new Error("Invalid date format. Use YYYY-MM-DD, YYYY-MM or YYYY");
    }

    let startDate, endDate;

    if (dateStr.length === 10) {
      startDate = parsedDate.startOf("day");
      endDate = parsedDate.endOf("day");
    } else if (dateStr.length === 7) {
      startDate = parsedDate.startOf("month");
      endDate = parsedDate.endOf("month");
    } else if (dateStr.length === 4) {
      startDate = parsedDate.startOf("year");
      endDate = parsedDate.endOf("year");
    } else {
      throw new Error("Unsupported date format");
    }

    const days = await Days.find({
      shopId,
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    });

    for (const day of days) {
      const diff = today.diff(dayjs(day.date).utc().startOf("day"), "day");

      if (!day.ignoreFrozenCheck && diff > allowedEditDays && !day.isFrozen) {
        day.isFrozen = true;
        await day.save();
      } else if (
        !day.ignoreFrozenCheck &&
        diff <= allowedEditDays &&
        day.isFrozen
      ) {
        day.isFrozen = false;
        await day.save();
      }
    }

    // 🔁 Return both days and allowedEditDays
    return {
      days,
      allowedEditDays,
    };
  } catch (err) {
    logger.error(`[day.service.js] [getDayByDate] - Error: ${err.message}`);
    throw new Error("Error fetching day by date: " + err.message);
  }
};

const getMonthlyExpenseSummary = async (shopId, monthStr) => {
  try {
    const parsedMonth = dayjs(monthStr, "YYYY-MM", true);
    if (!parsedMonth.isValid()) {
      throw new Error("Invalid month format. Use YYYY-MM");
    }

    const start = parsedMonth.startOf("month").toDate();
    const end = parsedMonth.endOf("month").toDate();

    const days = await Days.find({
      shopId,
      date: { $gte: start, $lte: end },
    }).lean();

    if (!days.length) return [];

    const dayIds = days.map((d) => d.id);

    const allExpenses = await DayExpenses.find({
      dayId: { $in: dayIds },
    }).lean();

    if (!allExpenses.length) return [];

    const summaryMap = new Map();

    for (const exp of allExpenses) {
      if (!exp.expenseId || !exp.amount || exp.amount <= 0) continue;

      if (!summaryMap.has(exp.expenseId)) {
        summaryMap.set(exp.expenseId, {
          totalAmount: 0,
          usedDays: new Set(),
        });
      }

      const current = summaryMap.get(exp.expenseId);
      current.totalAmount += exp.amount;
      current.usedDays.add(exp.dayId);
    }

    const expenseIds = [...summaryMap.keys()];
    const expenseDetails = await Expense.find({
      id: { $in: expenseIds },
    }).lean();

    const enrichedSummary = [];

    for (const exp of expenseDetails) {
      const summary = summaryMap.get(exp.id);

      const enriched = {
        expenseId: exp.id,
        expenseName: exp.name,
        type: exp.type,
        totalAmount: summary.totalAmount,
        daysUsed: summary.usedDays.size,
        isDefault: exp.isDefault || false,
      };

      if (["credit", "debit"].includes(exp.type) && [1, 2].includes(exp.id)) {
        const TransactionModel =
          (await Shop.findOne({ id: shopId }).lean()).shopType === "wholesale"
            ? WholeSaleTransaction
            : RetailTransaction;

        const transactions = await TransactionModel.find({
          shopId,
          type: exp.type,
          createdAt: { $gte: start, $lte: end },
          userId: { $ne: null },
        }).lean();

        const userMap = new Map();

        for (const txn of transactions) {
          const uid = txn.userId;
          if (!userMap.has(uid)) {
            userMap.set(uid, {
              totalAmount: 0,
            });
          }
          userMap.get(uid).totalAmount += txn.amount;
        }

        const userIds = [...userMap.keys()];
        const users = await CreditDebitUser.find({
          id: { $in: userIds },
        }).lean();

        const userSummary = users.map((user) => ({
          userId: user.id,
          name: user.name,
          phone: user.phone || null,
          amount: userMap.get(user.id)?.totalAmount || 0,
        }));

        enriched.userDetails = userSummary;
      }

      enrichedSummary.push(enriched);
    }

    enrichedSummary.sort((a, b) => {
      if (
        a.isDefault &&
        ![1, 2].includes(a.expenseId) &&
        !(b.isDefault && ![1, 2].includes(b.expenseId))
      )
        return -1;
      if (
        b.isDefault &&
        ![1, 2].includes(b.expenseId) &&
        !(a.isDefault && ![1, 2].includes(a.expenseId))
      )
        return 1;
      if (
        !a.isDefault &&
        ![1, 2].includes(a.expenseId) &&
        b.isDefault &&
        ![1, 2].includes(b.expenseId)
      )
        return 1;
      if (
        !b.isDefault &&
        ![1, 2].includes(b.expenseId) &&
        a.isDefault &&
        ![1, 2].includes(a.expenseId)
      )
        return -1;
      if ([1, 2].includes(a.expenseId) && ![1, 2].includes(b.expenseId))
        return 1;
      if ([1, 2].includes(b.expenseId) && ![1, 2].includes(a.expenseId))
        return -1;
    });

    const totalAmount = enrichedSummary.reduce(
      (sum, val) => sum + val.totalAmount,
      0
    );

    return { summary: enrichedSummary, totalAmount };
  } catch (err) {
    throw new Error(
      `[getMonthlyExpenseSummary] Error: ${err.message || "Unknown error"}`
    );
  }
};

const getActiveMonths = async (shopId) => {
  try {
    const days = await Days.find({ shopId }).lean();

    const monthsMap = new Map();

    for (const day of days) {
      if (day.date) {
        const monthKey = dayjs(day.date).format("YYYY-MM");

        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, []);
        }

        monthsMap.get(monthKey).push({
          id: day.id,
          date: day.date,
          isVerified: day.isVerified,
          isFrozen: day.isFrozen,
        });
      }
    }

    const currentMonth = dayjs().format("YYYY-MM");
    if (!monthsMap.has(currentMonth)) {
      monthsMap.set(currentMonth, []);
    }

    const result = [...monthsMap.entries()]
      .sort((a, b) => (dayjs(a[0]).isBefore(dayjs(b[0])) ? -1 : 1))
      .map(([month, days]) => ({
        month,
        days,
      }));

    return result;
  } catch (err) {
    logger.error(`[day.service.js] [getActiveMonths] - ${err.message}`);
    throw new Error("Error fetching active months: " + err.message);
  }
};

const deleteDayByDate = async (dateStr, shopId) => {
  try {
    const shop = await Shop.findOne({ id: shopId });
    if (!shop) {
      throw new Error("Shop not found");
    }

    const parsedDate = dayjs(dateStr, ["YYYY-MM-DD", "YYYY-MM", "YYYY"], true);
    if (!parsedDate.isValid()) {
      throw new Error("Invalid date format. Use YYYY-MM-DD, YYYY-MM or YYYY");
    }

    let startDate, endDate;
    if (dateStr.length === 10) {
      startDate = parsedDate.startOf("day");
      endDate = parsedDate.endOf("day");
    } else if (dateStr.length === 7) {
      startDate = parsedDate.startOf("month");
      endDate = parsedDate.endOf("month");
    } else if (dateStr.length === 4) {
      startDate = parsedDate.startOf("year");
      endDate = parsedDate.endOf("year");
    } else {
      throw new Error("Unsupported date format");
    }

    const daysToDelete = await Days.find({
      shopId,
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    });

    if (daysToDelete.length === 0) {
      throw new Error("No days found for the given date range and shop");
    }

    const dayIds = daysToDelete.map((day) => day.id);

    const dayExpenses = await DayExpenses.find({
      dayId: { $in: dayIds },
    });

    const dayExpenseIds = dayExpenses.map((d) => d.id);

    const transactionModel =
      shop.shopType === "wholesale" ? WholeSaleTransaction : RetailTransaction;

    await transactionModel.deleteMany({
      dayExpenseId: { $in: dayExpenseIds },
    });

    await DayExpenses.deleteMany({ dayId: { $in: dayIds } });
    await Days.deleteMany({ id: { $in: dayIds } });

    logger.info(
      `[day.service.js] [deleteDayByDate] - Deleted ${dayIds.length} day(s) and related records`
    );

    return true;
  } catch (err) {
    logger.error(`[day.service.js] [deleteDayByDate] - Error: ${err.message}`);
    throw new Error("Error deleting day(s) by date: " + err.message);
  }
};

const createDay = async (data) => {
  try {
    const shop = await Shop.findOne({ id: data.shopId });
    if (!shop) {
      const error = new Error("Shop not found");
      error.status = 404;
      throw error;
    }

    const allowedEditDays = shop.allowedEditDays || 0;
    const today = dayjs().utc();
    const targetDate = dayjs(data.date).utc().startOf("day");
    const diff = today.diff(targetDate, "day");

    data.isFrozen = diff > allowedEditDays;

    const existingDay = await Days.findOne({
      shopId: data.shopId,
      date: {
        $gte: dayjs(data.date).startOf("day").toDate(),
        $lte: dayjs(data.date).endOf("day").toDate(),
      },
    });

    if (existingDay) {
      const error = new Error("Day already exists for the given date and shop");
      error.status = 400;
      throw error;
    }

    const newDay = await Days.create(data);
    logger.info(`[day.service.js] [createDay] - Day created: ${newDay.id}`);

    const defaultMappings = await TemplateExpenseBridge.find({
      templateId: data.templateId,
      isDefault: true,
    });

    const expenseIds = defaultMappings.map((bridge) => bridge.expenseId);

    if (expenseIds.length === 0) {
      logger.warn(
        `[day.service.js] [createDay] - No default expenses found for template ${data.templateId}`
      );
      return newDay;
    }

    for (const expenseId of expenseIds) {
      await DayExpenseService.createDayExpense({
        dayId: newDay.id,
        templateId: data.templateId,
        expenseId,
        amount: 0,
      });
    }

    logger.info(
      `[day.service.js] [createDay] - ${expenseIds.length} default day expenses created for day ${newDay.id}`
    );

    return newDay;
  } catch (err) {
    logger.error(`[day.service.js] [createDay] - Error: ${err.message}`);
    throw new Error("Error creating day: " + err.message);
  }
};

const updateDay = async (id, data, isAdmin = false) => {
  try {
    const day = await Days.findOne({ id });
    if (!day) {
      const error = new Error("Day not found");
      error.status = 404;
      throw error;
    }

    if (!isAdmin && !day.ignoreFrozenCheck && day.isFrozen) {
      throw new Error("This day is frozen and cannot be edited.");
    }

    if (!isAdmin) {
      const error = new Error(
        "Only admins are allowed to perform this action."
      );
      error.status = 403;
      throw error;
    }

    Object.assign(day, data);
    const updatedDay = await day.save();

    logger.info(`[day.service.js] [updateDay] - Day updated: ${updatedDay.id}`);
    return updatedDay;
  } catch (err) {
    logger.error(`[day.service.js] [updateDay] - Error: ${err.message}`);
    throw new Error("Error updating day: " + err.message);
  }
};

const deleteDay = async (id) => {
  try {
    const day = await Days.findOne({ id });
    if (!day) {
      const error = new Error("Day not found");
      error.status = 404;
      throw error;
    }

    //todo do we need this?
    // if (day.isFrozen) {
    //   throw new Error("Frozen day cannot be deleted.");
    // }

    await Days.deleteOne({ id });

    logger.info(`[day.service.js] [deleteDay] - Day deleted: ${id}`);
    return true;
  } catch (err) {
    logger.error(`[day.service.js] [deleteDay] - Error: ${err.message}`);
    throw new Error("Error deleting day: " + err.message);
  }
};

const toggleIgnoreFrozen = async (id, status) => {
  const day = await Days.findOne({ id });
  if (!day) {
    const error = new Error("Day not found");
    error.status = 404;
    throw error;
  }

  const freeze = Boolean(status);

  day.ignoreFrozenCheck = freeze;
  day.isFrozen = false;
  await day.save();

  return day;
};

export {
  getAllDays,
  getDayByDate,
  getActiveMonths,
  getDayById,
  getMonthlyExpenseSummary,
  createDay,
  updateDay,
  deleteDay,
  deleteDayByDate,
  toggleIgnoreFrozen,
};
