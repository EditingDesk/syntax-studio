// server/services/generationService.js

import { generationQueue } from "./queueManager.js";
import { generateProductImage } from "./geminiService.js";

export async function generateMultipleShots(jobs) {
  if (!Array.isArray(jobs)) {
    throw new Error("Jobs must be an array");
  }

  if (jobs.length > 10) {
    throw new Error("Max 10 images per request");
  }

  console.log("Batch size:", jobs.length);

  const results = await Promise.all(
    jobs.map((job, index) =>
      generationQueue.add(async () => {
        console.log(`Generating ${index + 1}`);

        const result = await generateProductImage({
          imageBuffer: job.imageBuffer,
          prompt: job.prompt,
          filename: job.filename,
        });

        console.log(`Done ${index + 1}`);
        return result;
      })
    )
  );

  return results;
}