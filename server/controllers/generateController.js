// server/controllers/generateController.js
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { generateProductImage } from "../services/geminiService.js";
import { processGeminiBufferToJpg } from "../services/imageProcessing.js";
import { removeImageBackground } from "../services/backgroundRemoval.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, "../outputs");

function cleanFileName(name = "image") {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getShotName(file, index) {
  const original = cleanFileName(file.originalname).toLowerCase();

  if (original.includes("front")) return "front";
  if (original.includes("angle")) return "angle";
  if (original.includes("side")) return "side";
  if (original.includes("back")) return "back";
  if (original.includes("box")) return "box";

  return `shot_${index + 1}`;
}

function getOutputSize(size = "") {
  const normalized = String(size).toLowerCase().replace(/\s/g, "");

  if (normalized.includes("1600x1600")) {
    return { width: 1600, height: 1600 };
  }

  if (normalized.includes("2000x2000")) {
    return { width: 2000, height: 2000 };
  }

  if (normalized.includes("1644x2464")) {
    return { width: 1644, height: 2464 };
  }

  return { width: 1644, height: 2464 };
}

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;

  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizePrompts(value) {
  const parsed = parseJsonField(value, []);

  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === "string" && parsed.trim()) return [parsed];

  return [];
}

function getBackgroundHex(background = "lightgray") {
  const value = String(background).toLowerCase();

  if (value === "white") return "#FFFFFF";
  return "#F1F1F1";
}

export async function generateHandler(req, res) {
  try {
    console.log("Incoming body:", req.body);
    console.log("Incoming files:", req.files?.length || 0);

    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    if (files.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 watch images allowed",
      });
    }

    const prompts = normalizePrompts(req.body.prompts);
    const processing = parseJsonField(req.body.processing, {}) || {};

    const outputSize = getOutputSize(req.body.size || "1644x2464");
    const bgHex = getBackgroundHex(req.body.background);

    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const batchId = `watch_${Date.now()}`;
    const batchDir = path.join(OUTPUT_DIR, batchId);

    await fs.mkdir(batchDir, { recursive: true });

    const results = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const shotName = getShotName(file, i);
      const baseName = cleanFileName(file.originalname) || `image_${i + 1}`;

      console.log(`Generating ${shotName} for ${file.originalname}`);

      const filePrompt =
        prompts[i] ||
        req.body.prompt ||
        "Create a clean premium ecommerce product image. Preserve the product exactly.";

      const geminiResult = await generateProductImage({
        imageBuffer: file.buffer,
        prompt: filePrompt,
        filename: file.originalname,
      });

      if (!geminiResult || !Buffer.isBuffer(geminiResult)) {
        throw new Error(
          `Gemini did not return valid image buffer for ${file.originalname}`
        );
      }

      let imageForProcessing = geminiResult;

      if (processing.removeBg === true) {
        console.log("Removing background for:", file.originalname);
        imageForProcessing = await removeImageBackground(geminiResult);
      }

      const outputFileName = `${baseName}_${shotName}_final.jpg`;
      const outputPath = path.join(batchDir, outputFileName);

      await processGeminiBufferToJpg(imageForProcessing, outputPath, {
        width: outputSize.width,
        height: outputSize.height,
        marginTopBottom: 0,
        background: bgHex,
        quality: 95,
        sharpen: processing.sharpen === true,
        enhance: processing.enhance === true,
      });

      results.push({
        id: `${batchId}_${i}`,
        shot: shotName,
        originalName: file.originalname,
        fileName: outputFileName,
        url: `/outputs/${batchId}/${outputFileName}`,
        width: outputSize.width,
        height: outputSize.height,
        format: "jpg",
      });
    }

    return res.status(200).json({
      success: true,
      batchId,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Generate error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Generation failed",
    });
  }
}
