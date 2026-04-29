// client/src/services/api.js

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";

export async function generateImages(payload) {
  const formData = new FormData();

  formData.append("mode", payload.mode);
  formData.append("category", payload.category);
  formData.append("preset", payload.preset);
  formData.append("background", payload.background);
  formData.append("size", payload.size);
  formData.append("quality", payload.quality);
  formData.append("shots", JSON.stringify(payload.shots || []));

  payload.files.forEach((item) => {
    if (item.file) {
      formData.append("images", item.file, item.name);
    }
  });

  try {
    const res = await fetch(`${API_BASE}/api/generate`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Generate API error:", data);
      throw new Error(data.error || "Generation failed");
    }

    return data;
  } catch (error) {
    console.error("Generate API fetch failed:", error);
    throw new Error(
      `Unable to connect to the generation server. Make sure the backend is reachable at ${API_BASE}.`
    );
  }
}