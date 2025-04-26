import { Router } from "express";
import { getExpenses } from "../controllers/expense.controller.js";

const router = Router();

router.get("/", getExpenses);

export default router;
