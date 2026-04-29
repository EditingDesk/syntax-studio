import express from "express";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { createZipFromFolder } from "../services/zipService.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, "../outputs");
const ZIP_DIR = path.join(__dirname, "../zips");

router.get("/download-all/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: "Missing batchId",
      });
    }

    const batchFolder = path.join(OUTPUT_DIR, batchId);
    const zipPath = path.join(ZIP_DIR, `${batchId}.zip`);

    await fs.mkdir(ZIP_DIR, { recursive: true });

    await createZipFromFolder(batchFolder, zipPath);

    return res.download(zipPath, `${batchId}.zip`);
  } catch (error) {
    console.error("Download ZIP error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "ZIP download failed",
    });
  }
});

export default router;