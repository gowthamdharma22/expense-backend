import mongoose, { Schema, model } from "mongoose";
import mongooseSequence from "mongoose-sequence";

const autoIncrement = mongooseSequence(mongoose);

const expenseSchema = new Schema(
  {
    id: { type: Number, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["credit", "debit", "credit/debit"],
      required: true,
    },
  },
  { timestamps: true }
);

expenseSchema.plugin(autoIncrement, {
  inc_field: "id",
  id: "expense_id_counter",
  start_seq: 1,
});

export default model("Expense", expenseSchema);
