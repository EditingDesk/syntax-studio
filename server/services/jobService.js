// server/services/jobService.js

import prisma from "../config/db.js";
console.log("DB LOADED:", prisma ? "YES" : "NO");

// =========================
// JOB
// =========================

export async function createJob({ category, mode, totalItems }) {
  return prisma.generationJob.create({
    data: {
      category,
      mode,
      status: "pending",
      totalItems,
    },
  });
}

export async function updateJobStatus(
  jobId,
  status,
  error = null,
  totalOutputs = undefined
) {
  const data = {
    status,
    error,
  };

  if (typeof totalOutputs === "number") {
    data.totalOutputs = totalOutputs;
  }

  return prisma.generationJob.update({
    where: { id: jobId },
    data,
  });
}

// =========================
// PRODUCT
// =========================

export async function createProduct({
  jobId,
  upc,
  category,
  productType,
  gender,
  size,
  stylingPrompt,
}) {
  return prisma.product.create({
    data: {
      jobId,
      upc,
      category,
      productType,
      gender,
      size,
      stylingPrompt,
      status: "ready",
    },
  });
}

export async function updateProductStatus(productId, status, error = null) {
  return prisma.product.update({
    where: { id: productId },
    data: {
      status,
      error,
    },
  });
}

// =========================
// ASSET
// =========================

export async function createAsset({
  jobId,
  productId,
  assetType,
  shot,
  fileName,
  r2Key,
  url,
  mimeType,
  sizeBytes,
}) {
  return prisma.asset.create({
    data: {
      jobId,
      productId,
      assetType,
      shot,
      fileName,
      r2Key,
      url,
      mimeType,
      sizeBytes,
    },
  });
}
