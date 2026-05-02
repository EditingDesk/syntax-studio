// client/src/pages/GeneratorPage.jsx

import { useRef, useState, useEffect } from "react";
import { categoryTemplates } from "../config/categoryTemplates";
import { buildPrompt } from "../services/promptBuilder";
import { generateImages } from "../services/api";

export default function GeneratorPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const progressTimerRef = useRef(null);

  // =========================
  // CLEANUP (important)
  // =========================
  useEffect(() => {
    return () => {
      clearInterval(progressTimerRef.current);
    };
  }, []);

  // =========================
  // PROGRESS HANDLERS
  // =========================

  const startProgress = () => {
    setProgress(5);

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 5;
      });
    }, 800);
  };

  const finishProgress = () => {
    clearInterval(progressTimerRef.current);
    setProgress(100);

    setTimeout(() => {
      setProgress(0);
    }, 1200);
  };

  const failProgress = () => {
    clearInterval(progressTimerRef.current);
    setProgress(0);
  };

  // =========================
  // GENERATE FUNCTION
  // =========================

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    startProgress();

    try {
      const template = categoryTemplates.watch.front;

      const prompt = buildPrompt(
        template,
        "clean background, premium look"
      );

      const data = await generateImages([prompt]);

      console.log("Generation Result:", data);

      setResult(data);
      finishProgress();

    } catch (err) {
      console.error("Generation failed:", err);

      setError(err.message || "Generation failed");
      failProgress();

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="p-10 max-w-xl">
      <h1 className="text-xl mb-4">Generator Page</h1>

      {/* GENERATE BUTTON */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-black text-white px-4 py-3 rounded disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Images"}
      </button>

      {/* PROGRESS BAR */}
      {loading && (
        <div className="w-full mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Generating images</span>
            <span>{progress}%</span>
          </div>

          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ERROR + RETRY */}
      {error && (
        <div className="mt-4 p-4 border border-red-300 bg-red-50 rounded">
          <p className="text-sm text-red-600">{error}</p>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-3 w-full bg-black text-white py-2 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <pre className="mt-6 bg-gray-100 text-black p-4 rounded whitespace-pre-wrap text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}