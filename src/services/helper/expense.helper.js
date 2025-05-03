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
    templateExpenseBridge.isDefault =
      data.isDefault || templateExpenseBridge.isDefault;
    templateExpenseBridge.templateId =
      data.templateId || templateExpenseBridge.templateId;

    if (data.isDefault) {
      await TemplateExpenseBridge.updateMany(
        { templateId: data.templateId, isDefault: true },
        { isDefault: false }
      );
    }

    await templateExpenseBridge.save();
  }
};

export { createTemplateExpenseBridge, updateTemplateExpenseBridge };
