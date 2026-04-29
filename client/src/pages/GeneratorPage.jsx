// client/src/pages/GeneratorPage.jsx

import { useRef, useState } from "react";
import { categoryTemplates } from "../config/categoryTemplates";
import { buildPrompt } from "../services/promptBuilder";
import { generateImages } from "../services/api";

export default function GeneratorPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const progressTimerRef = useRef(null);

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
    try {
      setLoading(true);
      setResult(null);

      // 🔥 START PROGRESS HERE
      startProgress();

      const template = categoryTemplates.watch.front;

      const prompt = buildPrompt(
        template,
        "clean background, premium look"
      );

      const data = await generateImages([prompt]);

      console.log("Generation Result:", data);

      setResult(data);

      // 🔥 FINISH PROGRESS HERE
      finishProgress();
    } catch (error) {
      console.error("Generation failed:", error);
      setResult({ error: error.message });

      // 🔥 HANDLE FAIL
      failProgress();
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="p-10">
      <h1 className="text-xl mb-4">Generator Page</h1>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {/* 🔥 PROGRESS BAR */}
      {loading && (
        <div className="w-full mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Generating...</span>
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

      {/* RESULT */}
      {result && (
        <pre className="mt-6 bg-gray-100 text-black p-4 rounded whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}