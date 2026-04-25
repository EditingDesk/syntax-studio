export async function generateHandler(req, res) {
  try {
    const { prompts } = req.body;

    console.log("Incoming prompts:", prompts);

    const images = await generateMultipleShots(prompts);

    console.log("Generated images:", images);

    res.json({
      success: true,
      images: images
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Generation failed" });
  }
}