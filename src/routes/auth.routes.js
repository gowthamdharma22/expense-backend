import { Router } from "express";
import {
  register,
  login,
  findAllUsers,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/", protect, findAllUsers);

export default router;
