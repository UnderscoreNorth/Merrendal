import type { BuildingType } from "./buildings";
import type { ItemName } from "./items";
import type { StatType } from "./person";

export type Recipe = {
  input: Array<{ type: ItemName; num: number }>;
  output: Array<{ type: ItemName; num: number }>;
  buildings?: Array<BuildingType>;
  statModifers?: Partial<Record<StatType, number>>;
  worksAtNight?: boolean; // If true, can work during Evening period. Defaults to false.
};

export const recipes: Recipe[] = [
  {
    input: [{ type: "Wheat", num: 0.5 }],
    output: [{ type: "Bread", num: 50 }],
    buildings: ["Bakehouse"],
  },
  {
    input: [
      { type: "Lumber", num: 0.125 },
      { type: "Iron Ingots", num: 0.5 },
    ],
    output: [{ type: "Spears", num: 0.5 }],
    buildings: ["Forge"],
  },
  {
    input: [],
    output: [{ type: "Lumber", num: 0.5 }],
    statModifers: { str: 5 },
    buildings: ["Lumberyard"],
  },
  {
    input: [],
    output: [{ type: "Iron Ore", num: 0.5 }],
    statModifers: { str: 5 },
    buildings: ["Mine"],
  },
  {
    input: [],
    output: [{ type: "Stone", num: 1 }],
    statModifers: { str: 5 },
    buildings: ["Stone Quarry"],
  },
  {
    input: [],
    output: [{ type: "Meat", num: 2.5 }],
    statModifers: { str: 5 },
    buildings: ["Hunter's Hut"],
  },
  // Alchemical recipes
  {
    input: [],
    output: [{ type: "Sulfur", num: 0.5 }],
    statModifers: { str: 5 },
    buildings: ["Sulfur Mine"],
  },
  {
    input: [],
    output: [{ type: "Mercury", num: 0.5 }],
    statModifers: { str: 5 },
    buildings: ["Mercury Mine"],
  },
  {
    input: [
      { type: "Sulfur", num: 0.25 },
      { type: "Mercury", num: 0.25 },
      { type: "Salt", num: 0.25 },
    ],
    output: [{ type: "Alchemical Tincture", num: 0.5 }],
    buildings: ["Laboratory"],
    worksAtNight: true, // Alchemists work at all hours
  },
  {
    input: [
      { type: "Alchemical Tincture", num: 2 },
      { type: "Bread", num: 50 },
    ],
    output: [{ type: "Prima Materia", num: 0.25 }],
    buildings: ["Grand Athanor"],
    worksAtNight: true,
  },
  {
    input: [
      { type: "Prima Materia", num: 10 },
      { type: "Sulfur", num: 5 },
      { type: "Mercury", num: 5 },
    ],
    output: [{ type: "Philosopher's Stone", num: 0.05 }],
    buildings: ["Grand Athanor"],
    worksAtNight: true,
  },
  // Archive recipe - special recipe that records logs
];
