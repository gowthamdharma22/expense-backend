import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { admin, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/", protect, authController.findAllUsers);
router.put("/:id", protect, admin, authController.updateUser);
router.delete("/:id", protect, admin, authController.deleteUser);

export default router;
