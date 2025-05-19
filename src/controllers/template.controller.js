import logger from "../utils/logger.js";
import * as Activity from "../services/activity.service.js";
import * as templateService from "../services/template.service.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";

const createTemplate = async (req, res) => {
  try {
    const result = await templateService.createTemplate(req.body);

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Created template (${result.name || "new"})`
    );

    sendSuccess(res, result, "Template created successfully", 201);
  } catch (err) {
    logger.error(`[template.controller.js] [createTemplate] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Create failed",
      err.status || 500
    );
  }
};

const updateTemplate = async (req, res) => {
  try {
    const result = await templateService.updateTemplate(
      req.params.id,
      req.body
    );

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Updated template (${result.name})`
    );

    sendSuccess(res, result, "Template updated", 200);
  } catch (err) {
    logger.error(`[template.controller.js] [updateTemplate] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Update failed",
      err.status || 500
    );
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const result = await templateService.deleteTemplate(req.params.id);

    Activity.Logger(
      { email: req.user?.email, role: req.user?.role },
      `Deleted template (${result.name})`
    );

    sendSuccess(res, result, "Template deleted", 200);
  } catch (err) {
    logger.error(`[template.controller.js] [deleteTemplate] - ${err.message}`);
    sendError(
      res,
      { message: err.message },
      "Delete failed",
      err.status || 500
    );
  }
};

const getTemplateById = async (req, res) => {
  try {
    const result = await templateService.getTemplateDetails(req.params.id);
    sendSuccess(res, result, "Template fetched successfully", 200);
  } catch (err) {
    logger.error(`[template.controller.js] [getTemplateById] - ${err.message}`);
    sendError(res, { message: err.message }, "Fetch failed", err.status || 500);
  }
};

const getAllTemplates = async (req, res) => {
  try {
    const result = await templateService.getAllTemplates();
    sendSuccess(res, result, "Templates fetched successfully", 200);
  } catch (err) {
    logger.error(`[template.controller.js] [getAllTemplates] - ${err.message}`);
    sendError(res, { message: err.message }, "Fetch failed", err.status || 500);
  }
};

export {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateById,
  getAllTemplates,
};
