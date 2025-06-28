import logger from "../utils/logger.js";
import * as DayService from "../services/day.service.js";
import { sendSuccess, sendError, cleanData } from "../utils/responseHandler.js";
import * as Activity from "../services/activity.service.js";

const createDay = async (req, res) => {
  try {
    const day = await DayService.createDay(req.body);

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Created day (${day.date})`
    );

    sendSuccess(res, day, "Day created successfully", 201);
  } catch (err) {
    logger.error(`[day.controller.js] [createDay] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to create day",
      err.status || 500
    );
  }
};

const getAllDays = async (req, res) => {
  try {
    const { shopId } = req.query;
    const days = await DayService.getAllDays(shopId);
    sendSuccess(res, days, "Fetched days successfully", 200);
  } catch (err) {
    logger.error(`[day.controller.js] [getAllDays] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to fetch days",
      err.status || 500
    );
  }
};

const getDayById = async (req, res) => {
  try {
    const { id } = req.params;
    const day = await DayService.getDayById(id);
    if (!day) {
      return sendError(
        res,
        { message: "Day not found" },
        "Failed to fetch day",
        404
      );
    }
    sendSuccess(res, day, "Day fetched successfully", 200);
  } catch (err) {
    logger.error(`[day.controller.js] [getDayByDate] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to fetch day",
      err.status || 500
    );
  }
};

const getDayByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const { shopId } = req.query;
    const { days, allowedEditDays } = await DayService.getDayByDate(
      date,
      shopId
    );
    if (!days) {
      return sendError(
        res,
        { message: "Day not found" },
        "Failed to fetch days",
        404
      );
    }
    sendSuccess(
      res,
      { days, allowedEditDays },
      "Day fetched successfully",
      200
    );
  } catch (err) {
    logger.error(`[day.controller.js] [getDayByDate] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to fetch day",
      err.status || 500
    );
  }
};

const getMonthExpenseSummary = async (req, res) => {
  try {
    const { shopId } = req.query;
    const { month } = req.params;

    if (!shopId || !month) {
      return sendError(
        res,
        { message: "shopId and month required" },
        "Bad Request",
        400
      );
    }

    const summary = await DayService.getMonthlyExpenseSummary(
      Number(shopId),
      month
    );

    sendSuccess(
      res,
      {
        month,
        shopId: Number(shopId),
        summary: summary.summary,
        totalAmount: summary.totalAmount,
      },
      "Monthly summary fetched",
      200
    );
  } catch (err) {
    logger.error(
      `[day.controller.js] [getMonthExpenseSummary] - ${err.message}`
    );
    sendError(
      res,
      { message: err.message },
      "Failed to fetch monthly summary",
      500
    );
  }
};

const getActiveMonths = async (req, res) => {
  try {
    const { shopId } = req.query;

    if (!shopId) {
      return sendError(res, { message: "Missing shopId" }, "Bad Request", 400);
    }

    const months = await DayService.getActiveMonths(Number(shopId));

    sendSuccess(res, months, "Fetched active months successfully", 200);
  } catch (err) {
    logger.error(`[day.controller.js] [getActiveMonths] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to fetch active months",
      err.status || 500
    );
  }
};

const updateDay = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === "admin";

    const updatedDay = await DayService.updateDay(id, req.body, isAdmin);
    if (!updatedDay) {
      return sendError(
        res,
        { message: "Day not found" },
        "Failed to update day",
        404
      );
    }

    Activity.Logger(
      {
        email: req.user?.email,
        role: req.user?.role,
      },
      `Updated day (${updatedDay.date})`
    );

    sendSuccess(res, updatedDay, "Day updated successfully", 200);
  } catch (err) {
    logger.error(`[day.controller.js] [updateDay] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to update day",
      err.status || 500
    );
  }
};

const deleteDay = async (req, res) => {
  try {
    const deleted = await DayService.deleteDay(req.params.id);
    if (!deleted) {
      return sendError(
        res,
        { message: "Day not found" },
        "Failed to delete day",
        404
      );
    }

    Activity.Logger(
      {
        email: req.user?.email,
        role: req.user?.role,
      },
      `Deleted day (${deleted.date})`
    );

    sendSuccess(
      res,
      { message: "Day deleted successfully" },
      "Day deleted",
      200
    );
  } catch (err) {
    logger.error(`[day.controller.js] [deleteDay] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to delete day",
      err.status || 500
    );
  }
};

const deleteDayByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const { shopId } = req.query;

    if (!date || !shopId) {
      return res.status(400).json({
        message: "Missing required fields: date or shopId",
      });
    }

    await DayService.deleteDayByDate(date, parseInt(shopId));

    return res.status(200).json({
      message: `Day(s) and related data successfully deleted for date: ${date}`,
    });
  } catch (err) {
    logger.error(`[day.controller.js] [deleteDayByDate] - ${err.message}`);
    return res.status(err.status || 500).json({
      message: err.message || "Failed to delete day by date",
    });
  }
};

const toggleIgnoreFrozenCheck = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (req.user?.role !== "admin") {
      return sendError(res, { message: "Unauthorized" }, "Access Denied", 403);
    }

    const updatedDay = await DayService.toggleIgnoreFrozen(
      Number(id),
      Boolean(status)
    );

    sendSuccess(
      res,
      updatedDay,
      `ignoreFrozenCheck has been ${status ? "enabled" : "disabled"}`,
      200
    );
  } catch (err) {
    logger.error(
      `[day.controller.js] [toggleIgnoreFrozenCheck] - ${err.message}`
    );
    sendError(
      res,
      { message: err.message },
      "Failed to update ignoreFrozenCheck",
      err.status || 500
    );
  }
};

export {
  createDay,
  getAllDays,
  getDayById,
  getDayByDate,
  getMonthExpenseSummary,
  getActiveMonths,
  updateDay,
  deleteDay,
  deleteDayByDate,
  toggleIgnoreFrozenCheck,
};
