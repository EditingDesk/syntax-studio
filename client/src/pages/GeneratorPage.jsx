// client/src/pages/GeneratorPage.jsx

import { useState } from "react";
import { categoryTemplates } from "../config/categoryTemplates";
import { buildPrompt } from "../services/promptBuilder";
import { generateImages } from "../services/api";

export default function GeneratorPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setResult(null);

      const template = categoryTemplates.watch.front;

      const prompt = buildPrompt(
        template,
        "clean background, premium look"
      );

      const data = await generateImages([prompt]);

      console.log("Generation Result:", data);
      setResult(data);
    } catch (error) {
      console.error("Generation failed:", error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

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

      {result && (
        <pre className="mt-6 bg-gray-100 text-black p-4 rounded whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}