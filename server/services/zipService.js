import fs from "fs";
import path from "path";
import archiver from "archiver";

export function createZipFromFolder(folderPath, zipPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(folderPath)) {
      reject(new Error("Output folder not found"));
      return;
    }

    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", () => {
      resolve({
        zipPath,
        size: archive.pointer(),
      });
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    archive.directory(folderPath, false);

    archive.finalize();
  });
}