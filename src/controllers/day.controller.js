import logger from "../utils/logger.js";
import * as DayService from "../services/day.service.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
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
    const day = await DayService.getDayByDate(date, shopId);
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

export {
  createDay,
  getAllDays,
  getDayById,
  getDayByDate,
  updateDay,
  deleteDay,
};
