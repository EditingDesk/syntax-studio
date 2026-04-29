// client/src/pages/ProductsPage.jsx
import Lightbox from "../components/Lightbox";
import { useEffect, useMemo, useState } from "react";
import {
  UploadCloud,
  Shirt,
  Sparkles,
  X,
  Plus,
  Check,
  ChevronDown,
  Settings,
  User,
  Search,
  MoreVertical,
  Box,
} from "lucide-react";
import { categoryTemplates } from "../config/categoryTemplates";

const recentGenerations = [
  { title: "Watch · Premium Clean", count: "5 Images", date: "Today", time: "Now" },
  { title: "T-Shirt · E-commerce Clean", count: "12 Images", date: "May 24, 2025", time: "10:24 AM" },
  { title: "Sneaker · Lifestyle", count: "8 Images", date: "May 24, 2025", time: "09:15 AM" },
  { title: "Bag · Studio Light", count: "10 Images", date: "May 23, 2025", time: "03:30 PM" },
];

const PROMPT_STORAGE_KEY = "syntax_prompt_settings";

const FALLBACK_WATCH_PROMPTS = {
  front: "Create a premium ecommerce FRONT watch image. Preserve all product details exactly.",
  angle: "Create a premium ecommerce ANGLE watch image. Preserve all product details exactly.",
  side: "Create a premium ecommerce SIDE watch image. Preserve all product details exactly.",
  back: "Create a premium ecommerce BACK watch image. Preserve all product details exactly.",
  box: "Create a premium ecommerce BOX/package image. Preserve all product details exactly.",
};

function detectWatchShotFromFileName(fileName = "") {
  const name = fileName.toLowerCase();

  if (name.includes("front")) return "front";
  if (name.includes("angle")) return "angle";
  if (name.includes("side")) return "side";
  if (name.includes("back")) return "back";
  if (name.includes("box")) return "box";

  return "front";
}

function getWatchPromptForFile(fileName) {
  const shot = detectWatchShotFromFileName(fileName);

  try {
    const saved = JSON.parse(localStorage.getItem(PROMPT_STORAGE_KEY) || "{}");
    return saved?.watches?.[shot] || FALLBACK_WATCH_PROMPTS[shot];
  } catch {
    return FALLBACK_WATCH_PROMPTS[shot];
  }
}

function autoDetectWatchShot(fileName = "") {
  const name = fileName.toLowerCase();

  if (name.includes("front")) return "front";
  if (name.includes("angle")) return "angle";
  if (name.includes("side")) return "side";
  if (name.includes("back")) return "back";
  if (name.includes("box")) return "box";

  return "front";
}

