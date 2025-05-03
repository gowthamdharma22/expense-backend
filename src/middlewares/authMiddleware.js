import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendError } from "../utils/responseHandler.js";
import logger from "../utils/logger.js";

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        logger.error("[authMiddleware.js] [protect] - User not found");
        return sendError(
          res,
          { message: "User not found" },
          "Unauthorized",
          401
        );
      }

      next();
    } catch (error) {
      logger.error(`[authMiddleware.js] [protect] - ${error.message}`);
      return sendError(
        res,
        { message: "Token verification failed" },
        "Unauthorized",
        401
      );
    }
  } else {
    logger.error(`[authMiddleware.js] [protect] - No token provided`);
    return sendError(
      res,
      { message: "No token provided" },
      "Unauthorized",
      401
    );
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    logger.error("[authMiddleware.js] [admin] - Access denied for non-admin");
    return sendError(
      res,
      { message: "Admins only can access" },
      "Forbidden",
      403
    );
  }
};

export { protect, admin };
