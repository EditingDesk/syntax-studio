import PQueue from "p-queue";

// Control Gemini requests
export const generationQueue = new PQueue({
  concurrency: 4, // SAFE START
});

// Control Sharp processing
export const processingQueue = new PQueue({
  concurrency: 2,
});