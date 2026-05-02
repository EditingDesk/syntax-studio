-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "mode" TEXT,
    "status" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "totalOutputs" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobId" TEXT NOT NULL,
    "upc" TEXT,
    "category" TEXT NOT NULL,
    "productType" TEXT,
    "gender" TEXT,
    "size" TEXT,
    "stylingPrompt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "error" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobId" TEXT NOT NULL,
    "productId" TEXT,
    "assetType" TEXT NOT NULL,
    "shot" TEXT,
    "fileName" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "url" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationSetting" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "GenerationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenerationJob_createdAt_idx" ON "GenerationJob"("createdAt");

-- CreateIndex
CREATE INDEX "GenerationJob_status_idx" ON "GenerationJob"("status");

-- CreateIndex
CREATE INDEX "Product_jobId_idx" ON "Product"("jobId");

-- CreateIndex
CREATE INDEX "Product_upc_idx" ON "Product"("upc");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Asset_jobId_idx" ON "Asset"("jobId");

-- CreateIndex
CREATE INDEX "Asset_productId_idx" ON "Asset"("productId");

-- CreateIndex
CREATE INDEX "Asset_assetType_idx" ON "Asset"("assetType");

-- CreateIndex
CREATE INDEX "Asset_createdAt_idx" ON "Asset"("createdAt");

-- CreateIndex
CREATE INDEX "GenerationSetting_jobId_idx" ON "GenerationSetting"("jobId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
