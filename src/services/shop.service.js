import Shop from "../models/Shop.js";
import Expense from "../models/Expense.js";
import Template from "../models/Template.js";
import { cleanData } from "../utils/responseHandler.js";
import TemplateExpenseBridge from "../models/TemplateExpenseBridge.js";

const VALID_SHOP_TYPES = ["wholesale", "retail"];

const createShop = async (name, userId, templateId, shopType) => {
  if (!VALID_SHOP_TYPES.includes(shopType)) {
    const error = new Error(
      "Invalid shopType. Must be 'wholesale' or 'retail'"
    );
    error.status = 400;
    throw error;
  }

  const newShop = new Shop({
    name,
    owner: userId,
    templateId,
    shopType,
  });

  await newShop.save();

  if (templateId) {
    await Template.updateOne(
      { id: templateId },
      { $addToSet: { shopIds: newShop.id } } // ensure no duplicates
    );
  }

  return cleanData(newShop.toObject());
};

const updateShop = async (shopId, data) => {
  if (data.shopType && !VALID_SHOP_TYPES.includes(data.shopType)) {
    const error = new Error(
      "Invalid shopType. Must be 'wholesale' or 'retail'"
    );
    error.status = 400;
    throw error;
  }

  const existingShop = await Shop.findOne({ id: shopId });
  if (!existingShop) {
    const error = new Error("Shop not found");
    error.status = 404;
    throw error;
  }

  const oldTemplateId = existingShop.templateId;
  const newTemplateId = data.templateId;

  const updatedShop = await Shop.findOneAndUpdate(
    { id: shopId },
    { ...data },
    { new: true }
  );

  if (newTemplateId && newTemplateId !== oldTemplateId) {
    if (oldTemplateId) {
      await Template.updateOne(
        { id: oldTemplateId },
        { $pull: { shopIds: shopId } }
      );
    }

    await Template.updateOne(
      { id: newTemplateId },
      { $addToSet: { shopIds: shopId } }
    );
  }

  return cleanData(updatedShop.toObject());
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

  if (deletedShop.templateId) {
    await Template.updateOne(
      { id: deletedShop.templateId },
      { $pull: { shopIds: deletedShop.id } }
    );
  }

  return cleanData(deletedShop.toObject());
};

export { createShop, updateShop, getAllShops, getShopById, deleteShop };
