// client/src/services/api.js

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function generateImages(prompts) {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompts })
  });

  if (!response.ok) {
    throw new Error("Generation failed");
  }

  return response.json();
}