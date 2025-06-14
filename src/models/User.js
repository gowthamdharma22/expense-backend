import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import mongooseSequence from "mongoose-sequence";

const autoIncrement = mongooseSequence(mongoose);

const { Schema } = mongoose;

const ROLES = ["admin", "employee"];

const userSchema = new Schema(
  {
    id: { type: Number, unique: true },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "employee",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(autoIncrement, {
  inc_field: "id",
  id: "user_id_counter",
  start_seq: 1,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.statics.ensureDefaultAdmin = async function () {
  const existing = await this.findOne({ email: "admin@xyz.com" });
  if (!existing) {
    const user = new this({
      name: "Admin",
      email: "admin@xyz.com",
      password: "supersecure123",
      role: "admin",
    });
    await user.save();
    console.log("[user.model.js] Default Admin created.");
  }
};

const User = mongoose.model("User", userSchema);

// Auto-create default admin
User.ensureDefaultAdmin().catch((err) => {
  console.error(
    "[user.model.js] Failed to create default super admin:",
    err.message
  );
});

export default User;
