import type { EncyclopediaPage } from "./types";

export const farmingPage: EncyclopediaPage = {
  id: "farming",
  title: "Farming",
  content: [
    {
      type: "text",
      content:
        "Farming is essential for feeding your population. Farm fields produce crops that can be consumed directly or processed into other resources.",
    },
    {
      type: "heading",
      level: 3,
      content: "Field Rotation",
    },
    {
      type: "text",
      content:
        "Fields can use different rotation systems to maintain soil fertility. The 2-field and 3-field rotation systems help maximize yields over time.",
    },
    {
      type: "heading",
      level: 3,
      content: "Crops",
    },
    {
      type: "text",
      content:
        "Different crops serve different purposes. Grain provides sustenance, vegetables provide nutrition, and legumes provide protein. Each crop type has different nutritional values.",
    },
    {
      type: "heading",
      level: 3,
      content: "Seasonal Cycles",
    },
    {
      type: "text",
      content:
        "Plan your planting and harvesting around the seasons. Some crops grow better in certain seasons, and you'll need to store enough food for winter.",
    },
  ],
};
