import { Router } from "express";
import * as expenseController from "../controllers/expense.controller.js";

const router = Router();

router.get("/", expenseController.getAllExpenses);
router.get("/:id", expenseController.getExpenseById);
router.get("/template/:templateId", expenseController.getExpenseByTemplateId);

router.post("/", expenseController.createNewExpense);
router.put("/:id", expenseController.updateExpense);
router.delete("/:id", expenseController.deleteExpense);

export default router;
