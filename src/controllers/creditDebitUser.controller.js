import * as CreditUserService from "../services/creditDebitUser.service.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import logger from "../utils/logger.js";

export const createUser = async (req, res) => {
  try {
    const result = await CreditUserService.createUser(req.body);
    sendSuccess(res, result, "User created successfully", 201);
  } catch (err) {
    logger.error(`[creditUser.controller] [createUser] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to create user",
      err.status || 500
    );
  }
};

export const getAllUsers = async (_req, res) => {
  try {
    const result = await CreditUserService.getAllUsers();
    sendSuccess(res, result, "Users fetched", 200);
  } catch (err) {
    logger.error(`[creditUser.controller] [getAllUsers] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to fetch users",
      err.status || 500
    );
  }
};

export const getUserById = async (req, res) => {
  try {
    const result = await CreditUserService.getUserById(Number(req.params.id));
    sendSuccess(res, result, "User fetched", 200);
  } catch (err) {
    logger.error(`[creditUser.controller] [getUserById] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to fetch user",
      err.status || 500
    );
  }
};

export const updateUser = async (req, res) => {
  try {
    const result = await CreditUserService.updateUser(
      Number(req.params.id),
      req.body
    );
    sendSuccess(res, result, "User updated", 200);
  } catch (err) {
    logger.error(`[creditUser.controller] [updateUser] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to update user",
      err.status || 500
    );
  }
};

export const deleteUser = async (req, res) => {
  try {
    const result = await CreditUserService.deleteUser(Number(req.params.id));
    sendSuccess(res, result, "User deleted", 200);
  } catch (err) {
    logger.error(`[creditUser.controller] [deleteUser] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Failed to delete user",
      err.status || 500
    );
  }
};
