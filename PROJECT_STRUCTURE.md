# SYNTAX_STUDIO - Project Structure Map

## 📋 Project Overview
**SYNTAX_STUDIO** is a full-stack web application that generates product descriptions and content (primarily for watches and other items) using Google Gemini AI. It processes images, manages generation queues, and provides a user-friendly interface for batch processing.

---

## 🏗️ Directory Structure

```
SYNTAX_STUDIO/
├── README.md                          # Project documentation
├── .git/                              # Git repository
├── .gitignore                         # Git ignore rules
│
├── CLIENT/                            # Frontend (React + Vite + TailwindCSS)
│   ├── package.json                   # Client dependencies & scripts
│   ├── package-lock.json
│   ├── node_modules/
│   ├── dist/                          # Build output
│   │
│   ├── vite.config.js                 # Vite bundler configuration
│   ├── tailwind.config.js             # TailwindCSS configuration
│   ├── postcss.config.js              # PostCSS configuration
│   ├── index.html                     # HTML entry point
│   │
│   ├── src/                           # Source code
│   │   ├── main.jsx                   # React entry point
│   │   ├── App.jsx                    # Main App component
│   │   ├── index.css                  # Global styles
│   │   │
│   │   ├── pages/
│   │   │   └── GeneratorPage.jsx      # Main generator page component
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                 # API client for backend communication
│   │   │   └── promptBuilder.js       # Prompt construction utilities
│   │   │
│   │   └── config/
│   │       └── categoryTemplates.js   # Category templates (shared config)
│   │
│   └── components/                    # Reusable React components
│       ├── UploadSection.jsx          # File/image upload component
│       ├── ResultGrid.jsx             # Display generated results
│       ├── ProgressBar.jsx            # Progress tracking UI
│       └── DownloadAllButton.jsx      # Batch download component
│
├── SERVER/                            # Backend (Node.js + Express)
│   ├── package.json                   # Server dependencies & scripts
│   ├── package-lock.json
│   ├── node_modules/
│   ├── .env                           # Environment variables (GEMINI_API_KEY)
│   ├── index.js                       # Express server entry point
│   │
│   ├── routes/
│   │   └── generateRoutes.js          # API endpoints for generation
│   │
│   ├── controllers/
│   │   └── generateController.js      # Request handlers & business logic
│   │
│   ├── services/
│   │   ├── geminiService.js           # Google Gemini AI integration
│   │   ├── generationService.js       # Core generation logic
│   │   ├── imageProcessor.js          # Image processing (using Sharp)
│   │   ├── promptBuilder.js           # Dynamic prompt generation
│   │   ├── queueManager.js            # Queue management for concurrent requests
│   │   └── zipService.js              # ZIP file creation for downloads
│   │
│   ├── config/
│   │   └── categoryTemplates.js       # Product category templates & rules
│   │
│   ├── outputs/                       # Generated output files (temp storage)
│   ├── temp/                          # Temporary file storage
│   └── controllers/
│       └── generateController.js      # Generation request handlers
│
└── node_modules/                      # Root node_modules (if applicable)
```

---

## 🔄 Data Flow & Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                              │
│                                                                 │
│  User Interface (React + TailwindCSS)                          │
│         ↓                                                       │
│  ┌─────────────────────────────────────┐                       │
│  │ GeneratorPage.jsx                   │                       │
│  │ ├─ UploadSection (image upload)    │                       │
│  │ ├─ ProgressBar (status tracking)   │                       │
│  │ ├─ ResultGrid (display results)    │                       │
│  │ └─ DownloadAllButton (batch DL)    │                       │
│  └─────────────────────────────────────┘                       │
│         ↓                                                       │
│  api.js (HTTP Requests)                                        │
│         ↓                                                       │
└─────────────────────────────────────────────────────────────────┘
                       ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER SIDE                               │
