import * as authService from "../services/auth.service.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import logger from "../utils/logger.js";

const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const result = await authService.registerUser({ email, password, role });
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
    sendSuccess(res, result, "Login successful", 200);
  } catch (err) {
    logger.error(`[auth.controller.js] [login] - ${err.message}`);
    sendError(res, { message: err.message }, "Login failed", err.status || 500);
  }
};

export { register, login };
