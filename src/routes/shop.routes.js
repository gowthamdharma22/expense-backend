import express from "express";
import * as shopController from "../controllers/shop.controller.js";

const router = express.Router();

router.get("/", shopController.getAllShopsController);
router.get("/:shopId", shopController.getShopByIdController);

router.post("/", shopController.createShopController);
router.put("/:shopId", shopController.updateShopController);
router.delete("/:shopId", shopController.deleteShopController);

export default router;
