// server/services/queueManager.js

import PQueue from "p-queue";

export const generationQueue = new PQueue({
  concurrency: 2,
  interval: 1000,
  intervalCap: 2,
});