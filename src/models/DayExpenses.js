import mongoose, { Schema, model } from "mongoose";
import mongooseSequence from "mongoose-sequence";

const autoIncrement = mongooseSequence(mongoose);

const dayExpenseSchema = new Schema(
  {
    id: { type: Number, unique: true },
    templateId: {
      type: Number,
      ref: "Template",
      required: true,
    },
    dayId: {
      type: Number,
      ref: "Day",
      required: true,
    },
    expenseId: {
      type: Number,
      ref: "Expense",
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

dayExpenseSchema.plugin(autoIncrement, {
  inc_field: "id",
  id: "day_expense_id_counter",
  start_seq: 1,
});

export default model("DayExpense", dayExpenseSchema);
