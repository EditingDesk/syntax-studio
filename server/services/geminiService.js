// Gemini Service
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY");
}

if (!process.env.GEMINI_IMAGE_MODEL) {
  throw new Error("Missing GEMINI_IMAGE_MODEL");
}

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

function extractImageBase64(response) {
  const parts = response?.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData?.data) return part.inlineData.data;
    if (part.inline_data?.data) return part.inline_data.data;
  }

  throw new Error("Gemini did not return an image output.");
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

  const finalPrompt = `
${PRODUCT_PRESERVATION_PROMPT}

USER TASK:
${prompt}

QUALITY CONTROL:
Final image must be premium ecommerce product photography.
Reject internally and regenerate mentally if logo/text/details are changed.
Output only the final edited image.
`;

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
            text: finalPrompt,
          },
        ],
      },
    ],
    config: {
      temperature: 0.12,
      topP: 0.65,
      candidateCount: 1,
      responseModalities: ["IMAGE"],
    },
  });

  const base64Image = extractImageBase64(response);

  return Buffer.from(base64Image, "base64");
}

export default {
  generateProductImage,
};