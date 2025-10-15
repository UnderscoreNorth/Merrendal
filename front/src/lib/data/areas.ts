import type { Cube } from "$lib/map/generation";
import type { Building, UpgradeType } from "./buildings";
import type { ItemRecord } from "./items";
export type AreaType = Area["type"];

export type Area = {
  areaID: string;
  acres: number;
  buildings: Building[];
  yieldEff: ItemRecord;
  type: "Farm" | "Forest" | "Hill" | "Village" | "Manor" | "Mountain";
  arableLand: number;
  currentProjects: ProjectType[];
  loc: Cube;
  yields: ItemRecord;
};

export type ProjectType =
  | {
      type: "construction";
      building: Building;
      progress: ItemRecord;
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
    };
