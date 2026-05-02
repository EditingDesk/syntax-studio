import express from "express";
import prisma from "../config/db.js";
import { generateProductImage } from "../services/geminiService.js";
import { processGeminiBuffer } from "../services/imageProcessing.js";
import { createAsset } from "../services/jobService.js";
import { buildR2Key, uploadBuffer } from "../services/r2Service.js";

const router = express.Router();

// GET /api/jobs/:jobId
router.get("/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.generationJob.findUnique({
      where: { id: jobId },
      include: {
        products: {
          include: {
            assets: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // flatten for frontend
    const products = job.products.map((p) => ({
      id: p.id,
      upc: p.upc,
      category: p.category,
      status: p.status,
      error: p.error,
      assets: p.assets.map((a) => ({
        id: a.id,
        type: a.assetType,
        shot: a.shot,
        url: a.url,
        fileName: a.fileName,
      })),
    }));

    return res.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        totalItems: job.totalItems,
        totalOutputs: job.totalOutputs,
        createdAt: job.createdAt,
      },
      products,
    });

  } catch (error) {
    console.error("Job fetch error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/retry", async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !productIds.length) {
      return res.status(400).json({
        success: false,
        message: "No productIds provided",
      });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        assets: true,
        job: true,
      },
    });

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "No products found",
      });
    }

    for (const product of products) {
      try {
        await prisma.product.update({
          where: { id: product.id },
          data: { status: "processing", error: null },
        });

        const inputAsset = product.assets.find(
          (asset) => asset.assetType === "input"
        );

        if (!inputAsset?.url) {
          throw new Error("Input asset missing");
        }

        const response = await fetch(inputAsset.url);

        if (!response.ok) {
          throw new Error(`Failed to fetch input image: ${response.status}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        const resultBuffer = await generateProductImage({
          imageBuffer: buffer,
          prompt:
            product.stylingPrompt ||
            "Create a clean premium ecommerce product image. Preserve product exactly.",
          filename: inputAsset.fileName || "input.jpg",
        });

        const finalBuffer = await processGeminiBuffer(resultBuffer, {
          width: 1644,
          height: 2464,
          background: "#F1F1F1",
          quality: 95,
        });

        const retryFileName = `${product.upc || "product"}_${
          inputAsset.shot || "front"
        }_retry_${Date.now()}.jpg`;

        const outputKey = buildR2Key(
          "outputs",
          product.jobId,
          product.id,
          retryFileName
        );

        const outputUpload = await uploadBuffer({
          key: outputKey,
          buffer: finalBuffer,
          contentType: "image/jpeg",
        });

        if (!outputUpload.url) {
          throw new Error("Retry upload failed - no URL returned");
        }

        await createAsset({
          jobId: product.jobId,
          productId: product.id,
          assetType: "output",
          shot: inputAsset.shot || "front",
          fileName: retryFileName,
          r2Key: outputUpload.r2Key,
          url: outputUpload.url,
          mimeType: "image/jpeg",
          sizeBytes: finalBuffer.length,
        });

        await prisma.product.update({
          where: { id: product.id },
          data: { status: "completed" },
        });
      } catch (err) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            status: "failed",
            error: err.message,
          },
        });
      }
    }

    return res.json({
      success: true,
      message: "Retry executed",
      productIds,
    });
  } catch (error) {
    console.error("Retry error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
