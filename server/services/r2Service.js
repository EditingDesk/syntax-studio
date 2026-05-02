// server/services/r2Service.js

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const requiredEnv = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing R2 environment variable: ${key}`);
  }
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL || "";

export function buildR2Key(...parts) {
  return parts
    .filter(Boolean)
    .join("/")
    .replace(/\/+/g, "/")
    .replace(/^\//, "");
}

export function getPublicUrl(key) {
  if (!PUBLIC_BASE_URL) return null;
  return `${PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
}

export async function uploadBuffer({ buffer, key, contentType }) {
  if (!buffer) throw new Error("uploadBuffer: buffer is required");
  if (!key) throw new Error("uploadBuffer: key is required");

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
    })
  );

  return {
    r2Key: key,
    url: getPublicUrl(key),
  };
}

export async function deleteObject(key) {
  if (!key) return;

  await r2.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}