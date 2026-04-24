import React, { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  Search,
  Home,
  Watch,
  Glasses,
  Shirt,
  Settings,
  User,
  Upload,
  Image as ImageIcon,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save,
  FolderOpen,
  Trash2,
  Pause,
  Play,
  Square,
} from "lucide-react";

const STORAGE_KEY = "syntax_studio_watch_prompts_v1";

const defaultPrompts = {
  front:
    "Create a premium e-commerce front watch image. Preserve logo, text, dial, shape, color, and materials exactly.",
  angle:
    "Create a clean premium angle watch shot. Preserve design, reflections, and metallic finish.",
  side:
    "Create a clean side profile product image. Preserve crown, thickness, and body shape.",
  back:
    "Create a premium back watch image. Preserve engravings, texture, and proportions.",
  box:
    "Create a premium product packaging image with exact branding and clean background.",
  model:
    "Generate a realistic model wearing shot using the front watch image on the left hand. Preserve watch identity exactly.",
};

const shotTypes = ["front", "angle", "side", "back", "box", "model"];
const requiredShots = ["front", "angle", "side", "back"];
const acceptedExtensions = ["jpg", "jpeg", "png", "webp"];

function createEmptyShots() {
  return {
    front: null,
    angle: null,
    side: null,
    back: null,
    box: null,
    model: null,
  };
}

function createJob(barcode) {
  return {
    barcode,
    shots: createEmptyShots(),
    status: "idle", // idle | queued | generating | done | error
    progress: 0,
    error: null,
    generatedResults: null,
  };
}

function detectShotType(name) {
  const lower = name.toLowerCase();
  const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean);

  for (const shot of shotTypes) {
    if (tokens.includes(shot)) return shot;
  }

  return null;
}

function detectBarcode(name, shot) {
  const lower = name.toLowerCase();
  const extensionRemoved = lower.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  const tokens = extensionRemoved.split(/[^a-z0-9]+/).filter(Boolean);

  const filtered = tokens.filter((token) => token !== shot && token !== "raw");

  const numeric = filtered.find((token) => /^\d{4,}$/.test(token));
  if (numeric) return numeric;

  const fallback = filtered.find((token) => token.length >= 4);
  return fallback || null;
}

function parseUploads(files, existingJobs = []) {
  const grouped = {};

  existingJobs.forEach((job) => {
    grouped[job.barcode] = {
      ...job,
      shots: { ...createEmptyShots(), ...job.shots },
    };
  });

  const invalid = [];

  files.forEach((file) => {
    const clean = file.name.trim();
    const extMatch = clean.match(/\.([a-z0-9]+)$/i);
    const extension = extMatch?.[1]?.toLowerCase();

    if (!extension || !acceptedExtensions.includes(extension)) {
      invalid.push({ file, reason: "Unsupported file format" });
      return;
    }

    const shot = detectShotType(clean);
    if (!shot) {
      invalid.push({
        file,
        reason:
          "Shot type not found. Include front, angle, side, back, box, or model in filename",
      });
      return;
    }

    const barcode = detectBarcode(clean, shot);
    if (!barcode) {
      invalid.push({
        file,
        reason: "Barcode or product code not found in filename",
      });
      return;
    }

    if (!grouped[barcode]) {
      grouped[barcode] = createJob(barcode);
    }

    const previousAsset = grouped[barcode].shots[shot];
    if (previousAsset?.url) {
      URL.revokeObjectURL(previousAsset.url);
    }

    grouped[barcode].shots[shot] = {
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
    };

    if (grouped[barcode].status === "done" || grouped[barcode].status === "error") {
      grouped[barcode].status = "idle";
      grouped[barcode].progress = 0;
      grouped[barcode].error = null;
    }
  });

  return {
    jobs: Object.values(grouped).sort((a, b) =>
      String(a.barcode).localeCompare(String(b.barcode))
    ),
    invalid,
  };
}

