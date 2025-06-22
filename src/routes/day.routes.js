import express from "express";
import * as dayController from "../controllers/day.controller.js";

const router = express.Router();

router.get("/", dayController.getAllDays);
router.get("/date/:date", dayController.getDayByDate); // format needs to be ->  YYYY-MM-DD || YYYY-MM || YYYY
router.get("/:id", dayController.getDayById);

router.post("/", dayController.createDay);
router.put("/:id", dayController.updateDay);
router.delete("/:id", dayController.deleteDay);
router.delete("/date/:date", dayController.deleteDay); // format needs to be ->  YYYY-MM-DD || YYYY-MM || YYYY

export default router;
