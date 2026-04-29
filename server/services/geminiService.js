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

Do not:
- recreate the product
- redesign the product
- change logo, text, dial, numbers, engravings, hands, subdials
- change strap shape, color, material, proportions, or texture
- invent missing details
- add fake branding
- replace readable text with random text

Preserve exactly:
- product shape
- brand/logo/text
- colors and materials
- dial/details/engravings
- proportions
- original product identity

Only improve:
- background
- lighting
- centering
- dust cleanup
- ecommerce presentation
`;

const GEMINI_CONFIG = {
  temperature: 0.12,
  topP: 0.65,
  responseModalities: ["IMAGE"],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
  const message = String(error?.message || error || "");

  return (
    message.includes("429") ||
    message.includes("Too Many Requests") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("Quota exceeded") ||
    message.includes("503") ||
    message.includes("UNAVAILABLE")
  );
}

async function retryGeminiCall(fn, retries = 2) {
  try {
    return await fn();
  } catch (error) {
    if (!isRetryableError(error) || retries <= 0) {
      throw error;
    }

    const attempt = 3 - retries;
    const delayMs = attempt * 4000;

    console.log(`Gemini retryable error. Retrying in ${delayMs / 1000}s...`);

    await sleep(delayMs);

    return retryGeminiCall(fn, retries - 1);
  }
}

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
Final image must look like premium ecommerce product photography.
Keep the product design unchanged.
If a detail is unclear, preserve it from the input image instead of guessing.
Output only the final edited image.
`;
}

function extractImageBase64(response) {
  const candidates = response?.candidates || [];

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }

      if (part.inline_data?.data) {
        return part.inline_data.data;
      }
    }
  }

  return null;
}

function validateImageBuffer(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid Gemini image buffer");
  }

  if (buffer.length < 20 * 1024) {
    console.warn("Gemini output is unusually small. Keeping result but flagging quality.");
  }

  return buffer;
}

export async function generateProductImage({
  imageBuffer,
  prompt,
  filename = "input.jpg",
  model = DEFAULT_MODEL,
}) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    throw new Error("Missing or invalid imageBuffer");
  }

  if (!prompt || typeof prompt !== "string") {
    throw new Error("Missing or invalid prompt");
  }

  console.log("Using Gemini model:", model);

  const response = await retryGeminiCall(() =>
    ai.models.generateContent({
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
      config: GEMINI_CONFIG,
    })
  );

  const base64Image = extractImageBase64(response);

  if (!base64Image) {
    throw new Error("Gemini did not return an image output.");
  }

  const outputBuffer = Buffer.from(base64Image, "base64");

  return validateImageBuffer(outputBuffer);
}