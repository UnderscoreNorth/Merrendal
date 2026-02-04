import type { EncyclopediaPage } from "./types";

export const populationPage: EncyclopediaPage = {
  id: "population",
  title: "Population",
  content: [
    {
      type: "text",
      content:
        "Your villagers are your most valuable asset. They work in buildings, consume resources, and grow your community over time.",
    },
    {
      type: "heading",
      level: 3,
      content: "Worker Assignment",
    },
    {
      type: "text",
      content:
        "Assign villagers to work in buildings to produce goods and gather resources. Each building has a maximum worker capacity.",
    },
    {
      type: "heading",
      level: 3,
      content: "Population Needs",
    },
    {
      type: "text",
      content:
        "Villagers need food, shelter, and other basic necessities. Meeting these needs keeps your population happy and productive. Monitor your resources to ensure adequate supplies.",
    },
    {
      type: "heading",
      level: 3,
      content: "Growth",
    },
    {
      type: "text",
      content:
        "Your population grows naturally over time when conditions are favorable. Ensure adequate housing and food supplies to support population growth.",
    },
  ],
};
