import * as authService from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import logger from "../utils/logger.js";
import * as Activity from "../services/activity.service.js";

const register = async (req, res) => {
  try {
    let { email, name, password, role } = req.body;

    if (role === "employee") {
      password = "employee@2025";
    }

    const result = await authService.registerUser({
      email,
      name,
      password,
      role,
    });

    Activity.Logger({ email, role }, "User registered");

    sendSuccess(res, result, "Registration successful", 201);
  } catch (err) {
    logger.error(`[auth.controller.js] [register] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Registration failed",
      err.status || 500
    );
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    Activity.Logger(
      { email, role: result.user.role || "unknown" },
      "User logged in"
    );

    sendSuccess(res, result, "Login successful", 200);
  } catch (err) {
    logger.error(`[auth.controller.js] [login] - ${err.message}`);
    sendError(res, { message: err.message }, "Login failed", err.status || 500);
  }
};

const findAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    sendSuccess(res, users, "Users fetched successfully", 200);
  } catch (err) {
    logger.error(`[auth.controller.js] [findAllUsers] - ${err.message}`);
    sendError(res, { message: err.message }, "Fetch failed", err.status || 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await authService.updateUser(id, req.body);

    Activity.Logger(
      { email: req.body.email, role: req.body.role },
      `Updated user (${updatedUser.email})`
    );

    sendSuccess(res, updatedUser, "User updated successfully", 200);
  } catch (err) {
    logger.error(`[auth.controller.js] [updateUser] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Update failed",
      err.status || 500
    );
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await authService.deleteUser(id);

    Activity.Logger(
      { email: deletedUser.email, role: deletedUser.role },
      `Deleted user (${deletedUser.email})`
    );

    sendSuccess(res, deletedUser, "User deleted successfully", 200);
  } catch (err) {
    logger.error(`[auth.controller.js] [deleteUser] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Delete failed",
      err.status || 500
    );
  }
};

export { register, login, findAllUsers, updateUser, deleteUser };
