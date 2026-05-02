import { generateProductImage } from "../services/geminiService.js";
import { processGeminiBuffer } from "../services/imageProcessing.js";
import { removeImageBackground } from "../services/backgroundRemoval.js";

import { buildR2Key, uploadBuffer } from "../services/r2Service.js";

import {
  createJob,
  updateJobStatus,
  createAsset,
  createProduct,
  updateProductStatus,
} from "../services/jobService.js";

// ------------------ helpers ------------------

function cleanFileName(name = "image") {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getBarcode(name = "") {
  const match = String(name).match(/\d{6,}/);
  return match ? match[0] : cleanFileName(name).split("_")[0] || "unknown";
}

function shortId(id = "") {
  return String(id).slice(0, 6);
}

function getShotName(file, index) {
  const original = cleanFileName(file.originalname).toLowerCase();

  if (original.includes("front")) return "front";
  if (original.includes("angle")) return "angle";
  if (original.includes("side")) return "side";
  if (original.includes("back")) return "back";
  if (original.includes("box")) return "box";

  return `shot_${index + 1}`;
}

function getOutputSize(size = "") {
  const normalized = String(size).toLowerCase().replace(/\s/g, "");

  if (normalized.includes("1600x1600")) return { width: 1600, height: 1600 };
  if (normalized.includes("2000x2000")) return { width: 2000, height: 2000 };
  if (normalized.includes("1644x2464")) return { width: 1644, height: 2464 };

  return { width: 1644, height: 2464 };
}

function parseJsonField(value, fallback) {
  if (!value) return fallback;

  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

function normalizePrompts(value) {
  const parsed = parseJsonField(value, []);

  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === "string") return [parsed];

  return [];
}

function getBackgroundHex(background = "lightgray") {
  const normalized = String(background).toLowerCase();

  if (normalized.includes("white")) return "#FFFFFF";
  return "#F1F1F1";
}

// ------------------ MAIN ------------------

export async function generateHandler(req, res) {
  let job = null;

  try {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    const category = req.body.category || "watch";
    const mode = req.body.mode || "enhance";

    job = await createJob({
      category,
      mode,
      totalItems: files.length,
    });

    await updateJobStatus(job.id, "processing");

    console.log("Job created:", job.id);

    const prompts = normalizePrompts(req.body.prompts);
    const processing = parseJsonField(req.body.processing, {}) || {};
    const outputSize = getOutputSize(req.body.size);
    const bgHex = getBackgroundHex(req.body.background);

    const results = [];

    for (let i = 0; i < files.length; i++) {
      let product = null;

      try {
        const file = files[i];
        const shotName = getShotName(file, i);
        const barcode = getBarcode(file.originalname);

        product = await createProduct({
          jobId: job.id,
          upc: barcode,
          category,
          productType: category === "watch" ? "watch" : null,
          gender: null,
          size: null,
          stylingPrompt: prompts[i] || req.body.prompt || null,
        });

        const inputKey = buildR2Key("inputs", job.id, file.originalname);

        const inputUpload = await uploadBuffer({
          key: inputKey,
          buffer: file.buffer,
          contentType: file.mimetype,
        });
        const inputUrl = inputUpload.url;

        await createAsset({
          jobId: job.id,
          productId: product.id,
          assetType: "input",
          shot: shotName,
          fileName: file.originalname,
          r2Key: inputKey,
          url: inputUrl,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        });

        const prompt =
          prompts[i] ||
          req.body.prompt ||
          "Create a clean premium ecommerce product image. Preserve product exactly.";

        const geminiBuffer = await generateProductImage({
          imageBuffer: file.buffer,
          prompt,
          filename: file.originalname,
        });

        let processedBuffer = geminiBuffer;

        if (processing.removeBg === true) {
          processedBuffer = await removeImageBackground(geminiBuffer);
        }

        const finalBuffer = await processGeminiBuffer(processedBuffer, {
          width: outputSize.width,
          height: outputSize.height,
          background: bgHex,
          quality: 95,
        });

        const outputFileName = `${barcode}_${shotName}_${shortId(job.id)}.jpg`;

        const outputKey = buildR2Key(
          "outputs",
          job.id,
          product.id,
          outputFileName
        );

        const outputUpload = await uploadBuffer({
          key: outputKey,
          buffer: finalBuffer,
          contentType: "image/jpeg",
        });

        const outputAsset = await createAsset({
          jobId: job.id,
          productId: product.id,
          assetType: "output",
          shot: shotName,
          fileName: outputFileName,
          r2Key: outputUpload.r2Key,
          url: outputUpload.url,
          mimeType: "image/jpeg",
          sizeBytes: finalBuffer.length,
        });

        await updateProductStatus(product.id, "completed");

        results.push({
          id: outputAsset.id,
          shot: shotName,
          url: outputUpload.url,
          fileName: outputFileName,
          originalName: file.originalname,
        });
      } catch (itemError) {
        console.error("Product generation failed:", itemError);

        if (product) {
          await updateProductStatus(product.id, "failed", itemError.message);
        }
      }
    }

    const finalStatus =
      results.length === files.length
        ? "completed"
        : results.length > 0
        ? "partial"
        : "failed";

    await updateJobStatus(
      job.id,
      finalStatus,
      finalStatus === "failed" ? "All generations failed" : null,
      results.length
    );

    return res.json({
      success: true,
      jobId: job.id,
      status: finalStatus,
      results,
    });
  } catch (error) {
    console.error("Generate error:", error);

    if (job) {
      await updateJobStatus(job.id, "failed", error.message);
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