function Sidebar({ page, setPage }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "watches", label: "Watches", icon: Watch },
    { key: "shoes", label: "Shoes", icon: Shirt },
    { key: "sunglasses", label: "Sunglasses", icon: Glasses },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "profile", label: "Profile", icon: User },
  ];

  return (
    <aside className="w-[110px] shrink-0 rounded-[34px] bg-white/75 backdrop-blur-xl shadow-[0_20px_60px_rgba(78,117,168,0.18)] border border-white/60 overflow-hidden">
      <div className="h-28 flex items-center justify-center border-b border-slate-100">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-200 via-sky-200 to-yellow-200 flex items-center justify-center text-slate-800 font-black text-xl">
          S
        </div>
      </div>
      <nav className="p-3 flex flex-col gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`rounded-[24px] px-2 py-4 flex flex-col items-center gap-2 transition-all ${
                active
                  ? "bg-sky-100 text-slate-950 shadow-inner"
                  : "bg-transparent text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  active ? "bg-yellow-300" : "bg-slate-100"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-[12px] font-semibold leading-tight text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-950">
          SYNTAX AI
        </h1>
        <p className="text-slate-700 font-medium">Studio AI Image Solution</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-[420px] max-w-full rounded-full bg-white/80 px-6 py-4 flex items-center gap-3 shadow-sm border border-white/70">
          <Search className="h-5 w-5 text-slate-500" />
          <input
            className="bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
            placeholder="Search something..."
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-800">LakshW</div>
          <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden" />
        </div>
      </div>
    </div>
  );
}

