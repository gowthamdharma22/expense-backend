import mongoose, { Schema, model } from "mongoose";
import mongooseSequence from "mongoose-sequence";

const autoIncrement = mongooseSequence(mongoose);

const shopSchema = new Schema(
  {
    id: { type: Number, unique: true },
    name: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    templateId: { type: Number, ref: "Template", required: true },
  },
  { timestamps: true }
);

shopSchema.plugin(autoIncrement, {
  inc_field: "id",
  id: "shop_id_counter",
  start_seq: 1,
});

export default model("Shop", shopSchema);
