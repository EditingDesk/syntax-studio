import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import generateRoutes from "./routes/generateRoutes.js";
import downloadRoutes from "./routes/downloadRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import generationsRoutes from "./routes/generationsRoutes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://syntax-studio-frontend.up.railway.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/outputs", express.static(path.join(process.cwd(), "outputs")));

app.use("/api/generate", generateRoutes);
app.use("/api", downloadRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/generations", generationsRoutes);

app.get("/", (_req, res) => {
  res.send("Syntax Studio server running");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
