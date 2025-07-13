import express from "express";
import * as shopController from "../controllers/shop.controller.js";
import { admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", shopController.getAllShopsController);
router.get("/:shopId", shopController.getShopByIdController);

router.post("/", admin, shopController.createShopController);
router.put("/:shopId", admin, shopController.updateShopController);
router.delete("/:shopId", admin, shopController.deleteShopController);

export default router;
