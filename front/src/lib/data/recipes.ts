import { type BuildingType } from "./buildings";
import { type ItemName } from "./items";
import { type StatType } from "./person";

export type Recipe = {
  input: Array<{ type: ItemName; num: number }>;
  output: Array<{ type: ItemName; num: number }>;
  buildings?: Array<BuildingType>;
  statModifers?: Partial<Record<StatType, number>>;
};

export const recipes: Recipe[] = [
  {
    input: [{ type: "Wheat", num: 1 }],
    output: [{ type: "Bread", num: 100 }],
    buildings: ["Bakehouse"],
  },
  {
    input: [
      { type: "Lumber", num: 0.25 },
      { type: "Iron Ingots", num: 1 },
    ],
    output: [{ type: "Spears", num: 1 }],
    buildings: ["Forge"],
  },
  {
    input: [],
    output: [{ type: "Lumber", num: 1 }],
    statModifers: { str: 5 },
    buildings: ["Lumberyard"],
  },
  {
    input: [],
    output: [{ type: "Iron Ore", num: 1 }],
    statModifers: { str: 5 },
    buildings: ["Mine"],
  },
  {
    input: [],
    output: [{ type: "Meat", num: 5 }],
    statModifers: { str: 5 },
    buildings: ["Hunter's Hut"],
  },
];
