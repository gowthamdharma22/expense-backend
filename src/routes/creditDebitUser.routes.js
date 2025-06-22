import express from "express";
import * as CreditUserController from "../controllers/creditDebitUser.controller.js";

const router = express.Router();

router.post("/", CreditUserController.createUser);
router.get("/", CreditUserController.getAllUsers);
router.get("/:id", CreditUserController.getUserById);
router.put("/:id", CreditUserController.updateUser);
router.delete("/:id", CreditUserController.deleteUser);

export default router;
