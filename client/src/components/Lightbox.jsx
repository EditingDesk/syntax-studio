import { Download, X } from "lucide-react";

export default function Lightbox({ image, onClose, onDownload }) {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full bg-white p-3 text-black shadow-lg hover:bg-slate-100"
      >
        <X size={22} />
      </button>

      {onDownload && (
        <button
          type="button"
          onClick={() => onDownload(image)}
          className="absolute right-20 top-5 rounded-full bg-white p-3 text-black shadow-lg hover:bg-slate-100"
          title="Download"
        >
          <Download size={22} />
        </button>
      )}

      <div className="max-h-[90vh] max-w-[90vw] rounded-2xl bg-[#F1F1F1] p-3">
        <img
          src={image.previewUrl}
          alt={image.shot || image.name || "Preview"}
          className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
        />
      </div>
    </div>
  );
}
