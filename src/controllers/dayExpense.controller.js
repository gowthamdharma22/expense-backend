import logger from "../utils/logger.js";
import * as DayService from "../services/day.service.js";
import * as Activity from "../services/activity.service.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import * as DayExpenseService from "../services/dayExpense.service.js";
import CreditDebitUser from "../models/CreditDebitUser.js";

const createDayExpense = async (req, res) => {
  try {
    const { dayId, expenseId, userId } = req.body;
    const isAdmin = req.user?.role === "admin";

    const day = await DayService.getDayById(dayId);
    if (!day) {
      return sendError(res, { message: "Day not found" }, "Invalid Day", 404);
    }
    if (!isAdmin && !day.ignoreFrozenCheck && day.isFrozen) {
      return sendError(
        res,
        { message: "Day is frozen" },
        "Cannot create DayExpense",
        400
      );
    }

    if (expenseId === 1 || expenseId === 2) {
      if (!userId) {
        return sendError(
          res,
          { message: "userId is required for credit/debit expenses" },
          "Missing userId",
          400
        );
      }

      const userExists = await CreditDebitUser.findOne({ id: userId });
      if (!userExists) {
        return sendError(
          res,
          { message: "Invalid userId. No such credit/debit user exists" },
          "Invalid userId",
          400
        );
      }
    }

    const newDayExpense = await DayExpenseService.createDayExpense(req.body);

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Created day expense for day (${day.date})`
    );

    sendSuccess(res, newDayExpense, "DayExpense created successfully", 201);
  } catch (err) {
    logger.error(
      `[dayExpense.controller.js] [createDayExpense] - ${err.message}`
    );
    sendError(
      res,
      { message: err.message },
      "Failed to create DayExpense",
      err.status || 500
    );
  }
};

const getAllDayExpenses = async (req, res) => {
  try {
    const dayExpenses = await DayExpenseService.getAllDayExpenses();
    sendSuccess(res, dayExpenses, "Fetched all DayExpenses successfully", 200);
  } catch (err) {
    logger.error(
      `[dayExpense.controller.js] [getAllDayExpenses] - ${err.message}`
    );
    sendError(
      res,
      { message: err.message },
      "Failed to fetch DayExpenses",
      err.status || 500
    );
  }
};

const verifyDayExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({ error: "Status must be a boolean" });
    }

    const result = await DayExpenseService.verifyDayExpense(id, status);

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Marked day expense (${id}) as ${status ? "verified" : "unverified"}`
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

const getDayExpenseByMonth = async (req, res) => {
  try {
    const { date } = req.params;
    const { shopId } = req.query;
    const dayExpense = await DayExpenseService.getDayExpenseForMonth(
      date,
      shopId
    );
    if (!dayExpense) {
      return sendError(
        res,
        { message: "DayExpense not found" },
        "Not Found",
        404
      );
    }
    sendSuccess(res, dayExpense, "Fetched DayExpense successfully", 200);
  } catch (err) {
    logger.error(
      `[dayExpense.controller.js] [getDayExpenseById] - ${err.message}`
    );
    sendError(
      res,
      { message: err.message },
      "Failed to fetch DayExpense",
      err.status || 500
    );
  }
};

export const getMonthlyExpenseDetails = async (req, res) => {
  try {
    const { shopId } = req.query;
    const { month, expenseId } = req.params;

    if (!shopId || !month || !expenseId) {
      return sendError(
        res,
        { message: "Missing parameters" },
        "Bad Request",
        400
      );
    }

    const result = await DayExpenseService.getMonthlyExpenseDetails(
      Number(shopId),
      Number(expenseId),
      month
    );

    sendSuccess(res, result, "Fetched monthly expense details", 200);
  } catch (err) {
    logger.error(
      `[dayExpense.controller.js] [getMonthlyExpenseDetails] - ${err.message}`
    );
    sendError(
      res,
      { message: err.message },
      "Failed to fetch expense details",
      500
    );
  }
};

const updateDayExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { expenseId, userId } = req.body;
    const isAdmin = req.user?.role === "admin";

    const existing = await DayExpenseService.getDayExpenseById(
      id,
      req.body.shopId
    );
    if (!existing) {
      return sendError(
        res,
        { message: "DayExpense not found" },
        "Not Found",
        404
      );
    }

    const day = await DayService.getDayById(req.body.dayId);
    if (!day) {
      return sendError(res, { message: "Day not found" }, "Invalid Day", 404);
    }

    if (!isAdmin && !day.ignoreFrozenCheck && day.isFrozen) {
      return sendError(
        res,
        { message: "Day is frozen" },
        "Cannot update DayExpense",
        400
      );
    }

    if (!isAdmin && "isVerified" in req.body) {
      return sendError(
        res,
        { message: "Unauthorized" },
        "Only admin can verify",
        403
      );
    }

    if (expenseId === 1 || expenseId === 2) {
      if (!userId) {
        return sendError(
          res,
          { message: "userId is required for credit/debit expenses" },
          "Missing userId",
          400
        );
      }

      const userExists = await CreditDebitUser.findOne({ id: userId });
      if (!userExists) {
        return sendError(
          res,
          { message: "Invalid userId. No such credit/debit user exists" },
          "Invalid userId",
          400
        );
      }
    }

    const updated = await DayExpenseService.updateDayExpense(
      id,
      req.body,
      isAdmin
    );

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Updated day expense (${req.body.dayId})`
    );

    sendSuccess(res, updated, "DayExpense updated successfully", 200);
  } catch (err) {
    logger.error(
      `[dayExpense.controller.js] [updateDayExpense] - ${err.message}`
    );
    sendError(
      res,
      { message: err.message },
      "Failed to update DayExpense",
      err.status || 500
    );
  }
};

const deleteDayExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === "admin";

    const deleted = await DayExpenseService.deleteDayExpense(id, isAdmin);
    if (!deleted) {
      return sendError(
        res,
        { message: "DayExpense not found" },
        "Not Found",
        404
      );
    }

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Deleted day expense (${id})`
    );

    sendSuccess(
      res,
      { message: "DayExpense deleted successfully" },
      "Deleted",
      200
    );
  } catch (err) {
    logger.error(
      `[dayExpense.controller.js] [deleteDayExpense] - ${err.message}`
    );
    sendError(
      res,
      { message: err.message },
      "Failed to delete DayExpense",
      err.status || 500
    );
  }
};

export {
  createDayExpense,
  getAllDayExpenses,
  getDayExpenseByMonth,
  updateDayExpense,
  deleteDayExpense,
  verifyDayExpense,
};
