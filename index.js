import cors from "cors";
import dotenv from "dotenv";
import express, { json } from "express";
import connectDB from "./src/config/db.js";
import shopRoutes from "./src/routes/shop.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import expenseRoutes from "./src/routes/expense.routes.js";
import templateRoutes from "./src/routes/template.routes.js";
import { admin, protect } from "./src/middlewares/authMiddleware.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(json());

app.get("/api", (_, res) => res.send("Hello from Expense Tracker API"));
app.use("/api/auth", authRoutes);
app.use("/api/expense", protect, admin, expenseRoutes);
app.use("/api/template", protect, admin, templateRoutes);
app.use("/api/shop", protect, admin, shopRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is up and running on port ${PORT}`);
  });
});
