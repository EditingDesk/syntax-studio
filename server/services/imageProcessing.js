import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const OUTPUT_WIDTH = 1644;
const OUTPUT_HEIGHT = 2464;
const TOP_BOTTOM_MARGIN = 50;
const JPG_QUALITY = 95;

const CONTENT_WIDTH = OUTPUT_WIDTH;
const CONTENT_HEIGHT = OUTPUT_HEIGHT - TOP_BOTTOM_MARGIN * 2;

/**
 * Final Syntax Studio output processor
 * Output:
 * - 1644 x 2464 px
 * - JPG
 * - #F1F1F1 background
 * - 100px top/bottom margin
 * - low-cost upscale using Sharp Lanczos3
 * - light sharpening
 */
export async function processFinalProductImage(inputBuffer, outputPath, options = {}) {
  if (!inputBuffer) {
    throw new Error("Missing input image buffer");
  }

  const {
    width = OUTPUT_WIDTH,
    height = OUTPUT_HEIGHT,
    marginTopBottom = TOP_BOTTOM_MARGIN,
    background = BACKGROUND_COLOR,
    quality = JPG_QUALITY,
    sharpen = true,
    enhance = false,
  } = options;

  const contentHeight = height - marginTopBottom * 2;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  let image = sharp(inputBuffer, {
    failOn: "none",
  })
    .rotate()
    .trim({
      threshold: 18,
    })
   .resize({
  width: CONTENT_WIDTH,
  height: CONTENT_HEIGHT,
  fit: "contain",
  background: { r: 241, g: 241, b: 241, alpha: 1 },
    });

  if (enhance) {
    image = image
      .modulate({
        brightness: 1.03,
        saturation: 1.05,
      })
      .linear(1.02, -2);
  }

  if (sharpen) {
    image = image.sharpen({ sigma: 0.6 });
  }

  const resizedBuffer = await image.toBuffer();
  const metadata = await sharp(resizedBuffer).metadata();

  const left = Math.round((width - metadata.width) / 2);
  const top = Math.round(marginTopBottom + (contentHeight - metadata.height) / 2);

  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background,
    },
  })
    .composite([
      {
        input: resizedBuffer,
        left,
        top,
      },
    ])
    .jpeg({
      quality,
      mozjpeg: true,
      chromaSubsampling: "4:4:4",
    })
    .toFile(outputPath);

  return {
    outputPath,
    width,
    height,
    format: "jpg",
    background,
    marginTopBottom,
  };
}

/**
 * Use this when Gemini returns base64 image data.
 */
export async function processGeminiBase64ToJpg(base64Image, outputPath, options = {}) {
  if (!base64Image) {
    throw new Error("Missing Gemini base64 image");
  }

  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const inputBuffer = Buffer.from(cleanBase64, "base64");

  return processFinalProductImage(inputBuffer, outputPath, options);
}

/**
 * Use this when Gemini already returns a buffer.
 */
export async function processGeminiBufferToJpg(inputBuffer, outputPath, options = {}) {
  return processFinalProductImage(inputBuffer, outputPath, options);
}
