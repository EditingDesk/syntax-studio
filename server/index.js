import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import sharp from "sharp";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const shotOrder = ["front", "angle", "side", "back", "box"];

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
    .map((part, index) => ({
      index,
      mimeType: part.inlineData.mimeType || "image/png",
      base64: part.inlineData.data,
    }));
}

function hexToRgbObject(hex) {
  const clean = String(hex || "#f1f1f1").replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const safe = /^[0-9a-fA-F]{6}$/.test(normalized) ? normalized : "f1f1f1";

  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16),
    alpha: 1,
  };
}

function getSharpFitMode(mode) {
  const allowed = ["contain", "cover", "fill", "inside", "outside"];
  return allowed.includes(mode) ? mode : "contain";
}

function getSharpGravity(gravity) {
  const allowed = [
    "center",
    "north",
    "south",
    "east",
    "west",
    "northeast",
    "northwest",
    "southeast",
    "southwest",
  ];
  return allowed.includes(gravity) ? gravity : "center";
}

function getSharpenOptions(level) {
  switch (level) {
    case "light":
      return { sigma: 1, m1: 1, m2: 2 };
    case "medium":
      return { sigma: 1.5, m1: 1.5, m2: 3 };
    case "strong":
      return { sigma: 2, m1: 2, m2: 4 };
    default:
      return null;
  }
}

async function postProcessImage(image, processing = {}) {
  const outputWidth = Number(processing.outputWidth) || 1644;
  const outputHeight = Number(processing.outputHeight) || 2464;
  const fitMode = getSharpFitMode(processing.fitMode);
  const gravity = getSharpGravity(processing.gravity);
  const background = hexToRgbObject(processing.backgroundColor);
  const sharpenOptions = getSharpenOptions(processing.sharpen);
  const upscaleEnabled = Boolean(processing.upscaleEnabled);

  let pipeline = sharp(Buffer.from(image.base64, "base64"))
    .rotate()
    .resize({
      width: outputWidth,
      height: outputHeight,
      fit: fitMode,
      position: gravity,
      background,
      withoutEnlargement: !upscaleEnabled,
    });

  if (sharpenOptions) {
    pipeline = pipeline.sharpen(
      sharpenOptions.sigma,
      sharpenOptions.m1,
      sharpenOptions.m2
    );
  }

  const outputBuffer = await pipeline.png().toBuffer();

  return {
    mimeType: "image/png",
    base64: outputBuffer.toString("base64"),
  };
}

async function generateCandidates({
  model,
  prompt,
  file,
  candidateCount,
  processing,
}) {
  const candidates = [];

  for (let i = 0; i < candidateCount; i++) {
    console.log(`  Candidate ${i + 1}/${candidateCount}`);

    const response = await ai.models.generateContent({
      model,
      contents: [{ text: prompt }, toInlinePart(file)],
    });

    const images = collectImagesFromResponse(response);

    if (!images.length) {
      throw new Error("Gemini returned no image output");
    }

    const processedImage = await postProcessImage(images[0], processing);

    candidates.push({
      score: 100 - i,
      image: processedImage,
    });
  }

  return candidates;
}

app.get("/", (_req, res) => {
  res.send("Syntax Studio server running");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

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
      console.log("Request received");
      console.log("Barcode:", req.body.barcode);
      console.log("Model:", req.body.model);
      console.log("Files:", Object.keys(req.files || {}));

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

        console.log("Generating shot:", shot);

        const prompt = prompts?.[shot];
        if (!prompt) {
          throw new Error(`Missing prompt for shot: ${shot}`);
        }

        const generated = await generateCandidates({
          model,
          prompt,
          file,
          candidateCount,
          processing,
        });

        console.log("Finished shot:", shot);

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
    } catch (error) {
      console.error("Generate watch job error:", error);

      return res.status(500).json({
        ok: false,
        error: error.message || "Generation failed",
      });
    }
  }
);

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});