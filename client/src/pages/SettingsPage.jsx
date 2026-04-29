import { useEffect, useState } from "react";

const STORAGE_KEY = "syntax_prompt_settings";

const DEFAULT_PROMPTS = {
  watches: {
    front: `Create a premium ecommerce FRONT watch image.
Preserve dial, logo, text, numbers, hands, strap, metal, color and proportions exactly.
Improve only background, lighting, centering, dust cleanup and ecommerce presentation.`,

    angle: `Create a premium ecommerce ANGLE watch image.
Keep the exact watch design, dial, logo, strap, metal, color and proportions.
Show a clean angled product view with realistic lighting and soft shadow.`,

    side: `Create a premium ecommerce SIDE watch image.
Preserve the exact side profile, crown, case thickness, strap shape, metal, engravings and details.
Improve only background, lighting and product clarity.`,

    back: `Create a premium ecommerce BACK watch image.
Preserve back case, engravings, strap, clasp, metal color, texture and product proportions exactly.
Do not invent any missing text or details.`,

    box: `Create a premium ecommerce BOX/package image.
Preserve box shape, logo, material, texture, color and proportions exactly.
Improve only background, lighting, centering and dust cleanup.`,
  },

  clothing: {
    front: `Create a premium ecommerce FRONT clothing image.
Preserve garment shape, color, fabric, stitching, print, logo and proportions exactly.`,

    back: `Create a premium ecommerce BACK clothing image.
Preserve garment shape, color, fabric, stitching, print, logo and proportions exactly.`,

    detail: `Create a premium ecommerce DETAIL clothing image.
Focus on fabric texture, stitching, print, logo, button, zipper or material detail without changing the product.`,

    model: `Create a premium ecommerce model image wearing the uploaded clothing.
Preserve garment color, shape, print, logo, fabric and proportions exactly.`,
  },
};

const SETTINGS_MENU = [
  { id: "prompts", label: "Manage Prompts" },
  { id: "output", label: "Output Settings", disabled: true },
  { id: "processing", label: "Image Processing", disabled: true },
  { id: "ai", label: "AI Model Settings", disabled: true },
  { id: "storage", label: "Storage Settings", disabled: true },
];

export default function SettingsPage() {
  const [activeMenu, setActiveMenu] = useState("prompts");
  const [activeCategory, setActiveCategory] = useState("watches");
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        setPrompts({
          watches: {
            ...DEFAULT_PROMPTS.watches,
            ...(parsed.watches || {}),
          },
          clothing: {
            ...DEFAULT_PROMPTS.clothing,
            ...(parsed.clothing || {}),
          },
        });
      } catch {
        setPrompts(DEFAULT_PROMPTS);
      }
    }
  }, []);

  const updatePrompt = (category, shot, value) => {
    setPrompts((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [shot]: value,
      },
    }));
  };

  const savePrompts = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    alert("Prompt settings saved.");
  };

  const resetCategory = () => {
    const updated = {
      ...prompts,
      [activeCategory]: DEFAULT_PROMPTS[activeCategory],
    };

    setPrompts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const activePromptGroup = prompts[activeCategory] || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-black">Settings</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage reusable system settings for generation, prompts, output and processing.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 px-3 text-sm font-black uppercase tracking-wide text-slate-400">
              Settings Menu
            </h2>

            <div className="space-y-2">
              {SETTINGS_MENU.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-bold ${
                    activeMenu === item.id
                      ? "bg-black text-white"
                      : item.disabled
                        ? "cursor-not-allowed bg-slate-50 text-slate-300"
                        : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                  {item.disabled && (
                    <span className="ml-2 text-xs font-medium">
                      Soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {activeMenu === "prompts" && (
              <>
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-2xl font-black text-black">
                      Manage Prompts
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Shot-specific prompts. Do not use one prompt for every shot.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetCategory}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-black hover:bg-slate-50"
                    >
                      Reset Category
                    </button>

                    <button
                      type="button"
                      onClick={savePrompts}
                      className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      Save Prompts
                    </button>
                  </div>
                </div>

                <div className="mb-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("watches")}
                    className={`rounded-xl px-5 py-3 text-sm font-black ${
                      activeCategory === "watches"
                        ? "bg-black text-white"
                        : "bg-slate-100 text-black hover:bg-slate-200"
                    }`}
                  >
                    Watches
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory("clothing")}
                    className={`rounded-xl px-5 py-3 text-sm font-black ${
                      activeCategory === "clothing"
                        ? "bg-black text-white"
                        : "bg-slate-100 text-black hover:bg-slate-200"
                    }`}
                  >
                    Clothing
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {Object.entries(activePromptGroup).map(([shot, value]) => (
                    <div
                      key={shot}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-black capitalize text-black">
                          {shot} Prompt
                        </h3>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                          {activeCategory}
                        </span>
                      </div>

                      <textarea
                        value={value}
                        onChange={(e) =>
                          updatePrompt(activeCategory, shot, e.target.value)
                        }
                        rows={6}
                        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-black outline-none focus:border-black"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}