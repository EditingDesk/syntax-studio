// server/controllers/generateController.js

import { generateMultipleShots } from "../services/generationService.js";

export async function generateHandler(req, res) {
  try {
    const { prompts } = req.body;

    console.log("Incoming prompts:", prompts);

    const images = await generateMultipleShots(prompts);

    res.json({
      success: true,
      images
    });
  } catch (err) {
    console.error("Generation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
}