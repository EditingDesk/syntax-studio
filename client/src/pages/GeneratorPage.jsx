import { categoryTemplates } from "../config/categoryTemplates";
import { buildPrompt } from "../services/promptBuilder";

export default function GeneratorPage() {
  const handleGenerate = () => {
    const template = categoryTemplates.watch.front;

    const prompt = buildPrompt(
      template,
      "clean background, premium look"
    );

    console.log("Generated Prompt:", prompt);

    // next step → send to backend
  };

  return (
    <div className="p-10">
      <h1 className="text-xl mb-4">Generator Page</h1>

      <button
        onClick={handleGenerate}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Generate
      </button>
    </div>
  );
}