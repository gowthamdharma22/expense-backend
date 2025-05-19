import Activity from "../models/Activity.js";

const Logger = (user, action) => {
  return Activity.create({
    username: user.username,
    email: user.email,
    role: user.role,
    action,
  }).catch((err) => {
    console.error("[Activity Logger] Failed:", err.message);
  });
};

const getAllActivities = async () => {
  return Activity.find().sort({ createdAt: -1 });
};

export { Logger, getAllActivities };
