import "dotenv/config";
import { uploadBufferToR2, buildR2Key } from "./services/r2Service.js";

async function testR2() {
  try {
    const key = buildR2Key({
      category: "test",
      jobId: "r2-test",
      type: "output",
      fileName: "hello.txt",
    });

    const buffer = Buffer.from("R2 upload test successful");

    const url = await uploadBufferToR2({
      key,
      buffer,
      contentType: "text/plain",
    });

    console.log("✅ R2 upload successful");
    console.log("Key:", key);
    console.log("URL:", url);
  } catch (error) {
    console.error("❌ R2 upload failed");
    console.error(error);
  }
}

testR2();