// server/services/geminiService.js

import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY");
}

if (!process.env.GEMINI_IMAGE_MODEL) {
  throw new Error("Missing GEMINI_IMAGE_MODEL");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const DEFAULT_MODEL = process.env.GEMINI_IMAGE_MODEL;

const PRODUCT_PRESERVATION_PROMPT = `
CRITICAL PRODUCT PRESERVATION:
Use the uploaded product image as the only source of truth.
Do not recreate, redesign, reinterpret, beautify, simplify, or improve the product itself.
Never replace readable text with random letters or fake text.

Preserve exactly:
- logo
- brand text
- dial text
- numbers
- engravings
- hands
- subdials
- strap shape
- colors
- materials
- proportions
- texture
- reflections

If any logo, text, or small detail is unclear, keep it unchanged from the input.
Do not guess or invent missing details.

Only improve:
- background
- lighting
- centering
- dust cleanup
- stand removal
- camera reflections removal
- ecommerce presentation
`;

function getMimeType(filename = "") {
  const ext = filename.toLowerCase().split(".").pop();

  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function buildFinalPrompt(prompt) {
  return `
${PRODUCT_PRESERVATION_PROMPT}

USER TASK:
${prompt}

QUALITY CONTROL:
Final image must be premium ecommerce product photography.
Reject internally if logo, text, dial details, colors, proportions, strap shape, or product design are changed.
Do not hallucinate missing text or fake brand details.
Output only the final edited image.
`;
}

function extractAllImageBase64(response) {
  const images = [];
  const candidates = response?.candidates || [];

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        images.push(part.inlineData.data);
      }

      if (part.inline_data?.data) {
        images.push(part.inline_data.data);
      }
    }
  }

  return images;
}

function pickBestImage(buffers = []) {
  if (!buffers.length) {
    throw new Error("No image buffers to select from.");
  }

  return buffers.sort((a, b) => b.length - a.length)[0];
}

function isGoodEnough(buffer) {
  if (!buffer) return false;

  const MIN_SIZE_BYTES = 150 * 1024;
  return buffer.length >= MIN_SIZE_BYTES;
}

async function generateOnce({
  imageBuffer,
  prompt,
  filename,
  model,
  candidateCount = 1,
}) {
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: getMimeType(filename),
              data: imageBuffer.toString("base64"),
            },
          },
          {
            text: buildFinalPrompt(prompt),
          },
        ],
      },
    ],
    config: {
      temperature: 0.12,
      topP: 0.65,
      candidateCount,
      responseModalities: ["IMAGE"],
    },
  });

  const base64Images = extractAllImageBase64(response);

  if (!base64Images.length) {
    throw new Error("Gemini did not return an image output.");
  }

  const buffers = base64Images.map((img) => Buffer.from(img, "base64"));

  return pickBestImage(buffers);
}

export async function generateProductImage({
  imageBuffer,
  prompt,
  filename = "input.jpg",
  model = DEFAULT_MODEL,
}) {
  if (!imageBuffer) {
    throw new Error("Missing imageBuffer");
  }

  if (!prompt) {
    throw new Error("Missing prompt");
  }

  console.log("Using Gemini model:", model);

  const firstResult = await generateOnce({
    imageBuffer,
    prompt,
    filename,
    model,
    candidateCount: 1,
  });

  if (isGoodEnough(firstResult)) {
    console.log("Gemini quality check: passed first attempt");
    return firstResult;
  }

  console.log("Gemini quality check: retrying with 3 candidates");

  return await generateOnce({
    imageBuffer,
    prompt,
    filename,
    model,
    candidateCount: 3,
  });
}