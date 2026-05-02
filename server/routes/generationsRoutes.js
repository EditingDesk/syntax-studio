import express from "express";
import prisma from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const days = Number(req.query.days || 7);
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const skip = (page - 1) * limit;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const assets = await prisma.asset.findMany({
      where: {
        assetType: "output",
        url: {
          not: null,
        },
        createdAt: {
          gte: fromDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      include: {
        product: true,
        job: true,
      },
    });

    const formatted = assets.map((asset) => ({
      id: asset.id,
      productId: asset.productId,
      jobId: asset.jobId,
      category: asset.product?.category,
      upc: asset.product?.upc,
      status: asset.product?.status,
      shot: asset.shot,
      url: asset.url,
      fileName: asset.fileName,
      createdAt: asset.createdAt,
    }));

    return res.json({
      success: true,
      items: formatted,
      page,
      limit,
      hasMore: assets.length === limit,
    });
  } catch (error) {
    console.error("Generations fetch error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/delete-selected", async (req, res) => {
  try {
    const { assetIds } = req.body;

    if (!assetIds || !assetIds.length) {
      return res.status(400).json({
        success: false,
        message: "No images selected",
      });
    }

    await prisma.asset.deleteMany({
      where: {
        id: { in: assetIds },
      },
    });

    return res.json({
      success: true,
      message: "Selected images deleted",
      deletedCount: assetIds.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Delete failed",
    });
  }
});

export default router;
