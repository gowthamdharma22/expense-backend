import Shop from "../models/Shop.js";
import Days from "../models/Day.js";
import logger from "../utils/logger.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
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
      if (diff > allowedEditDays && !day.isFrozen) {
        day.isFrozen = true;
        await day.save();
      } else if (day.isFrozen) {
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

    if (diff > allowedEditDays && !day.isFrozen) {
      day.isFrozen = true;
      await day.save();
    } else if (day.isFrozen) {
      day.isFrozen = false;
      await day.save();
    }

    return day;
  } catch (err) {
    logger.error(`[day.service.js] [getDayById] - Error: ${err.message}`);
    throw new Error("Error fetching day by ID: " + err.message);
  }
};

const getDayByDate = async (date, shopId) => {
  try {
    const shop = await Shop.findOne({ id: shopId });
    if (!shop) {
      const error = new Error("Shop not found");
      error.status = 404;
      throw error;
    }

    const allowedEditDays = shop.allowedEditDays || 0;
    const today = dayjs().utc();
    const targetDate = new Date(date);

    const day = await Days.findOne({ date: targetDate, shopId });
    if (!day) {
      const error = new Error("Day not found");
      error.status = 404;
      throw error;
    }

    const diff = today.diff(targetDate, "day");

    if (diff > allowedEditDays && !day.isFrozen) {
      day.isFrozen = true;
      await day.save();
    } else if (day.isFrozen) {
      day.isFrozen = false;
      await day.save();
    }

    return day;
  } catch (err) {
    logger.error(`[day.service.js] [getDayByDate] - Error: ${err.message}`);
    throw new Error("Error fetching day by date: " + err.message);
  }
};

const createDay = async (data) => {
  try {
    data.isFrozen = false;
    const newDay = await Days.create(data);
    logger.info(`[day.service.js] [createDay] - Day created: ${newDay.id}`);
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

    if (day.isFrozen) {
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

export {
  getAllDays,
  getDayByDate,
  getDayById,
  createDay,
  updateDay,
  deleteDay,
};
