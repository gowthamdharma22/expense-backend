import express from "express";
import * as CreditUserController from "../controllers/creditDebitUser.controller.js";
import { admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", admin, CreditUserController.createUser);
router.get("/", CreditUserController.getAllUsers);
router.get("/:id", CreditUserController.getUserById);
router.put("/:id", admin, CreditUserController.updateUser);
router.delete("/:id", admin, CreditUserController.deleteUser);

export default router;
