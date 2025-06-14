import Shop from "../models/Shop.js";
import logger from "../utils/logger.js";
import Expense from "../models/Expense.js";
import { cleanData } from "../utils/responseHandler.js";
import TemplateExpenseBridge from "../models/TemplateExpenseBridge.js";
import {
  createTemplateExpenseBridge,
  updateTemplateExpenseBridge,
} from "./helper/expense.helper.js";

const getAllExpenses = async () => {
  try {
    const expenses = await Expense.find();

    const results = await Promise.all(
      expenses.map(async (expense) => {
        const bridges = await TemplateExpenseBridge.find({
          expenseId: expense.id,
        }).lean();

        const templateIds = bridges.map((b) => b.templateId);
        const shops = templateIds.length
          ? await Shop.find({ templateId: { $in: templateIds } }).lean()
          : [];

        return {
          ...cleanData(expense.toObject()),
          template: cleanData(bridges),
          shop: cleanData(shops),
        };
      })
    );

    return results;
  } catch (err) {
    logger.error(
      "[expense.service.js] [getAllExpenses] - Error fetching expenses: " +
        err.message
    );
    throw new Error("Error fetching expenses: " + err.message);
  }
};

const createExpense = async (data) => {
  try {
    const newExpense = new Expense(data);
    const savedExpense = await newExpense.save();

    if (data.templateId) {
      await createTemplateExpenseBridge(
        savedExpense.id,
        data.templateId,
        data.isDefault
      );
    }

    logger.info(
      `[expense.service.js] [createExpense] - Expense created: ${savedExpense.id}`
    );
    return savedExpense;
  } catch (err) {
    logger.error(
      "[expense.service.js] [createExpense] - Error creating expense: " +
        err.message
    );
    throw new Error("Error creating expense: " + err.message);
  }
};

const getExpenseById = async (expenseId) => {
  try {
    const expense = await Expense.findOne({ id: expenseId });
    if (!expense) {
      const error = new Error("Expense not found");
      error.status = 404;
      throw error;
    }

    const bridges = await TemplateExpenseBridge.find({ expenseId }).lean();

    const templateIds = bridges.map((b) => b.templateId);
    const shops = templateIds.length
      ? await Shop.find({ templateId: { $in: templateIds } }).lean()
      : [];

    return {
      ...cleanData(expense.toObject()),
      bridges: cleanData(bridges),
      shops: cleanData(shops),
    };
  } catch (err) {
    logger.error(
      `[expense.service.js] [getExpenseById] - Error fetching expense by ID: ${err.message}`
    );
    throw new Error("Error fetching expense by ID: " + err.message);
  }
};

const getExpenseByTemplateId = async (templateId) => {
  try {
    const bridges = await TemplateExpenseBridge.find({ templateId }).lean();

    const expenseIds = bridges.map((b) => b.expenseId);
    const expenses = expenseIds.length
      ? await Expense.find({ id: { $in: expenseIds } }).lean()
      : [];

    const expensesWithIsDefault = expenses.map((expense) => {
      const bridge = bridges.find((b) => b.expenseId === expense.id);
      return {
        ...expense,
        isDefault: bridge?.isDefault ?? false,
      };
    });

    return cleanData(expensesWithIsDefault);
  } catch (err) {
    logger.error(`[getExpenseByTemplateId] - ${err.message}`);
    throw new Error("Failed to fetch expenses: " + err.message);
  }
};

const updateExpense = async (expenseId, data) => {
  try {
    const existingExpense = await Expense.findOne({ id: expenseId });
    if (!existingExpense) {
      const error = new Error("Expense not found");
      error.status = 404;
      throw error;
    }

    if (data.templateId || data.isDefault !== undefined) {
      const existingBridge = await TemplateExpenseBridge.findOne({
        expenseId: expenseId,
      });

      if (!existingBridge && data.templateId) {
        await createTemplateExpenseBridge(
          expenseId,
          data.templateId,
          data.isDefault
        );
      } else {
        await updateTemplateExpenseBridge(expenseId, data);
      }
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      { id: expenseId },
      data,
      { new: true }
    );

    logger.info(
      `[expense.service.js] [updateExpense] - Expense updated: ${updatedExpense.id}`
    );

    return updatedExpense;
  } catch (err) {
    logger.error(
      `[expense.service.js] [updateExpense] - Error updating expense: ${err.message}`
    );
    throw new Error("Error updating expense: " + err.message);
  }
};

const deleteExpense = async (expenseId) => {
  try {
    await TemplateExpenseBridge.deleteOne({ expenseId });

    const deletedExpense = await Expense.findOneAndDelete({ id: expenseId });
    if (!deletedExpense) {
      const error = new Error("Expense not found");
      error.status = 404;
      throw error;
    }

    await TemplateExpenseBridge.deleteMany({ expenseId });

    logger.info(
      `[expense.service.js] [deleteExpense] - Expense deleted: ${deletedExpense.id}`
    );
    return deletedExpense;
  } catch (err) {
    logger.error(
      `[expense.service.js] [deleteExpense] - Error deleting expense: ${err.message}`
    );
    throw new Error("Error deleting expense: " + err.message);
  }
};

export {
  createExpense,
  updateExpense,
  deleteExpense,
  getAllExpenses,
  getExpenseById,
  getExpenseByTemplateId,
};
