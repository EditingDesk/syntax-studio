import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
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

async function generateCandidates({ model, prompt, file, candidateCount }) {
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

    candidates.push({
      score: 100 - i,
      image: images[0],
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