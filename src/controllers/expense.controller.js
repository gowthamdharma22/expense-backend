import logger from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import * as expenseService from "../services/expense.service.js";
import * as Activity from "../services/activity.service.js";

const getAllExpenses = async (req, res) => {
  try {
    const expenses = await expenseService.getAllExpenses();
    sendSuccess(res, expenses, "Fetched expenses successfully", 200);
  } catch (err) {
    logger.error(`[expense.controller.js] [getAllExpenses] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to fetch expenses",
      err.status || 500
    );
  }
};

const createNewExpense = async (req, res) => {
  try {
    const newExpense = await expenseService.createExpense(req.body);

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Created expense (${newExpense.name || "new"})`
    );

    sendSuccess(res, newExpense, "Expense created successfully", 201);
  } catch (err) {
    logger.error(`[expense.controller.js] [createNewExpense] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to create expense",
      err.status || 500
    );
  }
};

const getExpenseById = async (req, res) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id);
    if (!expense) {
      return sendError(
        res,
        { message: "Expense not found" },
        "Failed to fetch expense",
        404
      );
    }
    sendSuccess(res, expense, "Expense fetched successfully", 200);
  } catch (err) {
    logger.error(`[expense.controller.js] [getExpenseById] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to fetch expense",
      err.status || 500
    );
  }
};

const updateExpense = async (req, res) => {
  try {
    const updatedExpense = await expenseService.updateExpense(
      req.params.id,
      req.body
    );
    if (!updatedExpense) {
      return sendError(
        res,
        { message: "Expense not found" },
        "Failed to update expense",
        404
      );
    }

    console.log(updatedExpense);

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Updated expense (${updatedExpense.name})`
    );

    sendSuccess(res, updatedExpense, "Expense updated successfully", 200);
  } catch (err) {
    logger.error(`[expense.controller.js] [updateExpense] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to update expense",
      err.status || 500
    );
  }
};

const deleteExpense = async (req, res) => {
  try {
    const deletedExpense = await expenseService.deleteExpense(req.params.id);
    if (!deletedExpense) {
      return sendError(
        res,
        { message: "Expense not found" },
        "Failed to delete expense",
        404
      );
    }

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Deleted expense (${deletedExpense.name})`
    );

    sendSuccess(
      res,
      { message: "Expense deleted successfully" },
      "Expense deleted",
      200
    );
  } catch (err) {
    logger.error(`[expense.controller.js] [deleteExpense] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to delete expense",
      err.status || 500
    );
  }
};

export {
  getExpenseById,
  getAllExpenses,
  createNewExpense,
  updateExpense,
  deleteExpense,
};
