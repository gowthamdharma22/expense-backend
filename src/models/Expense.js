import mongoose, { Schema, model } from "mongoose";
import mongooseSequence from "mongoose-sequence";

const autoIncrement = mongooseSequence(mongoose);

const expenseSchema = new Schema(
  {
    id: { type: Number, unique: true },
    name: { type: String, required: true },
    description: { type: String },
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

expenseSchema.statics.ensureDefaults = async function () {
  const defaults = [
    { name: "Credit", description: "Default credit expense", type: "credit" },
    { name: "Debit", description: "Default debit expense", type: "debit" },
  ];

  for (const def of defaults) {
    const exists = await this.findOne({ name: def.name });
    if (!exists) {
      await this.create(def);
    }
  }
};

const Expense = model("Expense", expenseSchema);

Expense.ensureDefaults().catch((err) => {
  console.error(
    "[expense.model.js] Failed to create default expenses:",
    err.message
  );
});

export default Expense;
