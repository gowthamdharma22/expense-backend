import logger from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import * as shopService from "../services/shop.service.js";

const createShopController = async (req, res) => {
  try {
    const { name, templateId } = req.body;
    const userId = req.user.id;

    const newShop = await shopService.createShop(name, userId, templateId);
    sendSuccess(res, "Shop created successfully", newShop, 201);
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
    const updatedShop = await shopService.updateShop(shopId, data);
    sendSuccess(res, "Shop updated successfully", updatedShop, 200);
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
    sendSuccess(res, "Shops fetched successfully", shops, 200);
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
    sendSuccess(res, "Shop fetched successfully", shop, 200);
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
    sendSuccess(res, "Shop deleted successfully", deletedShop, 200);
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
