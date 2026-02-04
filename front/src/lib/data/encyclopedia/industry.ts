import type { EncyclopediaPage } from "./types";

export const industryPage: EncyclopediaPage = {
  id: "industry",
  title: "Industry",
  content: [
    {
      type: "text",
      content:
        "Industrial buildings transform raw materials into finished goods. This includes everything from milling grain into flour to crafting tools and clothing.",
    },
    {
      type: "heading",
      level: 3,
      content: "Production Chains",
    },
    {
      type: "text",
      content:
        "Many goods require multiple processing steps. For example, Flax becomes Linen Thread, which then becomes Cloth, which can finally be made into Clothing.",
    },
    {
      type: "heading",
      level: 3,
      content: "Recipes",
    },
    {
      type: "text",
      content:
        "Each industrial building has specific recipes it can produce. Assign workers to buildings and they will automatically produce goods based on available materials.",
    },
  ],
};
