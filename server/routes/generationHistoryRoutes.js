import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function scanImages(dir, baseDir, days = 7) {
  if (!fs.existsSync(dir)) return [];

  const now = Date.now();
  const maxAge = days * 24 * 60 * 60 * 1000;
  const results = [];

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      results.push(...scanImages(fullPath, baseDir, days));
      continue;
    }

    const ext = path.extname(item.name).toLowerCase();

    if (!IMAGE_EXTENSIONS.includes(ext)) continue;

    const stat = fs.statSync(fullPath);

    if (now - stat.mtimeMs > maxAge) continue;

    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

    results.push({
      fileName: item.name,
      url: `/outputs/${relativePath}`,
      createdAt: stat.mtime,
      size: stat.size,
    });
  }

  return results;
}

router.get("/", (req, res) => {
  try {
    const days = Number(req.query.days || 7);
    const outputsDir = path.join(process.cwd(), "outputs");

    const images = scanImages(outputsDir, outputsDir, days).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      days,
      count: images.length,
      images,
    });
  } catch (error) {
    console.error("Generation history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load generations",
    });
  }
});

export default router;