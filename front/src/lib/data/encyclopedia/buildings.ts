import type { EncyclopediaPage } from "./types";

export const buildingsPage: EncyclopediaPage = {
  id: "buildings",
  title: "Buildings",
  content: [
    {
      type: "text",
      content:
        "Buildings are the foundation of your village's infrastructure. Each building serves a specific purpose, from housing your population to producing resources.",
    },
    {
      type: "heading",
      level: 3,
      content: "Building Categories",
    },
    {
      type: "list",
      items: [
        { type: "text", content: "Extraction - Gather raw materials from the land" },
        { type: "text", content: "Industry - Process raw materials into goods" },
        { type: "text", content: "Infrastructure - Support village operations" },
        { type: "text", content: "Food - Produce sustenance for your people" },
        { type: "text", content: "Manor - Noble residences and administration" },
      ],
    },
    {
      type: "heading",
      level: 3,
      content: "Construction",
    },
    {
      type: "text",
      content:
        "Buildings require specific resources to construct and may have ongoing maintenance costs. Plan your construction carefully to ensure you have the necessary materials.",
    },
    {
      type: "heading",
      level: 3,
      content: "Upgrades",
    },
    {
      type: "text",
      content:
        "Many buildings can be upgraded to improve their capacity or unlock new capabilities. See the building reference for specific upgrade options.",
    },
  ],
};
