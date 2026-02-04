import type { EncyclopediaPage } from "./types";

export const resourcesPage: EncyclopediaPage = {
  id: "resources",
  title: "Resources",
  content: [
    {
      type: "text",
      content:
        "Resources are the materials, goods, and consumables that drive your village economy. They are produced by buildings and consumed by your population.",
    },
    {
      type: "heading",
      level: 3,
      content: "Resource Categories",
    },
    {
      type: "list",
      items: [
        { type: "text", content: "Crops - Agricultural products from farming" },
        { type: "text", content: "Food - Prepared sustenance for your people" },
        { type: "text", content: "Raw Goods - Materials for industry" },
        { type: "text", content: "Goods - Manufactured items" },
        { type: "text", content: "Equipment - Tools and implements" },
      ],
    },
    {
      type: "text",
      content:
        "See the item reference for a complete reference of all available resources and their properties.",
    },
  ],
};
