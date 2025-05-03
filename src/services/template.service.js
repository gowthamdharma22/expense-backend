import Template from "../models/Template.js";
import Shop from "../models/Shop.js";
import Expense from "../models/Expense.js";
import TemplateExpenseBridge from "../models/TemplateExpenseBridge.js";
import logger from "../utils/logger.js";
import { filterEditableFields } from "./helper/template.helper.js";
import { cleanData } from "../utils/responseHandler.js";

const createTemplate = async (data) => {
  try {
    const template = new Template(data);
    const saved = await template.save();
    logger.info(
      `[template.service.js] [createTemplate] - Template created: ${saved.id}`
    );
    return saved;
  } catch (err) {
    logger.error(
      `[template.service.js] [createTemplate] - Error: ${err.message}`
    );
    throw new Error("Error creating template: " + err.message);
  }
};

const updateTemplate = async (id, data) => {
  try {
    if ("shopIds" in data) {
      const err = new Error("Cannot modify shopIds directly");
      err.status = 400;
      throw err;
    }

    const allowedFields = filterEditableFields(data);
    const updated = await Template.findOneAndUpdate({ id }, allowedFields, {
      new: true,
    });

    if (!updated) {
      const err = new Error("Template not found");
      err.status = 404;
      throw err;
    }

    logger.info(
      `[template.service.js] [updateTemplate] - Template updated: ${updated.id}`
    );
    return updated;
  } catch (err) {
    logger.error(
      `[template.service.js] [updateTemplate] - Error: ${err.message}`
    );
    throw err;
  }
};

const deleteTemplate = async (id) => {
  try {
    const linkedShops = await Shop.exists({ templateId: id });
    if (linkedShops) {
      const err = new Error("Cannot delete template linked to shops");
      err.status = 400;
      throw err;
    }

    const deleted = await Template.findOneAndDelete({ id });
    if (!deleted) {
      const err = new Error("Template not found");
      err.status = 404;
      throw err;
    }

    await TemplateExpenseBridge.deleteMany({
      templateId: id,
    });

    logger.info(
      `[template.service.js] [deleteTemplate] - Template deleted: ${id}`
    );
    return { message: "Template deleted" };
  } catch (err) {
    logger.error(
      `[template.service.js] [deleteTemplate] - Error: ${err.message}`
    );
    throw err;
  }
};

const getTemplateDetails = async (id) => {
  try {
    const template = await Template.findOne({ id });
    if (!template) {
      const err = new Error("Template not found");
      err.status = 404;
      throw err;
    }

    const [shops, expenses] = await Promise.all([
      Shop.find({ templateId: id }).lean(),
      Expense.find({ templateId: id }).lean(),
    ]);

    logger.info(
      `[template.service.js] [getTemplateDetails] - Template details fetched: ${id}`
    );
    return {
      ...cleanData(template.toObject()),
      shops: cleanData(shops),
      expenses: cleanData(expenses),
    };
  } catch (err) {
    logger.error(
      `[template.service.js] [getTemplateDetails] - Error: ${err.message}`
    );
    throw err;
  }
};

const getAllTemplates = async () => {
  try {
    const templates = await Template.find();

    const results = await Promise.all(
      templates.map(async (template) => {
        const shops = await Shop.find({
          id: { $in: template.shopIds },
        }).lean();

        const bridges = await TemplateExpenseBridge.find({
          templateId: template.id,
        });

        const expenseIds = bridges.map((b) => b.expenseId);
        const expenses = await Expense.find({ id: { $in: expenseIds } }).lean();

        return {
          ...cleanData(template.toObject()),
          shops: cleanData(shops),
          expenses: cleanData(expenses),
        };
      })
    );

    logger.info(
      "[template.service.js] [getAllTemplates] - All templates fetched"
    );
    return results;
  } catch (err) {
    logger.error(
      `[template.service.js] [getAllTemplates] - Error: ${err.message}`
    );
    throw err;
  }
};

export {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateDetails,
  getAllTemplates,
};
