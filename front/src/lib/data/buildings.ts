import { type GameState } from "$lib/stores";
import { type Area } from "./areas";
import { type ItemName } from "./items";
import { unassignNPC } from "./npcs";

export type BuildingType = keyof typeof buildingTypes;

export type BaseBuilding = {
  id: string;
  type: BuildingType;
  maxPops: number;
  workers: Set<number>;
  occupationTitle?: string;
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
} as const satisfies Record<string, BuildingTemplate>;
export function ruinBuilding(gs: GameState, building: Building) {
  building.status = "Ruined";
  for (const npcID of building.workers) {
    const npc = gs.npcs.find((i) => i.id == npcID.toString());
    if (npc) unassignNPC(npc);
  }
  building.workers = new Set();
}
