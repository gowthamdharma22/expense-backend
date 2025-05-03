import mongoose, { Schema, model } from "mongoose";
import mongooseSequence from "mongoose-sequence";

const autoIncrement = mongooseSequence(mongoose);

const daySchema = new Schema({
  id: { type: Number, unique: true },
  date: { type: Date, required: true, unique: true },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  isFrozen: { type: Boolean, default: false },
});

daySchema.plugin(autoIncrement, {
  inc_field: "id",
  id: "day_id_counter",
  start_seq: 1,
});

export default model("Day", daySchema);
