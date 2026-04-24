import { generateProductImage } from "../services/geminiService.js";

const resultBuffer = await generateProductImage({
  imageBuffer: req.file.buffer,
  prompt: finalPrompt,
  filename: req.file.originalname,
});
