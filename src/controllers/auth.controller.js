import * as authService from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import logger from "../utils/logger.js";
import * as Activity from "../services/activity.service.js";

const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const requesterRole = req.user?.role;

    if (role === "employee") {
      if (requesterRole !== "admin") {
        return sendError(
          res,
          { message: "Only admin can create employee users" },
          "Unauthorized",
          403
        );
      } else {
        password = "employee@2025";
      }
    }

    const result = await authService.registerUser({ email, password, role });

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
    const requesterRole = req.user?.role;
    if (requesterRole !== "admin") {
      return sendError(
        res,
        { message: "Access denied: Admins only" },
        "Unauthorized",
        403
      );
    }

    const users = await authService.getAllUsers();
    sendSuccess(res, users, "Users fetched successfully", 200);
  } catch (err) {
    logger.error(`[auth.controller.js] [findAllUsers] - ${err.message}`);
    sendError(res, { message: err.message }, "Fetch failed", err.status || 500);
  }
};

export { register, login, findAllUsers };
