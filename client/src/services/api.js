// client/src/services/api.js

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";

if (!API_BASE) {
  throw new Error("Missing VITE_API_BASE_URL. Check Railway environment variables.");
}

console.log("API_BASE:", API_BASE);

export async function generateImages(payload) {
  if (!payload) {
    throw new Error("Missing generation payload");
  }

  const formData = new FormData();

  formData.append("mode", payload.mode || "");
  formData.append("category", payload.category || "");
  formData.append("preset", payload.preset || "");
  formData.append("background", payload.background || "");
  formData.append("size", payload.size || "");
  formData.append("quality", payload.quality || "");
  formData.append("shots", JSON.stringify(payload.shots || []));

  (payload.files || []).forEach((item) => {
    if (item?.file) {
      formData.append("images", item.file, item.name || item.file.name);
    }
  });

  try {
    const res = await fetch(`${API_BASE}/api/generate`, {
      method: "POST",
      body: formData,
    });

    let data = null;

    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      console.error("Generate API error:", data);
      throw new Error(data.error || `Generation failed with status ${res.status}`);
    }

    return data;
  } catch (error) {
    console.error("Generate API fetch failed:", error);

    throw new Error(
      `Unable to connect to the generation server. Backend URL used: ${API_BASE}`
    );
  }
}

export async function getGenerations(days = 7) {
  const res = await fetch(`${API_BASE}/api/generations?days=${days}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to load generations");
  }

  return {
    ...data,
    images: data.images.map((img) => ({
      ...img,
      url: img.url.startsWith("http") ? img.url : `${API_BASE}${img.url}`,
    })),
  };
}
