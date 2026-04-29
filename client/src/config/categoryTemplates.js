// client/src/config/categoryTemplates.js

export const categoryTemplates = {
  watch: {
    name: "Watch",
    defaultMode: "enhance_uploaded_shots",
    subCategories: ["Standard"],
    presets: ["Premium Clean", "Luxury Dark", "Studio Light"],
    backgrounds: ["White", "Light Gray", "Custom"],
    sizes: [
      { value: "1644x2464", label: "1644 x 2464 (2:3)" },
      { value: "1600x1600", label: "1600 x 1600 (1:1)" },
      { value: "2000x2000", label: "2000 x 2000 (1:1)" },
    ],
    qualities: ["High", "Medium"],
    expectedShots: [
      { id: "front", label: "Front" },
      { id: "angle", label: "Angle" },
      { id: "side", label: "Side" },
      { id: "back", label: "Back" },
      { id: "box", label: "Box" },
    ],
  },

  clothing: {
    name: "Clothing",
    defaultMode: "generate_new_shots",
    subCategories: ["T-Shirt", "Shirt", "Jeans", "Dress", "Jacket"],
    presets: ["E-commerce Clean", "Lifestyle", "Premium Studio"],
    backgrounds: ["White", "Light Gray", "Custom"],
    sizes: ["1600 x 1600 (1:1)", "1200 x 1600 (3:4)", "1600 x 2400 (2:3)"],
    qualities: ["High", "Medium"],
    defaultShots: ["front", "back", "model"],
    expectedShots: [
      { id: "front", label: "Front" },
      { id: "back", label: "Back" },
      { id: "model", label: "Model" },
      { id: "detail", label: "Detail" },
    ],
  },
};
