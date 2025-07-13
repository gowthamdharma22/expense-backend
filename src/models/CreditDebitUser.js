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

creditDebitUserSchema.statics.ensureAdmin = async function () {
  const exists = await this.findOne({ name:"ADMIN" });
  if (!exists) {
    await this.create({
      name: "ADMIN",
      phone: "0000000000",
    });
    console.log("[creditDebitUser.model.js] Default admin user created.");
  }
};

const CreditDebitUser = model("CreditDebitUser", creditDebitUserSchema);

CreditDebitUser.ensureAdmin().catch((err) => {
  console.error(
    "[creditDebitUser.model.js] Failed to create default admin:",
    err.message
  );
});

export default CreditDebitUser;
