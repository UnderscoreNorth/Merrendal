import type { EncyclopediaPage } from "./types";

export const indexPage: EncyclopediaPage = {
  id: "index",
  title: "Encyclopedia",
  content: [
    {
      type: "text",
      content:
        "Welcome to the Merrendal Encyclopedia. Browse through the following topics to learn more about your village and its management.",
    },
    {
      type: "heading",
      level: 3,
      content: "Core Concepts",
    },
    {
      type: "list",
      items: [
        {
          type: "link",
          to: "village",
          content: "Village Management - Understanding your village",
        },
        {
          type: "link",
          to: "buildings",
          content: "Buildings - Structures and their purposes",
        },
        {
          type: "link",
          to: "population",
          content: "Population - Managing your villagers",
        },
        {
          type: "link",
          to: "resources",
          content: "Resources - Materials and goods",
        },
      ],
    },
    {
      type: "heading",
      level: 3,
      content: "Economy & Production",
    },
    {
      type: "list",
      items: [
        {
          type: "link",
          to: "farming",
          content: "Farming - Agriculture and food production",
        },
        {
          type: "link",
          to: "industry",
          content: "Industry - Crafting and manufacturing",
        },
        {
          type: "link",
          to: "trade",
          content: "Trade - Commerce and exchange",
        },
      ],
    },
    {
      type: "heading",
      level: 3,
      content: "Detailed References",
    },
    {
      type: "list",
      items: [
        {
          type: "link",
          to: "building-list",
          content: "Building Reference - Complete list of all buildings",
        },
        {
          type: "link",
          to: "item-list",
          content: "Item Reference - Complete list of all items",
        },
        {
          type: "link",
          to: "animal-list",
          content: "Animal Reference - Complete list of all animals",
        },
      ],
    },
  ],
};
