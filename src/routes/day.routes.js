import express from "express";
import * as dayController from "../controllers/day.controller.js";

const router = express.Router();

router.get("/", dayController.getAllDays);
router.get("/date/:date", dayController.getDayByDate); // format needs to be ->  YYYY-MM-DD || YYYY-MM || YYYY
router.get("/activeMonths", dayController.getActiveMonths);
router.get("/:id", dayController.getDayById);
router.get("/summary/:month", dayController.getMonthExpenseSummary);

router.post("/", dayController.createDay);
router.put("/:id", dayController.updateDay);
router.delete("/:id", dayController.deleteDay);
router.delete("/date/:date", dayController.deleteDayByDate); // format needs to be ->  YYYY-MM-DD || YYYY-MM || YYYY

router.patch("/:id/disableFreeze", dayController.toggleIgnoreFrozenCheck);

export default router;