│                                                                 │
│  Express.js + CORS                                             │
│         ↓                                                       │
│  generateRoutes.js                                             │
│         ↓                                                       │
│  generateController.js (Request Handler)                       │
│         ↓                                                       │
│  ┌─────────────────────────────────────┐                       │
│  │ generationService.js                │                       │
│  │ (Main orchestrator)                 │                       │
│  └─────────────────────────────────────┘                       │
│    ├─ imageProcessor.js                                        │
│    │   (Sharp: resize, optimize)       → temp/                 │
│    │                                                           │
│    ├─ promptBuilder.js                                         │
│    │   (Generate AI prompts)                                   │
│    │                                                           │
│    ├─ geminiService.js                                         │
│    │   (Google Gemini API calls) → ┌─────────────────────┐   │
│    │                              │ Google Gemini AI    │   │
│    │                              └─────────────────────┘   │
│    │                                                           │
│    ├─ queueManager.js                                         │
│    │   (p-queue: concurrent request limit)                    │
│    │                                                           │
│    └─ zipService.js                                           │
│        (Create ZIP files) → outputs/                          │
│                                                               │
│  config/categoryTemplates.js                                  │
│  (Product categories & AI instructions)                       │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Key Dependencies

### Client
- **react** (^18.2.0) - UI framework
- **vite** (^5.0.0) - Fast bundler
- **tailwindcss** (^3.4.0) - Styling
- **jszip** (^3.10.1) - ZIP file handling
- **lucide-react** (^0.344.0) - Icon library
- **p-queue** (^9.1.2) - Queue management

### Server
- **express** (^4.19.2) - Web framework
- **@google/genai** (^0.3.0) - Gemini AI API
- **sharp** (^0.33.5) - Image processing
- **multer** (^1.4.5-lts.1) - File upload handling
- **cors** (^2.8.5) - Cross-origin support
- **dotenv** (^16.4.5) - Environment variables
- **p-queue** (^9.2.0) - Queue management
- **nodemon** (^3.1.10) - Dev auto-reload

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Server environment (API keys) |
| `vite.config.js` | Frontend build configuration |
| `tailwind.config.js` | TailwindCSS styling rules |
| `postcss.config.js` | CSS processing |
| `categoryTemplates.js` | Product categories & AI prompts (shared) |

---

## 📡 API Endpoints

Located in: [server/routes/generateRoutes.js](server/routes/generateRoutes.js)

| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| POST | `/api/generate` | generateController | Main generation endpoint |
| GET/POST | `/api/status` | generateController | Queue/generation status |
| GET | `/api/download/:id` | generateController | Download generated files |

---

## 🔑 Core Services

### Frontend Services
- **api.js**: HTTP client wrapper for backend communication
- **promptBuilder.js**: Client-side prompt utilities

### Backend Services
- **geminiService.js**: Handles Gemini AI API integration
- **generationService.js**: Orchestrates the generation workflow
- **imageProcessor.js**: Image resizing/optimization (Sharp)
- **promptBuilder.js**: Dynamic prompt template generation
- **queueManager.js**: Request queue with concurrency limits (p-queue)
- **zipService.js**: Creates downloadable ZIP files

---

## 📂 File Storage

| Directory | Purpose |
|-----------|---------|
| `server/temp/` | Temporary processed images |
| `server/outputs/` | Generated ZIP files ready for download |
| `client/dist/` | Compiled frontend (production build) |

---

## 🚀 Scripts

### Client
```bash
npm run dev      # Start dev server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
npm start        # Serve production build on 8080
```

### Server
```bash
npm start        # Run server
npm run dev      # Run with nodemon (auto-reload)
```

---

## 🔄 Typical Workflow

1. **User** uploads images via UploadSection component
2. **Frontend** sends images to `/api/generate` with category & settings
3. **Server** processes:
   - Resizes/optimizes images (imageProcessor)
   - Generates AI prompts (promptBuilder)
   - Queues requests (queueManager)
   - Calls Gemini API for content generation (geminiService)
4. **Results** returned to client via ResultGrid
5. **User** downloads all results as ZIP file
6. **Files** cleaned from temp/outputs directories

---

## 🎯 Project Purpose

Generate high-quality product descriptions and content for e-commerce items (watches, apparel, etc.) using AI, with batch processing capabilities and concurrent request management.

---

## 📌 Key Features

✅ Batch image upload  
✅ Google Gemini AI integration  
✅ Queue management with concurrency limits  
✅ Image processing & optimization  
✅ Batch download as ZIP  
✅ Progress tracking  
✅ Multiple product categories  
✅ CORS-enabled API  

