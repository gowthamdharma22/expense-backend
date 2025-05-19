import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import logger from "../utils/logger.js";

const registerUser = async ({ email, password, role }) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    logger.error("[auth.service.js] [registerUser] - Email already exists");
    const error = new Error("Email already exists");
    error.status = 400;
    throw error;
  }

  const user = new User({
    email,
    password,
    role: role || "employee",
  });

  await user.save();

  logger.info(
    `[auth.service.js] [registerUser] - New user registered: ${email}`
  );
  return { message: "User registered successfully" };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    logger.error(
      "[auth.service.js] [loginUser] - Invalid credentials (email not found)"
    );
    const error = new Error("Invalid credentials");
    error.status = 400;
    throw error;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    logger.error(
      "[auth.service.js] [loginUser] - Invalid credentials (wrong password)"
    );
    const error = new Error("Invalid credentials");
    error.status = 400;
    throw error;
  }

  const token = generateToken(user);

  logger.info(`[auth.service.js] [loginUser] - User logged in: ${email}`);
  return {
    message: "Login successful",
    user: { id: user._id, email: user.email, role: user.role },
    token,
  };
};

const getAllUsers = async () => {
  try {
    const employees = await User.find({ role: "employee" }).select("-password");
    return employees;
  } catch (err) {
    logger.error(`[auth.service.js] [getAllUsers] - ${err.message}`);
    throw new Error("Failed to fetch employee users");
  }
};

export { registerUser, loginUser, getAllUsers };
