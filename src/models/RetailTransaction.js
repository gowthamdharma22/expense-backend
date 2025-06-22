import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

const { Schema } = mongoose;
const autoIncrement = mongooseSequence(mongoose);

const retailTransactionSchema = new Schema(
  {
    id: { type: Number, unique: true },
    shopId: { type: Number, required: true, ref: "Shop" },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    description: { type: String },
    dayExpenseId: { type: Number, ref: "DayExpense", default: 0 },
    userId: { type: Number, ref: "CreditDebitUser", required: true },
    isAdjustment: { type: Boolean, default: false },
  },
  { timestamps: true }
);

retailTransactionSchema.plugin(autoIncrement, {
  inc_field: "id",
  id: "retail_id_counter",
  start_seq: 1,
});

export default mongoose.model("RetailTransaction", retailTransactionSchema);
