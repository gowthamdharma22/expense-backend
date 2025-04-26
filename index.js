import cors from "cors";
import dotenv from "dotenv";
import express, { json } from "express";

import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import expenseRoutes from "./src/routes/expense.routes.js";
import { protect } from "./src/middlewares/authMiddleware.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(json());

app.get("/", (_, res) => res.send("Hello from Expense Tracker API"));
app.use("/api/auth", authRoutes);
app.use("/api/expense", protect, expenseRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is up and running on port ${PORT}`);
  });
});
