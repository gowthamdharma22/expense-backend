import Shop from "../models/Shop.js";
import Expense from "../models/Expense.js";
import Template from "../models/Template.js";
import { cleanData } from "../utils/responseHandler.js";
import TemplateExpenseBridge from "../models/TemplateExpenseBridge.js";
import { deleteTemplate } from "./template.service.js";

const createShop = async (name, userId, templateId) => {
  const newShop = new Shop({
    name,
    owner: userId,
    templateId,
  });

  await newShop.save();

  if (templateId) {
    await Template.updateOne(
      { id: templateId },
      { $push: { shopIds: newShop.id } }
    );
  }
  return newShop;
};

const updateShop = async (shopId, data) => {
  const updatedShop = await Shop.findOneAndUpdate(
    { id: shopId },
    { ...data },
    { new: true }
  );

  if (!updatedShop) {
    const error = new Error("Shop not found");
    error.status = 404;
    throw error;
  }
  return updatedShop;
};

const getAllShops = async () => {
  const shops = await Shop.find().lean();

  const results = await Promise.all(
    shops.map(async (shop) => {
      const template = await Template.findOne({ id: shop.templateId }).lean();
      const bridges = await TemplateExpenseBridge.find({
        templateId: shop.templateId,
      }).lean();
      const expenses = bridges.length
        ? await Expense.find({
            id: { $in: bridges.map((b) => b.expenseId) },
          }).lean()
        : [];

      return {
        ...cleanData(shop),
        template: cleanData(template),
        expenses: cleanData(expenses),
      };
    })
  );

  return results;
};

const getShopById = async (shopId) => {
  const shop = await Shop.findOne({ id: shopId }).lean();

  if (!shop) {
    const error = new Error("Shop not found");
    error.status = 404;
    throw error;
  }

  const template = await Template.findOne({ id: shop.templateId }).lean();
  const bridges = await TemplateExpenseBridge.find({
    templateId: shop.templateId,
  }).lean();
  const expenses = bridges.length
    ? await Expense.find({
        id: { $in: bridges.map((b) => b.expenseId) },
      }).lean()
    : [];

  return {
    ...cleanData(shop),
    template: cleanData(template),
    expenses: cleanData(expenses),
  };
};

const deleteShop = async (shopId) => {
  const deletedShop = await Shop.findOneAndDelete({ id: shopId });

  if (!deletedShop) {
    const error = new Error("Shop not found");
    error.status = 404;
    throw error;
  }

  if (deleteShop.templateId) {
    await Template.updateOne(
      { id: deleteShop.templateId },
      { $pop: { shopIds: newShop.id } }
    );
  }

  return deletedShop;
};

export { createShop, updateShop, getAllShops, getShopById, deleteShop };
