import express from "express";
import multer from "multer";
import { generateHandler } from "../controllers/generateController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 25,
  },
});

router.post("/", upload.array("images", 25), generateHandler);

export default router;