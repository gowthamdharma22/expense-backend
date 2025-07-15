import cors from "cors";
import dotenv from "dotenv";
import express, { json } from "express";
import connectDB from "./src/config/db.js";
import dayRoutes from "./src/routes/day.routes.js";
import shopRoutes from "./src/routes/shop.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import activityRoute from "./src/routes/activity.routes.js";
import expenseRoutes from "./src/routes/expense.routes.js";
import templateRoutes from "./src/routes/template.routes.js";
import dayExpenseRoutes from "./src/routes/dayExpense.routes.js";
import transactionRoutes from "./src/routes/transaction.routes.js";
import creditDebitUserRoutes from "./src/routes/creditDebitUser.routes.js";
import { admin, protect } from "./src/middlewares/authMiddleware.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [process.env.FE_URL],
    credentials: true,
  })
);
app.use(json());

app.get("/api", (_, res) => res.send("Hello from Expense Tracker API"));
app.use("/api/auth", authRoutes);
app.use("/api/expense", protect, expenseRoutes);
app.use("/api/template", protect, admin, templateRoutes);
app.use("/api/shop", protect, shopRoutes);
app.use("/api/day", protect, dayRoutes);
app.use("/api/day-expense", protect, dayExpenseRoutes);
app.use("/api/activity", protect, activityRoute);
app.use("/api/transaction", protect, transactionRoutes);
app.use("/api/notes/user", protect, creditDebitUserRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is up and running on port ${PORT}`);
  });
});
