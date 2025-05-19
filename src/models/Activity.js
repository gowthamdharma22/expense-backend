import { Schema, model } from "mongoose";

const activitySchema = new Schema(
  {
    email: String,
    role: String,
    action: String,
  },
  { timestamps: true }
);

export default model("Activity", activitySchema);
