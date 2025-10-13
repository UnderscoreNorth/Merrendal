import type { GameState } from "$lib/stores";
import type { Area } from "./areas";
import type { ItemName } from "./items";
import { unassignNPC } from "./npcs";

export type BuildingType = keyof typeof buildingTypes;

export type BaseBuilding = {
  id: string;
  type: BuildingType;
  maxPops: number;
  workers: Set<number>;
  occupationTitle?: string;
  stuck?: boolean;
};
export type BuiltBuilding = BaseBuilding & {
  status: "Built";
};
export type NotBuiltBuilding = BaseBuilding & {
  status: "Ruined" | "Building";
  daysToComplete: number;
};
export type Building = BuiltBuilding | NotBuiltBuilding;
export type BuildingTemplate = {
  requirements: Partial<Record<ItemName, number>>;
  maxPops: ((area: Area) => number) | number;
  daysToComplete: number;
  occupationTitle?: string;
  stuck?: boolean;
};
export const buildingTypes = {
  Forge: {
    requirements: { Lumber: 20 },
    maxPops: 3,
    daysToComplete: 7,
    occupationTitle: "Blacksmith",
  },
  "Iron Bloomery": {
    requirements: { Lumber: 20 },
    maxPops: 10,
    daysToComplete: 7,
    occupationTitle: "Bloomery Worker",
  },
  Bakehouse: {
    requirements: { Lumber: 20 },
    maxPops: 3,
    daysToComplete: 7,
    occupationTitle: "Baker",
  },
  "Wood Wall": {
    requirements: { Lumber: 10 },
    maxPops: 0,
    daysToComplete: 1,
  },
  Mine: {
    requirements: { Lumber: 100 },
    maxPops: 10,
    daysToComplete: 28,
    occupationTitle: "Miner",
  },
  "Stone Quarry": {
    requirements: { Lumber: 40 },
    maxPops: 10,
    daysToComplete: 7,
    occupationTitle: "Quarryman",
  },
  "Farm House": {
    requirements: { Lumber: 50 },
    maxPops: 0,
    daysToComplete: 14,
    occupationTitle: "Farmer",
  },
  Lumberyard: {
    requirements: {},
    maxPops: (area) => Math.ceil(area.acres / 300),
    daysToComplete: 1,
    occupationTitle: "Lumberjack",
  },
  "Hunter's Hut": {
    requirements: { Lumber: 10 },
    maxPops: (area) => Math.ceil(area.acres / 300),
    daysToComplete: 1,
    occupationTitle: "Hunter",
  },
  // Alchemical buildings
  Laboratory: {
    requirements: { Lumber: 50, Stone: 20 },
    maxPops: 3,
    daysToComplete: 14,
    occupationTitle: "Alchemist",
  },
  "Sulfur Mine": {
    requirements: { Lumber: 100 },
    maxPops: 8,
    daysToComplete: 28,
    occupationTitle: "Sulfur Miner",
  },
  "Mercury Mine": {
    requirements: { Lumber: 100 },
    maxPops: 8,
    daysToComplete: 28,
    occupationTitle: "Mercury Miner",
  },
  "Grand Athanor": {
    requirements: { Lumber: 200, Stone: 100, "Iron Ingots": 50 },
    maxPops: 10,
    daysToComplete: 90,
    occupationTitle: "Master Alchemist",
  },
  // Manor buildings
  Archive: {
    requirements: { Lumber: 30, Stone: 10 },
    maxPops: 1,
    daysToComplete: 14,
    occupationTitle: "Archivist",
    stuck: true,
  },
} as const satisfies Record<string, BuildingTemplate>;
export function ruinBuilding(gs: GameState, building: Building) {
  building.status = "Ruined";
  for (const npcID of building.workers) {
    const npc = gs.npcs.find((i) => i.id == npcID.toString());
    if (npc) unassignNPC(npc);
  }
  building.workers = new Set();
}
