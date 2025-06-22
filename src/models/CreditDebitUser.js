import mongoose, { Schema, model } from "mongoose";
import mongooseSequence from "mongoose-sequence";

const autoIncrement = mongooseSequence(mongoose);

const creditDebitUserSchema = new Schema(
  {
    id: { type: Number, unique: true },
    name: {
      type: String,
      required: true,
      unique: true,
      set: (v) => v.toUpperCase(),
    },
    phone: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "creditDebitUsers",
  }
);

creditDebitUserSchema.plugin(autoIncrement, {
  inc_field: "id",
  id: "credit_debit_user_id_counter",
  start_seq: 1,
});

export default model("CreditDebitUser", creditDebitUserSchema);
