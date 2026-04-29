import { removeBackground } from "@imgly/background-removal-node";

export async function removeImageBackground(inputBuffer) {
  if (!inputBuffer || !Buffer.isBuffer(inputBuffer)) {
    throw new Error("Invalid image buffer for background removal");
  }

  const blob = new Blob([inputBuffer], { type: "image/png" });

  const resultBlob = await removeBackground(blob, {
    debug: false,
    output: {
      format: "image/png",
      quality: 1,
    },
  });

  const arrayBuffer = await resultBlob.arrayBuffer();

  return Buffer.from(arrayBuffer);
}