export default function ProductsPage() {
  const templates = useMemo(() => categoryTemplates || {}, []);
  const categoryKeys = Object.keys(templates);

  const defaultCategory = categoryKeys.includes("watch")
    ? "watch"
    : categoryKeys[0] || "";

  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [mode, setMode] = useState("enhance_uploaded_shots");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [background, setBackground] = useState("lightgray");
  const [size, setSize] = useState("1600x1600");
  const [selectedQuality, setSelectedQuality] = useState("High");
  const [selectedShots, setSelectedShots] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [generating, setGenerating] = useState(false);

  const [files, setFiles] = useState([]);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [processingOptions, setProcessingOptions] = useState({
    removeBg: true,
    enhance: true,
    sharpen: true,
    upscale: true,
  });
  const API_BASE = "http://localhost:3001";

  const downloadImage = async (img) => {
    try {
      const fileUrl = `${API_BASE}${img.url}`;

      const response = await fetch(fileUrl, {
        method: "GET",
        mode: "cors",
      });

      if (!response.ok && response.status !== 304) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = img.fileName || `${img.shot}.jpg`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Check backend CORS/static output settings.");
    }
  };

  const downloadAllImages = () => {
    if (!currentBatchId) {
      alert("No batch found to download.");
      return;
    }

    window.location.href = `${API_BASE}/api/download-all/${currentBatchId}`;
  };

  const template = templates[selectedCategory] || {};
  const safeTemplateName = template.name || selectedCategory || "Product";

  const subCategories = template.subCategories || [];
  const presets = template.presets || [];
  const backgrounds = ["white", "lightgray", "custom"];
  const sizes = template.sizes || [];
  const qualities = template.qualities || [];
  const expectedShots = template.expectedShots || [];

  useEffect(() => {
    const currentTemplate = templates[selectedCategory];

    if (!currentTemplate) return;

    setMode(currentTemplate.defaultMode || "enhance_uploaded_shots");
    setSelectedSubCategory(currentTemplate.subCategories?.[0] || "");
    setSelectedPreset(currentTemplate.presets?.[0] || "");
    setBackground("lightgray");
    setSize(currentTemplate.sizes?.[0]?.value || currentTemplate.sizes?.[0] || "");
    setSelectedQuality(currentTemplate.qualities?.[0] || "High");
    setSelectedShots(currentTemplate.defaultShots || []);
    setGeneratedImages([]);
  }, [selectedCategory, templates]);

  useEffect(() => {
    return () => {
      files.forEach((img) => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  const outputCount =
    mode === "enhance_uploaded_shots"
      ? files.length
      : files.length * selectedShots.length;

  const creditsRequired = outputCount * 2;

  const categorySummary =
    selectedCategory === "watch"
      ? safeTemplateName
      : `${safeTemplateName} › ${selectedSubCategory}`;

  const handleFiles = (event) => {
    const uploaded = Array.from(event.target.files || []).map((file) => ({
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
      shot: autoDetectWatchShot(file.name),
    }));

    setFiles(uploaded);
    setGeneratedImages([]);
  };

  const toggleShot = (shotId) => {
    setSelectedShots((prev) =>
      prev.includes(shotId)
        ? prev.filter((id) => id !== shotId)
        : [...prev, shotId]
    );
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setGeneratedImages([]);
  };

  const clearFiles = () => {
    setFiles([]);
    setGeneratedImages([]);
  };

  const handleGenerate = async () => {
    try {
      if (files.length === 0) {
        alert("Please upload at least one product image.");
        return;
      }

      if (mode === "generate_new_shots" && selectedShots.length === 0) {
        alert("Please select at least one shot.");
        return;
      }

      setGenerating(true);
      setGeneratedImages([]);

      const formData = new FormData();
      formData.append("mode", mode);
      formData.append("category", selectedCategory);
      formData.append("preset", selectedPreset);
      formData.append("background", background);
      formData.append("size", size);
      formData.append("quality", selectedQuality);
      formData.append("shots", JSON.stringify(selectedShots || []));
      formData.append("processing", JSON.stringify(processingOptions));

      const uploadedImages = files;
      uploadedImages.forEach((img) => {
        formData.append("images", img.file);
        formData.append("prompts", getWatchPromptForFile(img.name));
      });

      console.log("Sending formData with uploaded images and prompts");

      const response = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      console.log("RESULT:", result);

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Generation failed");
      }

      setCurrentBatchId(result.batchId);
      setGeneratedImages(result.results || []);
    } catch (err) {
      console.error(err);
      alert(err.message || "Generation failed. Check backend terminal.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-black">Products</h1>
        <p className="mt-1 text-base text-slate-500">
          Generate studio-quality images for your products with AI
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4">
          {[
            ["1", "Setup", "Choose your product & settings"],
            ["2", "Upload", "Add your product images"],
            ["3", "Generate", "AI is creating your images"],
            ["4", "Review", "Download or refine results"],
          ].map((step, index) => (
            <div
              key={step[0]}
              className={`flex items-center gap-4 p-5 ${
                index === 0 ? "bg-gradient-to-r from-[#ecfee8] to-white" : ""
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full border text-lg font-bold ${
                  index === 0
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {step[0]}
              </div>

              <div>
                <p className="font-bold text-black">{step[1]}</p>
                <p className="text-sm text-slate-500">{step[2]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_1fr_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <SelectBox
              label="Category"
              value={templates[selectedCategory]?.name || selectedCategory}
              icon={<Shirt size={20} />}
              options={categoryKeys}
              getLabel={(key) => templates[key]?.name || key}
              onSelect={(key) => setSelectedCategory(key)}
            />

            <div>
              <p className="mb-2 text-sm font-bold text-black">Generation Mode</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("enhance_uploaded_shots")}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${
                    mode === "enhance_uploaded_shots"
                      ? "border-green-500 bg-[#ecfee8]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  Enhance Uploaded Shots
                  <span className="block text-xs font-normal text-slate-500">
                    5 uploads → 5 outputs
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("generate_new_shots")}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${
                    mode === "generate_new_shots"
                      ? "border-green-500 bg-[#ecfee8]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  Generate New Shots
                  <span className="block text-xs font-normal text-slate-500">
                    1 upload × selected shots
                  </span>
                </button>
              </div>
            </div>

            {selectedCategory !== "watch" && (
              <SelectBox
                label="Sub Category"
                value={selectedSubCategory}
                options={subCategories}
                onSelect={setSelectedSubCategory}
              />
            )}

            <SelectBox
              label="Style / Preset"
              value={selectedPreset}
              subtitle="Clean, bright & professional look"
              icon={<Sparkles size={20} />}
              options={presets}
              green
              onSelect={setSelectedPreset}
            />

            <div>
              <p className="mb-2 text-sm font-bold text-black">Background</p>

              <div className="grid grid-cols-3 gap-3">
                {backgrounds.map((bg) => {
                      const isSelected = background === bg;

                      return (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setBackground(bg)}
                          className={`relative flex h-24 flex-col items-center justify-center rounded-xl border text-xs font-semibold ${
                            isSelected
                              ? "border-green-500 bg-[#ecfee8]"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                              <Check size={13} />
                            </span>
                          )}

                          {bg === "white" && (
                            <div className="mb-2 h-8 w-8 rounded-md border bg-white" />
                          )}

                          {bg === "lightgray" && (
                            <div className="mb-2 h-8 w-8 rounded-md bg-slate-300" />
                          )}

                          {bg === "custom" && (
                            <Plus className="mb-2 text-green-500" size={24} />
                          )}

                          {bg === "white" && "White"}
                          {bg === "lightgray" && "Light Gray"}
                          {bg === "custom" && "Custom"}
                        </button>
                      );
                    })}
              </div>
            </div>

            <SelectBox
              label="Image Size"
              value={
                sizes.find((option) => option.value === size)?.label || size
              }
              options={sizes}
              getLabel={(option) => option.label || option}
              onSelect={(option) => setSize(option.value || option)}
            />

            <SelectBox
              label="Quality"
              value={selectedQuality}
              options={qualities}
              onSelect={setSelectedQuality}
            />
<div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
  <h3 className="mb-3 text-sm font-black text-black">
    Additional Options
  </h3>

  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Remove Background</span>
      <input
        type="checkbox"
        checked={processingOptions.removeBg}
        onChange={(e) =>
          setProcessingOptions({
            ...processingOptions,
            removeBg: e.target.checked,
          })
        }
      />
    </div>

    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Auto Enhance</span>
      <input
        type="checkbox"
        checked={processingOptions.enhance}
        onChange={(e) =>
          setProcessingOptions({
            ...processingOptions,
            enhance: e.target.checked,
          })
        }
      />
    </div>

    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Sharpen</span>
      <input
        type="checkbox"
        checked={processingOptions.sharpen}
        onChange={(e) =>
          setProcessingOptions({
            ...processingOptions,
            sharpen: e.target.checked,
          })
        }
      />
    </div>

    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Upscale</span>
      <input
        type="checkbox"
        checked={processingOptions.upscale}
        onChange={(e) =>
          setProcessingOptions({
            ...processingOptions,
            upscale: e.target.checked,
          })
        }
      />
    </div>
  </div>
</div>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <Settings size={17} />
                Advanced Settings
              </span>
              <ChevronDown size={17} className="-rotate-90" />
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <label className="flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm hover:bg-slate-50">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ecfee8] text-green-600">
              <UploadCloud size={32} />
            </div>

            <p className="mt-4 text-lg font-bold text-black">
              Drag & drop your product images here
            </p>

            <p className="mt-1 text-lg font-bold text-green-600">
              or browse files
            </p>

            <p className="mt-3 text-sm text-slate-500">
              JPG, PNG, WEBP (Max 20MB each)
            </p>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFiles}
              className="hidden"
            />
          </label>

          {files.length > 0 && (
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-black">
                  Uploaded Images ({files.length})
                </h2>

                <button
                  type="button"
                  onClick={clearFiles}
                  className="text-sm font-bold text-red-500 hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute right-3 top-3 z-10 rounded-full bg-white px-2 py-1 text-xs font-bold shadow"
                    >
                      ✕
                    </button>

                    <div
                      onClick={() =>
                        setLightboxImage({
                          ...file,
                          type: "uploaded",
                          previewUrl: file.preview || file.url,
                        })
                      }
                      className="aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-xl bg-slate-100"
                    >
                      <img
                        src={URL.createObjectURL(file.file)}
                        alt={file.name}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <p className="mt-2 truncate text-xs font-medium text-slate-600">
                      {file.name}
                    </p>

                    <select
                      value={file.shot}
                      onChange={(e) => {
                        const updated = [...files];
                        updated[index].shot = e.target.value;
                        setFiles(updated);
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold"
                    >
                      <option value="front">Front</option>
                      <option value="angle">Angle</option>
                      <option value="side">Side</option>
                      <option value="back">Back</option>
                      <option value="box">Box</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-3 font-bold text-black">
              {mode === "enhance_uploaded_shots"
                ? "Expected Uploaded Shot Names"
                : "Select Shots to Generate"}
            </p>

            <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
              {expectedShots.map((shot) => {
                const active =
                  mode === "enhance_uploaded_shots"
                    ? true
                    : selectedShots.includes(shot.id);

                return (
                  <button
                    key={shot.id}
                    type="button"
                    onClick={() =>
                      mode === "generate_new_shots" && toggleShot(shot.id)
                    }
                    className={`relative rounded-xl border p-4 text-center ${
                      active
                        ? "border-green-500 bg-[#ecfee8]"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                        <Check size={13} />
                      </span>
                    )}

                    {shot.id === "model" ? (
                      <User size={24} className="mx-auto mb-2" />
                    ) : shot.id === "detail" ? (
                      <Search size={24} className="mx-auto mb-2" />
                    ) : shot.id === "box" ? (
                      <Box size={24} className="mx-auto mb-2" />
                    ) : (
                      <Shirt size={24} className="mx-auto mb-2" />
                    )}

                    <p className="text-sm font-semibold">{shot.label}</p>
                  </button>
                );
              })}
            </div>

            {mode === "enhance_uploaded_shots" && (
              <p className="mt-2 text-xs text-slate-500">
                Upload files named like barcode_front, barcode_angle, barcode_side,
                barcode_back, barcode_box. Each uploaded image creates one output.
              </p>
            )}
          </div>

        

          {generating && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="font-bold text-black">Generating images...</p>
              <p className="mt-1 text-sm text-slate-500">
                Please wait. Gemini is processing your uploaded images.
              </p>
            </div>
          )}

          {generatedImages.length > 0 && (
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-black">
                  Generated Images
                </h2>

                <button
                  type="button"
                  onClick={downloadAllImages}
                  className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Download All
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {generatedImages.map((img) => (
                  <div
                    key={img.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div
                      onClick={() =>
                        setLightboxImage({
                          ...img,
                          type: "generated",
                          previewUrl: `http://localhost:3001${img.url}`,
                        })
                      }
                      className="aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-xl bg-[#F1F1F1]"
                    >
                      <img
                        src={`http://localhost:3001${img.url}`}
                        alt={img.shot}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold capitalize text-black">
                        {img.shot}
                      </p>

                      <button
                        type="button"
                        onClick={() => downloadImage(img)}
                        className="rounded-lg bg-black px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-xl font-bold text-black">
            Generation Summary
          </h3>

          <div className="space-y-4">
              <SummaryRow label="Category" value="Watch" />
              <SummaryRow label="Mode" value="Enhance Uploaded" />
              <SummaryRow label="Uploaded" value={`${files.length} Images`} />
              <SummaryRow label="Output" value={`${files.length} Images`} />

              <SummaryRow
                label="Background"
                value={
                  background === "white"
                    ? "White"
                    : background === "lightgray"
                    ? "Light Gray"
                    : "Custom"
                }
              />

              <SummaryRow label="Size" value={size} />
              <SummaryRow label="Estimated Time" value="~ 2-3 minutes" />

              <SummaryRow
                label="Credits Required"
                value={`${files.length * 2} Credits`}
                highlight
              />
        </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className={`mt-6 flex w-full items-center justify-center gap-3 rounded-xl px-5 py-4 text-lg font-bold text-white ${
              generating
                ? "cursor-not-allowed bg-slate-400"
                : "bg-black hover:bg-slate-800"
            }`}
          >
            <Sparkles size={22} />
            {generating ? "Generating..." : "Generate Images"}
          </button>

          <div className="mb-3 mt-3 flex flex-wrap gap-2">
  {processingOptions.enhance && (
    <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
      ✓ Enhance
    </span>
  )}

  {processingOptions.sharpen && (
    <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
      ✓ Sharpen
    </span>
  )}

  {processingOptions.upscale && (
    <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
      ✓ Upscale
    </span>
  )}
</div>

          <div className="mt-5 rounded-xl border border-green-200 bg-[#ecfee8] p-4 text-center text-sm font-bold text-green-700">
            {mode === "enhance_uploaded_shots" ? (
              <>
                Your {files.length} uploaded images will generate {outputCount} images
                <br />
                (1 output per uploaded image)
              </>
            ) : (
              <>
                Your {files.length} images will generate {outputCount} images
                <br />({selectedShots.length} shots × {files.length} images)
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-black">Recent Generations</h3>

          <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {recentGenerations.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="mb-3 flex h-20 items-center gap-1 overflow-hidden rounded-lg bg-slate-100">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="flex h-full flex-1 items-center justify-center bg-slate-200"
                  >
                    <Shirt size={24} />
                  </div>
                ))}
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-black">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.count} · {item.date} · {item.time}
                  </p>
                </div>

                <MoreVertical size={18} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Lightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
        onDownload={lightboxImage?.type === "generated" ? downloadImage : null}
      />
    </div>
  );
}

function SelectBox({
  label,
  value,
  subtitle,
  icon,
  options = [],
  getLabel = (option) => option,
  onSelect,
  green = false,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <p className="mb-2 text-sm font-bold text-black">{label}</p>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
          green ? "border-green-300 bg-[#ecfee8]" : "border-slate-200 bg-white"
        }`}
      >
        <span className="flex items-center gap-3">
          {icon && <span className="text-slate-600">{icon}</span>}

          <span>
            <span className="block text-sm font-bold text-black">{value}</span>
            {subtitle && (
              <span className="block text-xs text-slate-500">{subtitle}</span>
            )}
          </span>
        </span>

        <ChevronDown size={18} />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {options.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => {
                onSelect(option);
                setOpen(false);
              }}
              className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-50"
            >
              {getLabel(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Toggle({ label, enabled }) {
  const [active, setActive] = useState(enabled);

  return (
    <button
      type="button"
      onClick={() => setActive((prev) => !prev)}
      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
    >
      {label}

      <span
        className={`flex h-6 w-11 items-center rounded-full p-1 ${
          active ? "bg-green-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition ${
            active ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function SummaryRow({ label, value, green, highlight }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-slate-500">{label}</p>

      <p
        className={`text-sm font-bold ${
          green || highlight ? "text-green-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
