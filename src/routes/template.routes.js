import { Router } from "express";
import * as templateController from "../controllers/template.controller.js";

const router = Router();

router.get("/", templateController.getAllTemplates);
router.get("/:id", templateController.getTemplateById);

router.post("/", templateController.createTemplate);
router.put("/:id", templateController.updateTemplate);
router.delete("/:id", templateController.deleteTemplate);

export default router;
