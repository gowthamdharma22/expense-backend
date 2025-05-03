import mongoose, { Schema, model } from "mongoose";
import mongooseSequence from "mongoose-sequence";

const autoIncrement = mongooseSequence(mongoose);

const templateExpenseBridgeSchema = new Schema({
  id: { type: Number, unique: true },
  templateId: {
    type: Number,
    ref: "Template",
    required: true,
  },
  expenseId: {
    type: Number,
    ref: "Expense",
    required: true,
  },
  isDefault: { type: Boolean, default: false },
});

templateExpenseBridgeSchema.plugin(autoIncrement, {
  inc_field: "id",
  id: "template_expense_id_counter",
  start_seq: 1,
});

export default model("TemplateExpenseBridge", templateExpenseBridgeSchema);
