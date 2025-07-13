import CreditDebitUser from "../models/CreditDebitUser.js";
import { cleanData } from "../utils/responseHandler.js";

export const createUser = async (data) => {
  const created = await CreditDebitUser.create(data);
  return cleanData(created.toObject());
};

export const getAllUsers = async () => {
  const users = await CreditDebitUser.find().sort({ name: 1 }).lean();
  const filteredUsers = users.filter(
    (user) => user.id !== 1 && user.name.toUpperCase() !== "ADMIN"
  );

  return cleanData(filteredUsers);
};

export const getUserById = async (id) => {
  const user = await CreditDebitUser.findOne({ id }).lean();
  if (!user) throw new Error("User not found");
  return cleanData(user);
};

export const updateUser = async (id, data) => {
  const updated = await CreditDebitUser.findOneAndUpdate({ id }, data, {
    new: true,
  }).lean();
  if (!updated) throw new Error("User not found");
  return cleanData(updated);
};

export const deleteUser = async (id) => {
  const deleted = await CreditDebitUser.findOneAndDelete({ id }).lean();
  if (!deleted) throw new Error("User not found");
  return cleanData(deleted);
};
