import type { Cube } from "$lib/map/generation";
import type { Building, UpgradeType } from "./buildings";
import type { ItemRecord } from "./items";

export type FieldRotationType = "2-field" | "3-field";

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
    road: string;
  };
  groupID: string;
  yields: ItemRecord;
  fieldRotation?: {
    type: FieldRotationType;
    currentYear: number; // 0, 1, 2, or 3 for tracking position in rotation
  };
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
  | {
      type: "landConversion";
      targetAcres: number;
      progress: number; // Acres converted so far
      workers: Set<string>; // IDs of assigned workers
    }
);
