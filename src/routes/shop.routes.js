import express from "express";
import {
  createShopController,
  updateShopController,
  getAllShopsController,
  getShopByIdController,
  deleteShopController,
} from "../controllers/shop.controller.js";

const router = express.Router();

router.get("/", getAllShopsController);
router.get("/:shopId", getShopByIdController);

router.post("/", createShopController);
router.put("/:shopId", updateShopController);
router.delete("/:shopId", deleteShopController);

export default router;
