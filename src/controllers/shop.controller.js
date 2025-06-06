import logger from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import * as shopService from "../services/shop.service.js";
import * as Activity from "../services/activity.service.js";
import mongoose from "mongoose";

const VALID_SHOP_TYPES = ["wholesale", "retail"];

const createShopController = async (req, res) => {
  try {
    const { name, templateId, shopType } = req.body;
    const userId = req.user?._id;

    if (!name || !templateId || !shopType) {
      return sendError(
        res,
        { message: "Missing required fields" },
        "Validation Error",
        400
      );
    }

    if (!VALID_SHOP_TYPES.includes(shopType)) {
      return sendError(
        res,
        { message: "Invalid shopType. Must be 'wholesale' or 'retail'" },
        "Invalid Shop Type",
        400
      );
    }

    const newShop = await shopService.createShop(
      name,
      userId,
      templateId,
      shopType
    );

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Created shop (${newShop.name || "new"}) with type (${shopType})`
    );

    sendSuccess(res, newShop, "Shop created successfully", 201);
  } catch (err) {
    logger.error(
      "[shop.controller.js] [createShopController] - Error creating shop: " +
        err.message
    );
    sendError(
      res,
      { message: err.message },
      "Error creating shop",
      err.status || 500
    );
  }
};

const updateShopController = async (req, res) => {
  try {
    const { shopId } = req.params;
    const data = req.body;

    if (data.shopType && !VALID_SHOP_TYPES.includes(data.shopType)) {
      return sendError(
        res,
        { message: "Invalid shopType. Must be 'wholesale' or 'retail'" },
        "Invalid Shop Type",
        400
      );
    }

    const updatedShop = await shopService.updateShop(shopId, data);

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Updated shop (${updatedShop.name})`
    );

    sendSuccess(res, updatedShop, "Shop updated successfully", 200);
  } catch (err) {
    logger.error(
      "[shop.controller.js] [updateShopController] - Error updating shop: " +
        err.message
    );
    sendError(
      res,
      { message: err.message },
      "Error updating shop",
      err.status || 500
    );
  }
};

const getAllShopsController = async (req, res) => {
  try {
    const shops = await shopService.getAllShops();
    sendSuccess(res, shops, "Shops fetched successfully", 200);
  } catch (err) {
    logger.error(
      "[shop.controller.js] [getAllShopsController] - Error fetching shops: " +
        err.message
    );
    sendError(
      res,
      { message: err.message },
      "Error fetching shops",
      err.status || 500
    );
  }
};

const getShopByIdController = async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await shopService.getShopById(shopId);
    if (!shop) {
      return sendError(res, { message: "Shop not found" }, "Not Found", 404);
    }
    sendSuccess(res, shop, "Shop fetched successfully", 200);
  } catch (err) {
    logger.error(
      "[shop.controller.js] [getShopByIdController] - Error fetching shop by ID: " +
        err.message
    );
    sendError(
      res,
      { message: err.message },
      "Error fetching shop by ID",
      err.status || 500
    );
  }
};

const deleteShopController = async (req, res) => {
  try {
    const { shopId } = req.params;
    const deletedShop = await shopService.deleteShop(shopId);

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Deleted shop (${deletedShop.name})`
    );

    sendSuccess(res, deletedShop, "Shop deleted successfully", 200);
  } catch (err) {
    logger.error(
      "[shop.controller.js] [deleteShopController] - Error deleting shop: " +
        err.message
    );
    sendError(
      res,
      { message: err.message },
      "Error deleting shop",
      err.status || 500
    );
  }
};

export {
  createShopController,
  updateShopController,
  getAllShopsController,
  getShopByIdController,
  deleteShopController,
};
