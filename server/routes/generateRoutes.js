import express from "express";
import multer from "multer";
import { generateHandler } from "../controllers/generateController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 5,
  },
});

router.post("/generate", upload.array("images", 5), generateHandler);

export default router;