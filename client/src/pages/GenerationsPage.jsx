import { useEffect, useState } from "react";
import { Download, Trash2, RefreshCw, Search } from "lucide-react";

export default function GenerationsPage() {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [retryingIds, setRetryingIds] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  const fetchImages = async (pageNum = 1, searchValue = search) => {
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/generations?page=${pageNum}&limit=50&search=${encodeURIComponent(
          searchValue || ""
        )}`
      );

      const data = await res.json();

      if (data.success) {
        setImages((prev) =>
          pageNum === 1 ? data.items : [...prev, ...data.items]
        );
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchImages(1);
  }, []);

  const refreshImages = () => {
    setPage(1);
    fetchImages(1);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchImages(next);
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelected(images.map((img) => img.id));
  };

  const clearSelection = () => {
    setSelected([]);
  };

  const closeSelectionMode = () => {
    setSelectionMode(false);
    setSelected([]);
  };

  const getSelectedProductIds = () => {
    const selectedItems = images.filter((img) => selected.includes(img.id));
    return [...new Set(selectedItems.map((item) => item.productId).filter(Boolean))];
  };

  const downloadImage = async (url, fileName) => {
    const res = await fetch(url);
    const blob = await res.blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName || "image.jpg";
    link.click();

    URL.revokeObjectURL(link.href);
  };

  const downloadSelected = async () => {
    if (!selected.length) return;

    const res = await fetch(`${API_BASE}/api/download/download-selected`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetIds: selected }),
    });

    const data = await res.json();

    if (data.success) {
      window.open(data.url, "_blank");
    }
  };

  const deleteSelected = async () => {
    if (!selected.length) {
      setNotice({
        type: "error",
        message: "Please select images first.",
      });
      return;
    }

    setConfirmDelete(true);
    return;
  };

  const handleDeleteConfirmed = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/generations/delete-selected`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assetIds: selected }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }

      setImages((prev) => prev.filter((img) => !selected.includes(img.id)));
      setSelected([]);
      setSelectionMode(false);

      setNotice({
        type: "success",
        message: `${data.deletedCount} image(s) deleted.`,
      });
    } catch (err) {
      setNotice({
        type: "error",
        message: err.message || "Delete failed",
      });
    } finally {
      setConfirmDelete(false);
    }
  };

  const retryProduct = async (productId) => {
    if (!productId) return;

    setRetryingIds((prev) =>
      prev.includes(productId) ? prev : [...prev, productId]
    );

    setProgressMap((prev) => ({ ...prev, [productId]: 20 }));

    const timer = setInterval(() => {
      setProgressMap((prev) => ({
        ...prev,
        [productId]: Math.min((prev[productId] || 20) + 15, 85),
      }));
    }, 700);

    try {
      const res = await fetch(`${API_BASE}/api/jobs/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: [productId] }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Retry failed");

      setProgressMap((prev) => ({ ...prev, [productId]: 100 }));
      setPage(1);
      await fetchImages(1);
    } catch (err) {
      alert(err.message);
    } finally {
      clearInterval(timer);

      setRetryingIds((prev) => prev.filter((id) => id !== productId));

      setProgressMap((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }
  };

  const retrySelected = async () => {
    const productIds = getSelectedProductIds();
    if (!productIds.length) return;

    for (const productId of productIds) {
      await retryProduct(productId);
    }

    setSelected([]);
    setSelectionMode(false);
  };

  return (
    <div className="space-y-5 p-4">
      {/* TITLE */}
      <div>
        <h1 className="text-xl font-bold text-black">Generations</h1>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex w-64 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <Search size={15} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  fetchImages(1, search);
                }
              }}
              placeholder="Search UPC"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <button className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">
            Type
          </button>

          <button className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">
            Tags
          </button>

          <button className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">
            Date
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshImages}
            className="rounded-xl bg-gray-100 p-2 text-gray-700 hover:bg-gray-200"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>

          {!selectionMode ? (
            <button
              onClick={() => setSelectionMode(true)}
              className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-800 hover:bg-gray-200"
            >
              Select
            </button>
          ) : (
            <>
              <span className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">
                {selected.length} selected
              </span>

              <button
                onClick={selectAll}
                className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-800 hover:bg-gray-200"
              >
                Select All
              </button>

              <button
                onClick={clearSelection}
                className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-800 hover:bg-gray-200"
              >
                Clear
              </button>

              <button
                onClick={downloadSelected}
                disabled={!selected.length}
                className="flex items-center gap-2 rounded-xl bg-[#ecfee8] px-4 py-2 text-xs font-bold text-black hover:bg-[#d9fbd1] disabled:opacity-40"
              >
                <Download size={14} />
                {selected.length}/50
              </button>

              <button
                onClick={deleteSelected}
                disabled={!selected.length}
                className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>

              <button
                onClick={closeSelectionMode}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-800 hover:bg-gray-200"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            notice.type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {notice.message}
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {images.map((img) => (
          <div
            key={img.id}
            className={`group relative overflow-hidden rounded-2xl border bg-white transition ${
  selected.includes(img.id)
    ? "ring-2 ring-black opacity-80"
    : "hover:shadow-md"
}`}
          >
            <img
              src={img.url}
              alt=""
              className="aspect-[2/3] w-full cursor-pointer object-cover"
              onClick={() => {
                if (selectionMode) {
                  toggleSelect(img.id);
                } else {
                  setLightboxImage(img);
                }
              }}
            />

            {/* CHECKBOX */}
            {selectionMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(img.id);
                }}
                className={`absolute left-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded border text-xs ${
                  selected.includes(img.id)
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-transparent"
                }`}
              >
                ✓
              </button>
            )}
            className={`... ${
              selectionMode ? "cursor-pointer hover:opacity-80" : ""
              
            }`}


            {/* RETRY PROGRESS */}
            {retryingIds.includes(img.productId) && (
              <div className="absolute left-2 top-2 z-10">
                <span className="rounded-full bg-black/80 px-2 py-1 text-[11px] font-semibold text-white">
                  {progressMap[img.productId] || 25}%
                </span>
              </div>
            )}

            {/* HOVER ACTIONS */}
            {!selectionMode && !retryingIds.includes(img.productId) && (
              <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                {img.productId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      retryProduct(img.productId);
                    }}
                    className="rounded-lg bg-yellow-500 px-2 py-1 text-[11px] font-bold text-white hover:bg-yellow-600"
                  >
                    Retry
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(img.url, img.fileName);
                  }}
                  className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-black shadow hover:bg-gray-100"
                >
                  ↓
                </button>
              </div>
            )}

            {/* BOTTOM LABEL */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-2 py-1 text-[11px] text-white">
              {img.upc ? `${img.upc} • ` : ""}
              {img.shot}
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY */}
      {!loading && images.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
          No generations found.
        </div>
      )}

      {/* LOAD MORE */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {/* TITLE */}
            <h2 className="text-lg font-semibold text-gray-900">
              Delete Images
            </h2>

            {/* MESSAGE */}
            <p className="mt-2 text-sm text-gray-600">
              Delete {selected.length} selected image(s)?
            </p>

            {/* ACTIONS */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteConfirmed}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-h-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -right-3 -top-3 rounded-full bg-white px-3 py-1 text-sm font-bold text-black shadow"
            >
              ×
            </button>

            <img
              src={lightboxImage.url}
              alt=""
              className="max-h-[85vh] max-w-full rounded-2xl object-contain"
            />

            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="max-w-[60%] truncate text-xs text-white/70">
                {lightboxImage.fileName}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    downloadImage(lightboxImage.url, lightboxImage.fileName)
                  }
                  className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-gray-200"
                >
                  Download
                </button>

                {lightboxImage.productId && (
                  <button
                    onClick={() => retryProduct(lightboxImage.productId)}
                    className="rounded-xl bg-yellow-500 px-4 py-2 text-xs font-bold text-white hover:bg-yellow-600"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
