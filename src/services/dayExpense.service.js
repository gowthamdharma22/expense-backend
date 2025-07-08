import DayExpense from "../models/DayExpenses.js";
import logger from "../utils/logger.js";
import { cleanData } from "../utils/responseHandler.js";
import Days from "../models/Day.js";
import Expense from "../models/Expense.js";
import * as TemplateService from "./template.service.js";
import * as TransactionService from "./transaction.service.js";
import * as DayService from "./day.service.js";
import Shop from "../models/Shop.js";
import dayjs from "dayjs";
import CreditDebitUser from "../models/CreditDebitUser.js";
import WholeSaleTransaction from "../models/WholeSaleTransaction.js";
import RetailTransaction from "../models/RetailTransaction.js";

export const getAllDayExpenses = async () => {
  try {
    const dayExpenses = await DayExpense.find().lean();

    const results = await Promise.all(
      dayExpenses.map(async (dayExpense) => {
        const [day, expense] = await Promise.all([
          Days.findOne({ id: dayExpense.dayId }).lean(),
          Expense.findOne({ id: dayExpense.expenseId }).lean(),
        ]);

        return {
          ...cleanData(dayExpense),
          day: day ? cleanData(day) : null,
          expense: expense ? cleanData(expense) : null,
        };
      })
    );

    return results;
  } catch (err) {
    logger.error(
      `[dayExpense.service.js] [getAllDayExpenses] - Error: ${err.message}`
    );
    throw new Error("Error fetching day expenses: " + err.message);
  }
};

export const getDayExpenseById = async (id, shopId) => {
  try {
    const shop = await Shop.findOne({ id: shopId }).lean();
    if (!shop) {
      const error = new Error("Shop not found");
      error.status = 404;
      throw error;
    }

    const dayExpense = await DayExpense.findOne({ id }).lean();
    if (!dayExpense) {
      const error = new Error("DayExpense not found");
      error.status = 404;
      throw error;
    }

    const [day, expense] = await Promise.all([
      Days.findOne({ id: dayExpense.dayId }).lean(),
      Expense.findOne({ id: dayExpense.expenseId }).lean(),
    ]);

    return {
      ...cleanData(dayExpense),
      day: day ? cleanData(day) : null,
      expense: expense
        ? {
            ...cleanData(expense),
            dayExpenseId: dayExpense.id,
          }
        : null,
    };
  } catch (err) {
    logger.error(
      `[dayExpense.service.js] [getDayExpenseById] - ${err.message}`
    );
    throw new Error("Error fetching day expense by ID: " + err.message);
  }
};

export const ensureDaysForMonth = async (monthStr, shopId) => {
  try {
    const parsedMonth = dayjs(monthStr, "YYYY-MM", true);
    if (!parsedMonth.isValid()) {
      throw new Error("Invalid month format. Use YYYY-MM");
    }

    const shop = await Shop.findOne({ id: shopId }).lean();
    if (!shop) {
      const error = new Error("Shop not found");
      error.status = 404;
      throw error;
    }

    const startDate = parsedMonth.startOf("month");
    const endDate = parsedMonth.endOf("month");
    const today = dayjs().startOf("day");
    const daysInMonth = endDate.date();

    const existingDays = await Days.find({
      shopId,
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    }).lean();

    const existingDatesSet = new Set(
      existingDays.map((d) => dayjs(d.date).format("YYYY-MM-DD"))
    );

    const createdDates = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = parsedMonth.date(day);

      if (currentDate.toDate() > today.toDate()) continue;

      const formattedDate = currentDate.format("YYYY-MM-DD");
      if (!existingDatesSet.has(formattedDate)) {
        await DayService.createDay({
          shopId,
          date: formattedDate,
          templateId: shop.templateId,
        });
        createdDates.push(formattedDate);
      }
    }

    return {
      message: "Days created successfully",
      createdCount: createdDates.length,
      createdDates,
    };
  } catch (err) {
    logger.error(
      `[dayExpense.service.js] [ensureDaysForMonth] - Error: ${err.message}`
    );
    throw new Error("Error creating missing days for the month");
  }
};

