import mongoose, { Schema, model } from "mongoose";
import mongooseSequence from "mongoose-sequence";

const autoIncrement = mongooseSequence(mongoose);

const templateSchema = new Schema(
  {
    id: { type: Number, unique: true },
    name: { type: String, required: true },
    shopIds: [{ type: Number, ref: "Shop" }]
  },
  { timestamps: true }
);

templateSchema.plugin(autoIncrement, {
  inc_field: "id",
  id: "template_id_counter",
  start_seq: 1,
});

export default model("Template", templateSchema);