function Card({ title, right, children, className = "" }) {
  return (
    <section
      className={`rounded-[30px] bg-white/88 backdrop-blur-xl border border-white/70 shadow-[0_20px_50px_rgba(73,111,161,0.12)] p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function StatusChip({ ok, text, tone = "default" }) {
  const toneClass =
    tone === "error"
      ? "bg-red-50 text-red-700"
      : tone === "info"
      ? "bg-sky-50 text-sky-700"
      : ok
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${toneClass}`}
    >
      {tone === "error" ? (
        <AlertCircle className="h-4 w-4" />
      ) : ok ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {text}
    </span>
  );
}

function ShotCard({ shot, asset, onOpen }) {
  const label = shot === "model" ? "Will be generated from front shot" : "Missing";

  return (
    <div className="rounded-[18px] bg-white p-3 border border-slate-100 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <div className="capitalize text-sm font-extrabold text-slate-900">
          {shot}
        </div>
        {asset ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <AlertCircle className="h-5 w-5 text-slate-300" />
        )}
      </div>

      <button
        type="button"
        onClick={() => asset?.url && onOpen(asset.url, asset.name)}
        className={`w-full rounded-[16px] border border-slate-100 overflow-hidden bg-gradient-to-br from-sky-50 to-slate-100 flex items-center justify-center ${
          asset ? "cursor-zoom-in" : "cursor-default"
        }`}
      >
        <div className="w-full aspect-[2/3] flex items-center justify-center overflow-hidden">
          {asset ? (
            <img
              src={asset.url}
              alt={asset.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-slate-400" />
          )}
        </div>
      </button>

      <div className="mt-2 text-[11px] text-slate-500 break-all min-h-[30px] line-clamp-2">
        {asset?.name || label}
      </div>
    </div>
  );
}

function getJobStatus(job) {
  if (job.status === "error") {
    return { ok: false, text: job.error || "Error", tone: "error" };
  }

  if (job.status === "generating") {
    return { ok: false, text: `Generating ${job.progress}%`, tone: "info" };
  }

  if (job.status === "queued") {
    return { ok: false, text: "Queued", tone: "info" };
  }

  if (job.status === "done") {
    return { ok: true, text: "Completed", tone: "default" };
  }

  const ready = requiredShots.every((k) => job.shots[k]);
  return {
    ok: ready,
    text: ready ? "Ready to generate" : "Missing required shots",
    tone: "default",
  };
}

function getImageSrc(image) {
  if (!image?.base64 || !image?.mimeType) return "";
  return `data:${image.mimeType};base64,${image.base64}`;
}

function downloadDataUrl(dataUrl, fileName) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadBase64Image(image, fileName) {
  const dataUrl = getImageSrc(image);
  if (!dataUrl) return;
  downloadDataUrl(dataUrl, fileName);
}

function WatchesPage({
  prompts,
  settings,
  setSettings,
  setLightboxImage,
  setLightboxTitle,
}) {
  const [jobs, setJobs] = useState([]);
  const [invalidFiles, setInvalidFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const [queueState, setQueueState] = useState("idle");
  const [currentBarcode, setCurrentBarcode] = useState(null);

  const pauseRequestedRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const queueRunningRef = useRef(false);

  useEffect(() => {
    return () => {
      jobs.forEach((job) => {
        Object.values(job.shots).forEach((asset) => {
          if (asset?.url) URL.revokeObjectURL(asset.url);
        });
      });
    };
  }, [jobs]);

  const totalFiles = useMemo(
    () =>
      jobs.reduce(
        (sum, job) => sum + Object.values(job.shots).filter(Boolean).length,
        0
      ),
    [jobs]
  );

  function getAvailableShots(job) {
    return ["front", "angle", "side", "back", "box"].filter(
      (shot) => job.shots[shot]
    );
  }

  function hasAtLeastOneShot(job) {
    return getAvailableShots(job).length > 0;
  }

  const queueCounts = useMemo(() => {
    const ready = jobs.filter(
      (job) =>
        hasAtLeastOneShot(job) &&
        (job.status === "idle" || job.status === "queued")
    ).length;

    return {
      ready,
      generating: jobs.filter((job) => job.status === "generating").length,
      done: jobs.filter((job) => job.status === "done").length,
      failed: jobs.filter((job) => job.status === "error").length,
    };
  }, [jobs]);

  function getLocalJobStatus(job) {
    if (job.status === "error") {
      return { ok: false, text: job.error || "Error", tone: "error" };
    }

    if (job.status === "generating") {
      return { ok: false, text: `Generating ${job.progress}%`, tone: "info" };
    }

    if (job.status === "queued") {
      return { ok: false, text: "Queued", tone: "info" };
    }

    if (job.status === "done") {
      return { ok: true, text: "Completed", tone: "default" };
    }

    const availableShots = getAvailableShots(job);

    if (availableShots.length === 0) {
      return {
        ok: false,
        text: "No valid shot uploaded",
        tone: "default",
      };
    }

    if (availableShots.length < 5) {
      return {
        ok: true,
        text: `Partial generate (${availableShots.length}/5 shots)`,
        tone: "info",
      };
    }

    return {
      ok: true,
      text: "Ready to generate",
      tone: "default",
    };
  }

  function handleFiles(selectedFiles) {
    const list = Array.from(selectedFiles || []);
    if (!list.length) return;

    setJobs((prev) => {
      const { jobs: parsedJobs, invalid } = parseUploads(list, prev);
      setInvalidFiles((old) => [...old, ...invalid]);
      return parsedJobs;
    });
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  function clearAll() {
    jobs.forEach((job) => {
      Object.values(job.shots).forEach((asset) => {
        if (asset?.url) URL.revokeObjectURL(asset.url);
      });
    });

    pauseRequestedRef.current = false;
    stopRequestedRef.current = false;
    queueRunningRef.current = false;
    setQueueState("idle");
    setCurrentBarcode(null);
    setJobs([]);
    setInvalidFiles([]);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitIfPaused() {
    while (pauseRequestedRef.current && !stopRequestedRef.current) {
      await sleep(250);
    }
  }

  async function generateSingleJob(barcode) {
    const API_URL = "https://syntax-studio-backend.up.railway.app";

    const targetJob = jobs.find((job) => job.barcode === barcode);
    if (!targetJob) return false;

    const availableShots = getAvailableShots(targetJob);
    if (availableShots.length === 0) return false;

    setCurrentBarcode(barcode);

    setJobs((prev) =>
      prev.map((job) =>
        job.barcode === barcode
          ? {
              ...job,
              status: "generating",
              progress: 5,
              error: null,
            }
          : job
      )
    );

    try {
      const formData = new FormData();
formData.append("barcode", barcode);
formData.append("model", settings.modelLabel);
formData.append("candidateCount", "1");
formData.append("prompts", JSON.stringify(prompts));

formData.append(
  "processing",
  JSON.stringify({
    outputWidth: settings.outputWidth,
    outputHeight: settings.outputHeight,
    fitMode: settings.fitMode,
    backgroundColor: settings.backgroundColor,
    gravity: settings.gravity,
    sharpen: settings.sharpen,
    upscaleEnabled: settings.upscaleEnabled,
  })
);

      availableShots.forEach((shot) => {
        const asset = targetJob.shots[shot];
        if (asset?.file) {
          formData.append(shot, asset.file, asset.name);
        }
      });

      const response = await fetch(`${API_URL}/api/generate-watch-job`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setJobs((prev) =>
        prev.map((job) =>
          job.barcode === barcode
            ? {
                ...job,
                status: "done",
                progress: 100,
                error: null,
                generatedResults: data.results,
              }
            : job
        )
      );

      return true;
    } catch (error) {
      setJobs((prev) =>
        prev.map((job) =>
          job.barcode === barcode
            ? {
                ...job,
                status: "error",
                error: error.message || "Generation failed",
                progress: 0,
              }
            : job
        )
      );

      return false;
    } finally {
      setCurrentBarcode(null);
    }
  }

  async function handleGenerate(barcode) {
    if (queueRunningRef.current) return;
    await generateSingleJob(barcode);
  }

  async function handleDownloadBestZip(job) {
    if (!job.generatedResults) return;

    const zip = new JSZip();

    Object.entries(job.generatedResults).forEach(([shot, result]) => {
      const bestIndex = result.bestIndex ?? 0;
      const bestCandidate = result.candidates?.[bestIndex];

      if (!bestCandidate?.image?.base64) return;

      zip.file(`${job.barcode}_${shot}_best.png`, bestCandidate.image.base64, {
        base64: true,
      });
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${job.barcode}_best_images.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  async function handleRunAll() {
    if (queueRunningRef.current) return;

    const readyJobs = jobs.filter(
      (job) =>
        hasAtLeastOneShot(job) &&
        (job.status === "idle" || job.status === "queued" || job.status === "error")
    );

    if (!readyJobs.length) return;

    queueRunningRef.current = true;
    pauseRequestedRef.current = false;
    stopRequestedRef.current = false;
    setQueueState("running");

    setJobs((prev) =>
      prev.map((job) => {
        const ready = hasAtLeastOneShot(job);
        if (!ready) return job;
        if (job.status === "done") return job;

        return {
          ...job,
          status: "queued",
          progress: 0,
          error: null,
        };
      })
    );

    try {
      for (const job of readyJobs) {
        if (stopRequestedRef.current) break;

        await waitIfPaused();
        if (stopRequestedRef.current) break;

        await generateSingleJob(job.barcode);
      }
    } finally {
      queueRunningRef.current = false;
      setCurrentBarcode(null);

      if (stopRequestedRef.current) {
        setQueueState("stopped");
        setJobs((prev) =>
          prev.map((job) =>
            job.status === "queued" || job.status === "generating"
              ? { ...job, status: "idle", progress: 0, error: null }
              : job
          )
        );
      } else if (pauseRequestedRef.current) {
        setQueueState("paused");
      } else {
        setQueueState("idle");
        setJobs((prev) =>
          prev.map((job) =>
            job.status === "queued"
              ? { ...job, status: "idle", progress: 0, error: null }
              : job
          )
        );
      }

      pauseRequestedRef.current = false;
      stopRequestedRef.current = false;
    }
  }

  function handlePause() {
    if (!queueRunningRef.current) return;
    pauseRequestedRef.current = true;
    setQueueState("paused");
  }

  function handleResume() {
    if (!queueRunningRef.current) return;
    pauseRequestedRef.current = false;
    setQueueState("running");
  }

  function handleStop() {
    if (!queueRunningRef.current) return;
    stopRequestedRef.current = true;
    pauseRequestedRef.current = false;
    setQueueState("stopped");
  }

  const canRunAll = jobs.some(
    (job) =>
      hasAtLeastOneShot(job) &&
      (job.status === "idle" || job.status === "queued" || job.status === "error")
  );

  return (
    <div className="grid grid-cols-12 gap-6">
      <Card title="Watch Upload Jobs" className="col-span-8">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <label className="cursor-pointer rounded-full px-5 py-3 bg-sky-400 text-white font-semibold shadow-sm inline-flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Select file
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>

          <label className="cursor-pointer rounded-full px-5 py-3 bg-yellow-300 text-slate-950 font-semibold inline-flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk upload
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>

          <button
            onClick={handleRunAll}
            disabled={!canRunAll || queueRunningRef.current}
            className={`rounded-full px-5 py-3 font-semibold inline-flex items-center gap-2 ${
              !canRunAll || queueRunningRef.current
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-slate-950 text-white"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Run All
          </button>

          <button
            onClick={handlePause}
            disabled={!queueRunningRef.current || queueState === "paused"}
            className={`rounded-full px-4 py-3 font-semibold inline-flex items-center gap-2 ${
              !queueRunningRef.current || queueState === "paused"
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            <Pause className="h-4 w-4" />
            Pause
          </button>

          <button
            onClick={handleResume}
            disabled={!queueRunningRef.current || queueState !== "paused"}
            className={`rounded-full px-4 py-3 font-semibold inline-flex items-center gap-2 ${
              !queueRunningRef.current || queueState !== "paused"
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <Play className="h-4 w-4" />
            Resume
          </button>

          <button
            onClick={handleStop}
            disabled={!queueRunningRef.current}
            className={`rounded-full px-4 py-3 font-semibold inline-flex items-center gap-2 ${
              !queueRunningRef.current
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-red-100 text-red-700"
            }`}
          >
            <Square className="h-4 w-4" />
            Stop
          </button>

          <div className="rounded-full bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
            Candidate count: {settings.candidateCount}
          </div>

          <div className="flex rounded-full overflow-hidden border border-slate-200">
            {[1].map((n) => (
              <button
                key={n}
                onClick={() => setSettings((prev) => ({ ...prev, candidateCount: n }))}
                className={`px-4 py-2 text-sm font-semibold ${
                  settings.candidateCount === n
                    ? "bg-pink-400 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            onClick={clearAll}
            className="rounded-full px-4 py-3 bg-slate-100 text-slate-700 font-semibold inline-flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mb-5 rounded-[28px] border-2 border-dashed p-6 text-center transition-all ${
            isDragging ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white/40"
          }`}
        >
          <div className="text-lg font-black text-slate-900 mb-2">
            Drag and drop watch images here
          </div>
          <div className="text-sm text-slate-500">
            You can drop one image or many images. Missing shots will merge into existing barcode jobs.
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="rounded-[22px] bg-slate-50 p-4 border border-slate-100">
            <div className="text-sm text-slate-500">Detected jobs</div>
            <div className="text-3xl font-black text-slate-950 mt-1">{jobs.length}</div>
          </div>
          <div className="rounded-[22px] bg-slate-50 p-4 border border-slate-100">
            <div className="text-sm text-slate-500">Ready / Queued</div>
            <div className="text-3xl font-black text-slate-950 mt-1">
              {queueCounts.ready}
            </div>
          </div>
          <div className="rounded-[22px] bg-slate-50 p-4 border border-slate-100">
            <div className="text-sm text-slate-500">Done</div>
            <div className="text-3xl font-black text-slate-950 mt-1">
              {queueCounts.done}
            </div>
          </div>
          <div className="rounded-[22px] bg-slate-50 p-4 border border-slate-100">
            <div className="text-sm text-slate-500">Failed</div>
            <div className="text-3xl font-black text-slate-950 mt-1">
              {queueCounts.failed}
            </div>
          </div>
        </div>

        <div className="rounded-[22px] bg-slate-50 p-4 border border-slate-100 mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusChip
              ok={queueState === "idle"}
              tone={queueState === "running" ? "info" : queueState === "stopped" ? "error" : "default"}
              text={
                queueState === "running"
                  ? `Queue running${currentBarcode ? ` - ${currentBarcode}` : ""}`
                  : queueState === "paused"
                  ? "Queue paused"
                  : queueState === "stopped"
                  ? "Queue stopped"
                  : "Queue idle"
              }
            />
            <div className="text-sm text-slate-600">
              Valid files: <span className="font-bold">{totalFiles}</span>
            </div>
            <div className="text-sm text-slate-600">
              Invalid files: <span className="font-bold">{invalidFiles.length}</span>
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/60 h-[320px] flex flex-col items-center justify-center text-center px-6">
            <Upload className="h-10 w-10 text-slate-400 mb-4" />
            <div className="text-xl font-black text-slate-900 mb-2">
              Upload watch files to begin
            </div>
            <div className="text-sm text-slate-500 max-w-lg">
              Use names like <span className="font-bold">barcode_front.jpg</span>,{" "}
              <span className="font-bold">120233997258_front_raw_1.jpg</span>, or{" "}
              <span className="font-bold">258888511_raw_front.jpg</span>.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const ready = hasAtLeastOneShot(job);
              const statusInfo = getLocalJobStatus(job);

              return (
                <div
                  key={job.barcode}
                  className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4"
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="text-lg font-black text-slate-950">
                        Barcode {job.barcode}
                      </div>
                      <div className="text-sm text-slate-500">
                        Auto-detected from flexible filename pattern
                      </div>
                      {getAvailableShots(job).length < 5 && getAvailableShots(job).length > 0 && (
                        <div className="text-xs text-amber-600 font-semibold mt-1">
                          Missing shots will be skipped. Only uploaded images will be generated.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusChip
                        ok={statusInfo.ok}
                        text={statusInfo.text}
                        tone={statusInfo.tone}
                      />
                      <button
                        onClick={() => handleGenerate(job.barcode)}
                        disabled={
                          !ready ||
                          job.status === "generating" ||
                          queueRunningRef.current
                        }
                        className={`rounded-full px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 ${
                          !ready || job.status === "generating" || queueRunningRef.current
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-slate-950 text-white"
                        }`}
                      >
                        <Sparkles className="h-4 w-4" />
                        {job.status === "generating" ? "Generating..." : "Generate"}
                      </button>
                    </div>
                  </div>

                  {(job.status === "generating" || job.status === "queued") && (
                    <div className="mb-4">
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-sky-400 transition-all"
                          style={{
                            width: `${job.status === "queued" ? 0 : job.progress}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-6 gap-3">
                    {shotTypes.map((shot) => (
                      <ShotCard
                        key={shot}
                        shot={shot}
                        asset={job.shots[shot]}
                        onOpen={(src, title) => {
                          setLightboxImage(src);
                          setLightboxTitle(title);
                        }}
                      />
                    ))}
                  </div>

                  {job.generatedResults && (
                    <div className="mt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-black text-slate-950">
                          Generated Best Images
                        </div>

                        <button
                          onClick={() => handleDownloadBestZip(job)}
                          className="rounded-full px-4 py-2 bg-slate-950 text-white text-sm font-semibold inline-flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Bulk Download Best
                        </button>
                      </div>

                      <div className="grid grid-cols-6 gap-3">
                        {["front", "angle", "side", "back", "box", "model"].map((shot) => {
                          const result = job.generatedResults?.[shot];
                          const bestIndex = result?.bestIndex ?? 0;
                          const bestCandidate = result?.candidates?.[bestIndex];

                          if (!bestCandidate) {
                            return (
                              <div
                                key={shot}
                                className="rounded-[18px] bg-white p-3 border border-slate-100 min-w-0"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="capitalize text-sm font-extrabold text-slate-900">
                                    {shot}
                                  </div>
                                  <AlertCircle className="h-5 w-5 text-slate-300" />
                                </div>

                                <div className="w-full aspect-[2/3] rounded-[16px] border border-slate-100 bg-slate-50 flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-slate-400" />
                                </div>

                                <div className="mt-2 text-[11px] text-slate-500">
                                  No generated image
                                </div>
                              </div>
                            );
                          }

                          const imageSrc = `data:${bestCandidate.image.mimeType};base64,${bestCandidate.image.base64}`;

                          return (
                            <div
                              key={shot}
                              className="rounded-[18px] bg-white p-3 border border-slate-100 min-w-0"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="capitalize text-sm font-extrabold text-slate-900">
                                  {shot}
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setLightboxImage(imageSrc);
                                  setLightboxTitle(`${job.barcode}_${shot}_best`);
                                }}
                                className="w-full cursor-zoom-in"
                              >
                                <div className="w-full aspect-[2/3] rounded-[16px] overflow-hidden border border-slate-100 bg-white">
                                  <img
                                    src={imageSrc}
                                    alt={`${shot}-best`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </button>

                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-slate-500">Best</span>

                                <button
                                  onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = imageSrc;
                                    link.download = `${job.barcode}_${shot}_best.png`;
                                    link.click();
                                  }}
                                  className="text-xs text-blue-600 font-semibold"
                                >
                                  Download
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {invalidFiles.length > 0 && (
          <div className="mt-5 rounded-[24px] bg-amber-50 border border-amber-100 p-4">
            <div className="font-bold text-amber-800 mb-2">Invalid file names</div>
            <div className="space-y-2">
              {invalidFiles.map((item, index) => (
                <div
                  key={`${item.file.name}-${index}`}
                  className="text-sm text-amber-700 break-all"
                >
                  <span className="font-semibold">{item.file.name}</span> - {item.reason}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Generation Panel"
        className="col-span-4"
        right={<StatusChip ok text="Phase 1" />}
      >
        <div className="space-y-4">
          <div className="rounded-[24px] bg-sky-50 p-4">
            <div className="text-sm font-bold text-sky-700 mb-1">Model label</div>
            <div className="text-lg font-black text-slate-950">
              {settings.modelLabel}
            </div>
          </div>

          <div className="rounded-[24px] bg-pink-50 p-4">
            <div className="text-sm font-bold text-pink-700 mb-1">
              Queue strategy
            </div>
            <div className="text-sm text-slate-700">
              Run one barcode at a time. Safer for retries, progress tracking, and later Gemini API control.
            </div>
          </div>

          <div className="rounded-[24px] bg-yellow-50 p-4">
            <div className="text-sm font-bold text-yellow-700 mb-1">
              Model shot rule
            </div>
            <div className="text-sm text-slate-700">
              Model shot stays in UI but should be added after normal watch shots are stable.
            </div>
          </div>

          <div className="rounded-[24px] bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Output candidates</div>
            <div className="text-lg font-black text-slate-950 mt-1">
              {settings.candidateCount} per shot
            </div>
          </div>

          <div className="rounded-[24px] bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Current queue state</div>
            <div className="text-lg font-black text-slate-950 mt-1 capitalize">
              {queueState}
            </div>
            {currentBarcode && (
              <div className="text-sm text-slate-600 mt-2">
                Running: <span className="font-bold">{currentBarcode}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title="Candidate Review" className="col-span-12">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`rounded-[22px] p-3 border ${
                n === 2
                  ? "border-pink-300 bg-pink-50"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="h-28 rounded-[18px] bg-white border border-slate-100 mb-3" />
              <div className="text-sm font-bold text-slate-900">Candidate {n}</div>
              <div className="text-xs text-slate-500">Score: {92 - n * 3}%</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="flex-1 rounded-full py-3 bg-emerald-500 text-white font-semibold inline-flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Keep best
          </button>
          <button className="flex-1 rounded-full py-3 bg-slate-900 text-white font-semibold inline-flex items-center justify-center gap-2">
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </Card>
    </div>
  );
}

function SettingsPage({ prompts, setPrompts, settings, saveSettings, setSettings }) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <Card title="Watch Prompt Settings" className="col-span-8">
        <div className="space-y-4">
          {shotTypes.map((shot) => (
            <div
              key={shot}
              className="rounded-[24px] border border-slate-100 p-4 bg-slate-50/60"
            >
              <label className="block text-sm font-black text-slate-950 capitalize mb-2">
                {shot} prompt
              </label>
              <textarea
                value={prompts[shot]}
                onChange={(e) =>
                  setPrompts((prev) => ({ ...prev, [shot]: e.target.value }))
                }
                className="w-full min-h-[110px] rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="col-span-4 space-y-6">
        <Card title="Generation Defaults">
          <div className="space-y-4">
            <div className="rounded-[22px] bg-sky-50 p-4">
              <label className="block text-sm font-bold text-sky-700">Model label</label>
              <input
                value={settings.modelLabel}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, modelLabel: e.target.value }))
                }
                className="w-full mt-2 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </div>

            <div className="rounded-[22px] bg-slate-50 p-4">
              <div className="text-sm text-slate-500 mb-2">Candidate count</div>
              <div className="flex rounded-full overflow-hidden border border-slate-200 w-fit">
                {[1].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSettings((prev) => ({ ...prev, candidateCount: n }))}
                    className={`px-4 py-2 text-sm font-semibold ${
                      settings.candidateCount === n
                        ? "bg-pink-400 text-white"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Filename contract</div>
              <div className="font-bold text-slate-900 mt-1">
                barcode_front.jpg / 258888511_raw_front.jpg
              </div>
            </div>
          </div>
        </Card>

        <Card title="Output Processing Settings">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[18px] bg-slate-50 p-4">
                <label className="block text-sm font-bold text-slate-700">Output Width</label>
                <input
                  type="number"
                  value={settings.outputWidth}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      outputWidth: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full mt-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="rounded-[18px] bg-slate-50 p-4">
                <label className="block text-sm font-bold text-slate-700">Output Height</label>
                <input
                  type="number"
                  value={settings.outputHeight}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      outputHeight: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full mt-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="rounded-[18px] bg-slate-50 p-4">
              <label className="block text-sm font-bold text-slate-700">Fit Mode</label>
              <select
                value={settings.fitMode}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, fitMode: e.target.value }))
                }
                className="w-full mt-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="contain">contain</option>
                <option value="cover">cover</option>
                <option value="fill">fill</option>
                <option value="inside">inside</option>
                <option value="outside">outside</option>
              </select>
            </div>

            <div className="rounded-[18px] bg-slate-50 p-4">
              <label className="block text-sm font-bold text-slate-700">Background Color</label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      backgroundColor: e.target.value,
                    }))
                  }
                  className="h-11 w-16 rounded border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      backgroundColor: e.target.value,
                    }))
                  }
                  className="flex-1 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="rounded-[18px] bg-slate-50 p-4">
              <label className="block text-sm font-bold text-slate-700">Gravity</label>
              <select
                value={settings.gravity}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, gravity: e.target.value }))
                }
                className="w-full mt-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="center">center</option>
                <option value="north">north</option>
                <option value="south">south</option>
                <option value="east">east</option>
                <option value="west">west</option>
                <option value="northeast">northeast</option>
                <option value="northwest">northwest</option>
                <option value="southeast">southeast</option>
                <option value="southwest">southwest</option>
              </select>
            </div>

            <div className="rounded-[18px] bg-slate-50 p-4">
              <label className="block text-sm font-bold text-slate-700">Sharpen</label>
              <select
                value={settings.sharpen}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, sharpen: e.target.value }))
                }
                className="w-full mt-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="off">off</option>
                <option value="light">light</option>
                <option value="medium">medium</option>
                <option value="strong">strong</option>
              </select>
            </div>

            <div className="rounded-[18px] bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-700">Upscale</div>
                <div className="text-xs text-slate-500 mt-1">Off by default</div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    upscaleEnabled: !prev.upscaleEnabled,
                  }))
                }
                className={`relative w-14 h-8 rounded-full transition ${
                  settings.upscaleEnabled ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                    settings.upscaleEnabled ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={saveSettings}
              className="w-full rounded-full py-4 bg-yellow-300 text-slate-950 font-semibold inline-flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save settings
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <Card title={title} className="min-h-[420px]">
      <div className="h-[320px] rounded-[28px] border border-dashed border-slate-200 bg-white/50 flex items-center justify-center text-slate-400 text-xl font-semibold">
        Coming soon
      </div>
    </Card>
  );
}

export default function App() {
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxTitle, setLightboxTitle] = useState("");
  const [page, setPage] = useState("watches");
  const [prompts, setPrompts] = useState(defaultPrompts);
  const [settings, setSettings] = useState({
  candidateCount: 1,
  modelLabel: "gemini-3.1-flash-image-preview",
  outputWidth: 1644,
  outputHeight: 2464,
  fitMode: "contain",
  backgroundColor: "#f1f1f1",
  gravity: "center",
  sharpen: "light",
  upscaleEnabled: false,
});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed.prompts) setPrompts(parsed.prompts);
      if (parsed.settings) setSettings(parsed.settings);
    } catch {
      console.warn("Failed to load local settings");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        prompts,
        settings,
      })
    );
  }, [prompts, settings]);

  function saveSettings() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        prompts,
        settings,
      })
    );
    window.alert("Settings saved locally");
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle at top left,rgba(241,255,255,.6),transparent 22%),linear-gradient(135deg,#f1f1f1,#ffffff 55%,#f1f1f1)] p-8">
      <div className="max-w-[1450px] mx-auto rounded-[42px] border border-white/70 bg-white/20 backdrop-blur-xl p-7 shadow-[0_25px_80px_rgba(54,96,152,0.15)]">
        <div className="flex gap-6">
          <Sidebar page={page} setPage={setPage} />

          <main className="flex-1 space-y-6">
            <TopBar />

          {page === "watches" && (
  <WatchesPage
    prompts={prompts}
    settings={settings}
    setSettings={setSettings}
    setLightboxImage={setLightboxImage}
    setLightboxTitle={setLightboxTitle}
  />
)}

            {page === "settings" && (
              <SettingsPage
                prompts={prompts}
                setPrompts={setPrompts}
                settings={settings}
                setSettings={setSettings}
                saveSettings={saveSettings}
              />
            )}

            {page === "sunglasses" && <PlaceholderPage title="Sunglasses" />}
            {page === "shoes" && <PlaceholderPage title="Shoes" />}
            {page === "dashboard" && <PlaceholderPage title="Dashboard" />}
            {page === "profile" && <PlaceholderPage title="Profile" />}
          </main>
        </div>
      </div>
      {lightboxImage && (
  <div
    className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-6"
    onClick={() => {
      setLightboxImage(null);
      setLightboxTitle("");
    }}
  >
    <div
      className="relative max-w-[90vw] max-h-[90vh] bg-white rounded-[24px] p-4 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="text-sm font-bold text-slate-900 break-all">
          {lightboxTitle}
        </div>
        <button
          onClick={() => {
            setLightboxImage(null);
            setLightboxTitle("");
          }}
          className="rounded-full px-3 py-1 bg-slate-100 text-slate-700 text-sm font-semibold"
        >
          Close
        </button>
      </div>

      <img
        src={lightboxImage}
        alt={lightboxTitle}
        className="max-w-[85vw] max-h-[80vh] object-contain rounded-[18px]"
      />
    </div>
  </div>
)}
    </div>
  );
}
