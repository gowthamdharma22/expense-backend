import { Router } from "express";
import * as expenseController from "../controllers/expense.controller.js";
import { admin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", expenseController.getAllExpenses);
router.get("/:id", expenseController.getExpenseById);
router.get("/template/:templateId", expenseController.getExpenseByTemplateId);
router.get("/shop/:shopId", expenseController.getExpenseByShopId);
router.post("/", expenseController.createNewExpense);
router.put("/:id", expenseController.updateExpense);
router.delete("/:id", admin, expenseController.deleteExpense);

export default router;
