// client/src/services/api.js

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "API request failed");
  }

  return data;
}

export async function generateImages(payload) {
  const formData = new FormData();

  formData.append("mode", payload.mode || "generate");
  formData.append("category", payload.category || "");
  formData.append("preset", payload.preset || "");
  formData.append("background", payload.background || "");
  formData.append("size", payload.size || "");
  formData.append("quality", payload.quality || "");
  formData.append("shots", JSON.stringify(payload.shots || []));

  (payload.files || []).forEach((item) => {
    if (item.file) {
      formData.append("images", item.file, item.name || item.file.name);
    }
  });

  return request("/api/generate", {
    method: "POST",
    body: formData,
  });
}

export async function getProducts() {
  return request("/api/products");
}