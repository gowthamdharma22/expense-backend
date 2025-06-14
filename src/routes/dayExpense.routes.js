import express from "express";
import * as dayExpenseController from "../controllers/dayExpense.controller.js";

const router = express.Router();

router.get("/", dayExpenseController.getAllDayExpenses);
router.get("/:date", dayExpenseController.getDayExpenseByDate);

router.post("/", dayExpenseController.createDayExpense);
router.put("/:id", dayExpenseController.updateDayExpense);
router.delete("/:id", dayExpenseController.deleteDayExpense);

router.put("/:id/verify", dayExpenseController.verifyDayExpense);

export default router;
