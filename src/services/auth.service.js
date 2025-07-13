import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import logger from "../utils/logger.js";

const registerUser = async ({ email, name, password, role }) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    logger.error("[auth.service.js] [registerUser] - Email already exists");
    const error = new Error("Email already exists");
    error.status = 400;
    throw error;
  }

  const user = new User({
    email,
    name,
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
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
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

const updateUser = async (id, data) => {
  try {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const updated = await User.findOneAndUpdate({ id: id }, data, {
      new: true,
    }).select("-password");
    if (!updated) {
      throw new Error("User not found");
    }

    return updated;
  } catch (err) {
    throw new Error(`Update failed: ${err.message}`);
  }
};

const deleteUser = async (id) => {
  try {
    const deleted = await User.findOneAndDelete({ id: id }).select("-password");
    if (!deleted) {
      throw new Error("User not found");
    }

    return deleted;
  } catch (err) {
    throw new Error(`Delete failed: ${err.message}`);
  }
};

export { registerUser, loginUser, getAllUsers, updateUser, deleteUser };
