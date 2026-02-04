import type { EncyclopediaPage } from "./types";

export const villagePage: EncyclopediaPage = {
  id: "village",
  title: "Village Management",
  content: [
    {
      type: "text",
      content:
        "Your village is the heart of your domain. It consists of buildings, population, and resources that must be carefully managed to ensure prosperity and growth.",
    },
    {
      type: "heading",
      level: 3,
      content: "Key Aspects",
    },
    {
      type: "list",
      items: [
        { type: "text", content: "Building placement and expansion" },
        { type: "text", content: "Population assignment and happiness" },
        { type: "text", content: "Resource production and consumption" },
        { type: "text", content: "Seasonal planning and preparation" },
      ],
    },
    {
      type: "text",
      content:
        "Success requires balancing the needs of your population with available resources, while planning for future growth through strategic buildings placement.",
    },
  ],
};
