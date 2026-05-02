# Syntax Studio - Project Structure

Syntax Studio is a full-stack product image generation app. The React client lets users upload product images, generate enhanced product shots, review recent generations, preview images, and download outputs. The Express server handles uploads, Gemini image generation, Sharp image processing, Cloudflare R2 storage, and generation job metadata.

## Directory Structure

```text
Syntax_Studio/
|-- PROJECT_STRUCTURE.md
|-- favicon.ico
|-- client/
|   |-- package.json
|   |-- vite.config.js
|   |-- tailwind.config.js
|   |-- index.html
|   |-- dist/                         # Production build output
|   |-- src/
|   |   |-- main.jsx                   # React entry point
|   |   |-- App.jsx                    # App shell and routing
|   |   |-- index.css                  # Global Tailwind styles
|   |   |-- components/
|   |   |   |-- Lightbox.jsx
|   |   |   `-- MainTemplate.jsx
|   |   |-- config/
|   |   |   `-- categoryTemplates.js
|   |   |-- mock/
|   |   |   `-- dashboardData.js
|   |   |-- pages/
|   |   |   |-- DashboardPage.jsx
|   |   |   |-- GenerationsPage.jsx     # Recent generated images and ZIP download
|   |   |   |-- GeneratorPage.jsx
|   |   |   |-- ModelsPage.jsx
|   |   |   |-- ProductsPage.jsx        # Main product image generation flow
|   |   |   |-- SettingsPage.jsx
|   |   |   `-- ToolsPage.jsx
|   |   `-- services/
|   |       |-- api.js                  # Backend API helpers
|   |       `-- promptBuilder.js
|   `-- components/                    # Legacy component directory
|       |-- DownloadAllButton.jsx
|       |-- ProgressBar.jsx
|       |-- ResultGrid.jsx
|       `-- UploadSection.jsx
|
`-- server/
    |-- package.json
    |-- index.js                       # Express entry point
    |-- prisma.config.ts
    |-- .gitignore
    |-- config/
    |   |-- categoryTemplates.js
    |   `-- db.js                      # Prisma/database client setup
    |-- controllers/
    |   `-- generateController.js      # Generation request handler
    |-- prisma/
    |   |-- schema.prisma
    |   `-- migrations/
    |-- routes/
    |   |-- downloadRoutes.js          # GET /api/download-all/:batchId
    |   |-- generateRoutes.js          # POST /api/generate
    |   |-- generationHistoryRoutes.js # GET /api/generations
    |   `-- jobRoutes.js               # GET /api/jobs/:jobId
    |-- services/
    |   |-- backgroundRemoval.js
    |   |-- geminiService.js
    |   |-- generationService.js
    |   |-- imageProcessing.js         # Sharp processing helpers
    |   |-- jobService.js              # Job and asset persistence
    |   |-- promptBuilder.js
    |   |-- queueManager.js
    |   |-- r2Service.js               # Cloudflare R2/S3-compatible storage
    |   `-- zipService.js
    `-- test-r2.js
```

## Current Flow

1. `ProductsPage.jsx` collects uploaded product images and generation settings.
2. The client posts `multipart/form-data` to `POST /api/generate`.
3. `generateRoutes.js` validates uploads with `multer` and calls `generateHandler`.
4. `generateController.js` creates a generation job, uploads input assets to R2, calls Gemini, optionally removes background, processes the image with Sharp, uploads output assets to R2, and stores asset metadata.
5. The API returns `jobId` and `results`, where each result includes `shot`, `url`, `fileName`, and `originalName`.
6. `ProductsPage.jsx` renders generated images with `ImageCard` and downloads files using the returned `fileName`.
7. `GenerationsPage.jsx` loads recent generated images through `getGenerations(days)` in `client/src/services/api.js`.

## API Endpoints

| Method | Endpoint | Route file | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | `server/index.js` | Health check |
| `POST` | `/api/generate` | `server/routes/generateRoutes.js` | Generate product images |
| `GET` | `/api/generations?days=7` | `server/routes/generationHistoryRoutes.js` | List recent generated images from `outputs/` |
| `GET` | `/api/jobs/:jobId` | `server/routes/jobRoutes.js` | Fetch generation job metadata |
| `GET` | `/api/download-all/:batchId` | `server/routes/downloadRoutes.js` | ZIP download for legacy local output batches |

## Key Files

### Client

- `client/src/pages/ProductsPage.jsx`: Main product generation page, upload flow, generated image cards, lightbox, and single-image download.
- `client/src/pages/GenerationsPage.jsx`: Recent generations browser and client-side ZIP export.
- `client/src/services/api.js`: `generateImages(payload)` and `getGenerations(days)` backend helpers.
- `client/src/config/categoryTemplates.js`: Product category configuration used by the UI.

### Server

- `server/index.js`: Express app setup, CORS, static `/outputs`, and route mounting.
- `server/controllers/generateController.js`: Main generation orchestration.
- `server/services/imageProcessing.js`: Sharp helpers, including in-memory `processGeminiBuffer`.
- `server/services/geminiService.js`: Google Gemini image generation integration.
- `server/services/r2Service.js`: R2 upload/key helpers.
- `server/services/jobService.js`: Generation job and asset persistence.
- `server/config/db.js`: Database client setup.
- `server/prisma/schema.prisma`: Database schema.

## Storage

| Storage | Purpose |
| --- | --- |
| Cloudflare R2 | Primary input/output image storage for generated assets |
| Database via Prisma | Generation jobs and asset metadata |
| `server/outputs/` | Legacy/local generated image and ZIP source directory |
| `server/zips/` | ZIP files created by `downloadRoutes.js` |
| `client/dist/` | Production frontend build |

## Environment

Typical server environment variables include:

- `GEMINI_API_KEY`
- Database connection variables used by Prisma
- R2/S3-compatible credentials and bucket configuration

Typical client environment variables include:

- `VITE_API_BASE_URL`
- `VITE_API_URL`

If neither client API variable is set, `client/src/services/api.js` falls back to `http://localhost:3001`.

## Dependencies

### Client

- `react`, `react-dom`, `react-router-dom`
- `vite`
- `tailwindcss`
- `lucide-react`
- `jszip`
- `p-queue`

### Server

- `express`
- `multer`
- `cors`
- `dotenv`
- `@google/genai`
- `sharp`
- `@imgly/background-removal-node`
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `@prisma/client`, `prisma`
- `archiver`
- `p-queue`
- `uuid`

## Scripts

### Client

```bash
npm run dev
npm run build
npm run preview
npm start
```

### Server

```bash
npm run dev
npm start
```

## Notes

- `client/` also contains older top-level `components/`, `pages/`, and `services/` directories. The active app code is under `client/src/`.
- `downloadRoutes.js` still supports legacy local batch ZIP downloads. Current generated result objects are R2-backed and include `fileName` for direct single-image downloads.
- `generationHistoryRoutes.js` scans local `outputs/`; R2-backed history may need a separate database-backed endpoint if local output history is retired.
