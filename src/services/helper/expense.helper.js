import TemplateExpenseBridge from "../../models/TemplateExpenseBridge.js";

const createTemplateExpenseBridge = async (
  expenseId,
  templateId,
  isDefault
) => {
  const existingMapping = await TemplateExpenseBridge.findOne({
    templateId,
    expenseId,
  });

  if (!existingMapping) {
    const templateExpenseBridge = new TemplateExpenseBridge({
      templateId,
      expenseId,
      isDefault,
    });

    await templateExpenseBridge.save();
  }
};

const updateTemplateExpenseBridge = async (expenseId, data) => {
  const templateExpenseBridge = await TemplateExpenseBridge.findOne({
    expenseId,
  });

  if (templateExpenseBridge) {
    if (typeof data.isDefault === "boolean") {
      templateExpenseBridge.isDefault = data.isDefault;
    }

    if (data.templateId) {
      templateExpenseBridge.templateId = data.templateId;
    }

    await templateExpenseBridge.save();
  }
};

export { createTemplateExpenseBridge, updateTemplateExpenseBridge };
