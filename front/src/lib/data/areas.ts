import type { Cube } from "$lib/map/generation";
import type { Building, UpgradeType } from "./buildings";
import type { ItemRecord } from "./items";

export type Area = {
  areaID: string;
  acres: number;
  buildings: Building[];
  yieldEff: ItemRecord;
  arableLand: number;
  buildingLand: number;
  currentProjects: ProjectType[];
  loc: Cube;
  terrain: {
    elevation: number;
    forested: number;
    topography: "Plains" | "Hill" | "Water" | "Mountain" | "Desert";
    river: string;
  };
  yields: ItemRecord;
};

export type ProjectType = { id: string; priority: number } & (
  | {
      type: "construction";
      building: Building;
      progress: ItemRecord;
      leadCarpenter: string;
      leadStoneMason: string;
    }
  | {
      type: "demolition";
      building: Building;
      progress: 0;
    }
  | {
      type: "upgrade";
      building: Building;
      upgrade: UpgradeType;
      progress: ItemRecord;
    }
);
