// server/services/generationService.js

import { generationQueue } from "./queueManager.js";
import { generateWithGemini } from "./geminiService.js";

export async function generateMultipleShots(prompts) {
  // prompts = array of prompts (front, angle, side, etc)

  const results = await Promise.all(
    prompts.map((prompt) =>
      generationQueue.add(() => generateWithGemini(prompt))
    )
  );

  return results;
}