export const getDayExpenseForMonth = async (monthStr, shopId) => {
  try {
    await ensureDaysForMonth(monthStr, shopId);

    const parsedMonth = dayjs(monthStr, "YYYY-MM", true);
    const start = parsedMonth.startOf("month").toDate();
    const end = parsedMonth.endOf("month").toDate();

    const shop = await Shop.findOne({ id: shopId }).lean();
    if (!shop) throw new Error("Shop not found");

    const allowedEditDays = shop.allowedEditDays || 0;
    const today = dayjs().startOf("day");

    const TransactionModel =
      shop.shopType === "wholesale" ? WholeSaleTransaction : RetailTransaction;

    const days = await Days.find({
      shopId,
      date: { $gte: start, $lte: end },
    })
      .sort({ date: 1 })
      .lean();

    const results = await Promise.all(
      days.map(async (day) => {
        const diff = today.diff(dayjs(day.date).startOf("day"), "day");

        if (!day.ignoreFrozenCheck && diff > allowedEditDays && !day.isFrozen) {
          await Days.updateOne({ id: day.id }, { isFrozen: true });
          day.isFrozen = true;
        } else if (
          !day.ignoreFrozenCheck &&
          diff <= allowedEditDays &&
          day.isFrozen
        ) {
          await Days.updateOne({ id: day.id }, { isFrozen: false });
          day.isFrozen = false;
        }

        const dayExpenses = await DayExpense.find({ dayId: day.id }).lean();

        let totalCredit = 0;
        let totalDebit = 0;

        const expenses = await Promise.all(
          dayExpenses.map(async (d) => {
            const expense = await Expense.findOne({ id: d.expenseId }).lean();
            const type = expense?.type;

            if (type === "credit") totalCredit += d.amount || 0;
            if (type === "debit") totalDebit += d.amount || 0;

            let user = null;

            if ([1, 2].includes(d.expenseId)) {
              const txn = await TransactionModel.findOne({
                dayExpenseId: d.id,
              }).lean();

              if (txn?.userId) {
                user = await CreditDebitUser.findOne({ id: txn.userId }).lean();
              }
            }

            return {
              ...cleanData(d),
              expense: expense
                ? {
                    ...cleanData(expense),
                    user: user ? cleanData(user) : null,
                    dayExpenseId: d.id,
                  }
                : null,
            };
          })
        );

        return {
          day: cleanData(day),
          totalCredit,
          totalDebit,
          cashDifference: Math.max(0, totalCredit - totalDebit),
          expenses,
        };
      })
    );

    return results;
  } catch (err) {
    throw new Error(
      `[getDayExpenseForMonth] Error: ${err.message || "Something went wrong"}`
    );
  }
};

export const getDayExpenseByDate = async (dateStr, shopId) => {
  try {
    const parsedDate = dayjs(dateStr, "YYYY-MM-DD", true);
    if (!parsedDate.isValid()) {
      throw new Error("Invalid date format. Use YYYY-MM-DD");
    }

    const shop = await Shop.findOne({ id: shopId });
    if (!shop) {
      const error = new Error("Shop not found");
      error.status = 404;
      throw error;
    }

    const startOfDay = parsedDate.startOf("day").toDate();
    const endOfDay = parsedDate.endOf("day").toDate();

    let dayEntry = await Days.findOne({
      shopId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).lean();

    if (!dayEntry) {
      const createdDay = await DayService.createDay({
        shopId,
        date: dateStr,
        templateId: shop.templateId,
      });

      dayEntry = createdDay.toObject?.() || createdDay;
    }

    const dayExpenses = await DayExpense.find({
      dayId: dayEntry.id,
    }).lean();

    let totalCredits = 0;
    let totalDebits = 0;

    const enrichedExpenses = await Promise.all(
      dayExpenses.map(async (dayExpense) => {
        const expense = await Expense.findOne({
          id: dayExpense.expenseId,
        }).lean();

        const type = expense?.type;
        if (type === "credit") {
          totalCredits += dayExpense.amount || 0;
        } else if (type === "debit") {
          totalDebits += dayExpense.amount || 0;
        }

        return {
          ...cleanData(dayExpense),
          expense: expense
            ? {
                ...cleanData(expense),
                dayExpenseId: dayExpense.id,
              }
            : null,
        };
      })
    );

    const cashDifference = Math.max(0, totalCredits - totalDebits);

    return {
      templateId: shop.templateId,
      day: cleanData(dayEntry),
      expenses: enrichedExpenses,
      cashDifference,
      totalAmount: totalCredits, // 'total' = credits
    };
  } catch (err) {
    logger.error(
      `[dayExpense.service.js] [getDayExpenseByDate] - Error: ${err.message}`
    );
    throw new Error("Error fetching day expense by date: " + err.message);
  }
};

export const getMonthlyExpenseDetails = async (shopId, expenseId, monthStr) => {
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

    const dayIdMap = new Map();
    for (const d of days) {
      dayIdMap.set(d.id, dayjs(d.date).format("YYYY-MM-DD"));
    }

    const dayIds = [...dayIdMap.keys()];

    const expenses = await DayExpense.find({
      dayId: { $in: dayIds },
      expenseId: Number(expenseId),
      amount: { $gt: 0 },
    }).lean();

    if (!expenses.length) return [];

    const expenseDetail = await Expense.findOne({
      id: Number(expenseId),
    }).lean();
    if (!expenseDetail) {
      throw new Error("Expense not found");
    }

    const summary = expenses.map((exp) => ({
      date: dayIdMap.get(exp.dayId),
      expense: expenseDetail.name,
      type: expenseDetail.type,
      amount: exp.amount,
      description: exp.description || "",
    }));

    summary.sort((a, b) => (dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1));

    return summary;
  } catch (err) {
    throw new Error(`[getMonthlyExpenseDetails] Error: ${err.message}`);
  }
};

