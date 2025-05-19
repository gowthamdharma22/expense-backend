import { getAllActivities } from "../services/activity.service.js";

const getActivities = async (req, res, next) => {
  try {
    const activities = await getAllActivities();
    res.status(200).json(activities);
  } catch (err) {
    next(err);
  }
};

export { getActivities };
