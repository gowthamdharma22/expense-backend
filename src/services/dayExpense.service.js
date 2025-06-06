import DayExpense from "../models/DayExpenses.js";
import logger from "../utils/logger.js";
import { cleanData } from "../utils/responseHandler.js";
import Days from "../models/Day.js";
import Expense from "../models/Expense.js";
import * as TemplateService from "./template.service.js";
import * as TransactionService from "./transaction.service.js";
import Shop from "../models/Shop.js";

const getAllDayExpenses = async () => {
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

const getDayExpenseById = async (id) => {
  try {
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
      expense: expense ? cleanData(expense) : null,
    };
  } catch (err) {
    logger.error(
      `[dayExpense.service.js] [getDayExpenseById] - Error: ${err.message}`
    );
    throw new Error("Error fetching day expense: " + err.message);
  }
};

const createDayExpense = async (data) => {
  try {
    const { expenseId, templateId, amount, description } = data;

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

const updateDayExpense = async (id, data) => {
  try {
    if (id == 1 || 2) {
      throw new Error("Default expenses cannot be updated");
    }
    const updated = await DayExpense.findOneAndUpdate({ id }, data, {
      new: true,
    }).lean();

    if (!updated) {
      const error = new Error("DayExpense not found");
      error.status = 404;
      throw error;
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

const verifyDayExpense = async (id, status) => {
  try {
    const updated = await DayExpense.findOneAndUpdate(
      { id },
      { verified: status },
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

const deleteDayExpense = async (id) => {
  try {
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

export {
  createDayExpense,
  updateDayExpense,
  deleteDayExpense,
  getAllDayExpenses,
  getDayExpenseById,
  verifyDayExpense,
};