export const createDayExpense = async (data) => {
  try {
    const { expenseId, templateId, amount, description, userId } = data;

    const newDayExpense = new DayExpense(data);

    const template = await TemplateService.getTemplateDetails(templateId);

    if (!template || template.shopIds.length === 0) {
      throw new Error("Template is not mapped with any shops");
    }

    const saved = await newDayExpense.save();

    if (expenseId === 1 || expenseId === 2) {
      const type = expenseId === 1 ? "credit" : "debit";

      for (const shopId of template.shopIds) {
        const shop = await Shop.findOne({ id: shopId });

        if (!shop) {
          logger.warn(
            `[createDayExpense] Shop with id ${shopId} not found while linking transaction`
          );
          continue;
        }

        await TransactionService.recordTransaction({
          shopType: shop.shopType,
          shopId: shop.id,
          amount,
          type,
          description,
          dayExpenseId: saved.id,
          userId,
        });
      }
    }

    logger.info(
      `[dayExpense.service.js] [createDayExpense] - Created: ${saved.id}`
    );

    return cleanData(saved.toObject());
  } catch (err) {
    logger.error(
      `[dayExpense.service.js] [createDayExpense] - Error: ${err.message}`
    );
    throw new Error("Error creating day expense: " + err.message);
  }
};

export const updateDayExpense = async (id, data) => {
  try {
    const existing = await DayExpense.findOne({ id });
    if (!existing) {
      const error = new Error("DayExpense not found");
      error.status = 404;
      throw error;
    }

    if (existing.isVerified) {
      const error = new Error("Verified day expense cannot be edited");
      error.status = 403;
      throw error;
    }

    const updated = await DayExpense.findOneAndUpdate({ id }, data, {
      new: true,
    }).lean();

    if (!updated) {
      const error = new Error("DayExpense not found");
      error.status = 404;
      throw error;
    }

    if ([1, 2].includes(updated.expenseId) && data.userId) {
      const dayExpenseId = updated.id;

      const day = await Days.findOne({ id: updated.dayId });
      if (day) {
        const shop = await Shop.findOne({ id: day.shopId });
        if (shop) {
          const TransactionModel =
            shop.shopType === "wholesale"
              ? WholeSaleTransaction
              : RetailTransaction;

          await TransactionModel.updateOne(
            { dayExpenseId },
            { userId: data.userId }
          );
        }
      }
    }

    logger.info(
      `[dayExpense.service.js] [updateDayExpense] - Updated: ${updated.id}`
    );
    return cleanData(updated);
  } catch (err) {
    logger.error(
      `[dayExpense.service.js] [updateDayExpense] - Error: ${err.message}`
    );
    throw new Error("Error updating day expense: " + err.message);
  }
};

export const verifyDayExpense = async (id, status) => {
  try {
    const updated = await DayExpense.findOneAndUpdate(
      { id },
      { isVerified: Boolean(status) },
      { new: true }
    ).lean();

    if (!updated) {
      const error = new Error("DayExpense not found");
      error.status = 404;
      throw error;
    }

    logger.info(
      `[dayExpense.service.js] [verifyDayExpense] - Verified (${status}): ${updated.id}`
    );
    return cleanData(updated);
  } catch (err) {
    logger.error(
      `[dayExpense.service.js] [verifyDayExpense] - Error: ${err.message}`
    );
    throw new Error("Error verifying day expense: " + err.message);
  }
};

export const deleteDayExpense = async (id) => {
  try {
    const existing = await DayExpense.findOne({ id });
    if (!existing) {
      const error = new Error("DayExpense not found");
      error.status = 404;
      throw error;
    }

    if (existing.isVerified) {
      const error = new Error("Verified day expense cannot be deleted");
      error.status = 403;
      throw error;
    }

    const deleted = await DayExpense.findOneAndDelete({ id }).lean();

    if (!deleted) {
      const error = new Error("DayExpense not found");
      error.status = 404;
      throw error;
    }

    logger.info(
      `[dayExpense.service.js] [deleteDayExpense] - Deleted: ${deleted.id}`
    );
    return cleanData(deleted);
  } catch (err) {
    logger.error(
      `[dayExpense.service.js] [deleteDayExpense] - Error: ${err.message}`
    );
    throw new Error("Error deleting day expense: " + err.message);
  }
};
