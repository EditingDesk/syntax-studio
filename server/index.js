import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import sharp from "sharp";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

// ===== Multer (memory upload) =====
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ===== Gemini setup =====
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ===== Shot order =====
const shotOrder = ["front", "angle", "side", "back", "box"];

// ===== Helpers =====
function toInlinePart(file) {
  return {
    inlineData: {
      mimeType: file.mimetype || "image/jpeg",
      data: file.buffer.toString("base64"),
    },
  };
}

function collectImagesFromResponse(response) {
  const parts = response?.candidates?.[0]?.content?.parts || [];

  return parts
    .filter((part) => part.inlineData?.data)
    .map((part) => ({
      mimeType: part.inlineData.mimeType || "image/png",
      base64: part.inlineData.data,
    }));
}

function hexToRgbObject(hex) {
  const clean = (hex || "#f1f1f1").replace("#", "");
  const safe = clean.length === 6 ? clean : "f1f1f1";

  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16),
    alpha: 1,
  };
}

// ===== Post-processing =====
async function processImage(image, processing = {}) {
  const width = Number(processing.outputWidth) || 1644;
  const height = Number(processing.outputHeight) || 2464;
  const fit = processing.fitMode || "contain";
  const position = processing.gravity || "center";
  const background = hexToRgbObject(processing.backgroundColor);
  const upscaleEnabled = Boolean(processing.upscaleEnabled);

  let pipeline = sharp(Buffer.from(image.base64, "base64"))
    .rotate()
    .resize({
      width,
      height,
      fit,
      position,
      background,
      withoutEnlargement: !upscaleEnabled,
    });

  if (processing.sharpen === "light") {
    pipeline = pipeline.sharpen(1);
  } else if (processing.sharpen === "medium") {
    pipeline = pipeline.sharpen(1.5);
  } else if (processing.sharpen === "strong") {
    pipeline = pipeline.sharpen(2);
  }

  const buffer = await pipeline.png().toBuffer();

  return {
    mimeType: "image/png",
    base64: buffer.toString("base64"),
  };
}

// ===== Generate one shot =====
async function generateCandidates({
  model,
  prompt,
  file,
  candidateCount,
  processing,
}) {
  const results = [];

  for (let i = 0; i < candidateCount; i++) {
    console.log(`Candidate ${i + 1}/${candidateCount}`);

    const response = await ai.models.generateContent({
      model,
      contents: [{ text: prompt }, toInlinePart(file)],
    });

    const images = collectImagesFromResponse(response);

    if (!images.length) {
      throw new Error("No image returned from Gemini");
    }

    const processed = await processImage(images[0], processing);

    results.push({
      score: 100 - i,
      image: processed,
    });
  }

  return results;
}

// ===== Health =====
app.get("/", (_req, res) => {
  res.send("Syntax Studio server running");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// ===== Main API =====
app.post(
  "/api/generate-watch-job",
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "angle", maxCount: 1 },
    { name: "side", maxCount: 1 },
    { name: "back", maxCount: 1 },
    { name: "box", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const barcode = req.body.barcode || "";
      const model = req.body.model || "gemini-3.1-flash-image-preview";
      const candidateCount = Math.max(
        1,
        Math.min(3, Number(req.body.candidateCount || 1))
      );

      const prompts = JSON.parse(req.body.prompts || "{}");
      const processing = JSON.parse(req.body.processing || "{}");
      const files = req.files || {};

      const results = {};

      for (const shot of shotOrder) {
        const file = files?.[shot]?.[0];
        if (!file) continue;

        console.log("Generating:", shot);

        const prompt = prompts?.[shot];
        if (!prompt) {
          throw new Error(`Missing prompt for ${shot}`);
        }

        const generated = await generateCandidates({
          model,
          prompt,
          file,
          candidateCount,
          processing,
        });

        results[shot] = {
          bestIndex: 0,
          candidates: generated,
        };
      }

      return res.json({
        ok: true,
        barcode,
        results,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        ok: false,
        error: err.message,
      });
    }
  }
);

// ===== Start server =====
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});