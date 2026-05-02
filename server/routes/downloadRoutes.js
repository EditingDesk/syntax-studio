import express from "express";
import archiver from "archiver";
import prisma from "../config/db.js";
import { uploadBuffer, buildR2Key } from "../services/r2Service.js";

const router = express.Router();

// POST /api/download-selected
router.post("/download-selected", async (req, res) => {
  try {
    const { assetIds } = req.body;

    if (!assetIds || !assetIds.length) {
      return res.status(400).json({
        success: false,
        message: "No assetIds provided",
      });
    }

    // 1. get assets from DB
    const assets = await prisma.asset.findMany({
      where: {
        id: { in: assetIds },
        assetType: "output",
        url: { not: null },
      },
    });

    if (!assets.length) {
      return res.status(404).json({
        success: false,
        message: "No valid assets found",
      });
    }

    // 2. create zip in memory
    const archive = archiver("zip", { zlib: { level: 9 } });

    const buffers = [];

    archive.on("data", (data) => buffers.push(data));

    archive.on("error", (err) => {
      throw err;
    });

    for (const asset of assets) {
      const response = await fetch(asset.url);
      const arrayBuffer = await response.arrayBuffer();

      archive.append(Buffer.from(arrayBuffer), {
        name: asset.fileName || `${asset.id}.jpg`,
      });
    }

    await archive.finalize();

    const zipBuffer = Buffer.concat(buffers);

    // 3. upload ZIP to R2
    const zipKey = buildR2Key(
      "zips",
      `download_${Date.now()}.zip`
    );

    const upload = await uploadBuffer({
      key: zipKey,
      buffer: zipBuffer,
      contentType: "application/zip",
    });

    // 4. return URL
    return res.json({
      success: true,
      url: upload.url,
    });

  } catch (error) {
    console.error("ZIP error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;