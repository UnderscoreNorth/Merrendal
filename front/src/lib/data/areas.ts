import { type Cube } from "$lib/map/generation";
import { type BuildingType, type Building } from "./buildings";
import { type ItemRecord, items } from "./items";
import { proj_Charcoal } from "./projects/data/proj_Charcoal";
import { proj_FarmWheat } from "./projects/data/proj_FarmWheat";
import { proj_IronIngot } from "./projects/data/proj_IronIngots";
import { proj_Prospecting } from "./projects/data/proj_Prospecting";
import { type ProjectConstructor, type Project } from "./projects/project";

export type AreaType = Area["type"];

export type Area = {
  areaID: string;
  acres: number;
  buildings: Building[];
  yieldEff: ItemRecord;
  type: "Farm" | "Forest" | "Hill" | "Village" | "Manor" | "Mountain";
  currentProjects: Record<string, Project>;
  loc: Cube;
};

export const areaTypes: Record<
  Area["type"],
  {
    allowedBuildings: BuildingType[];
    allowedProjects: Record<string, ProjectConstructor>;
  }
> = {
  Farm: {
    allowedBuildings: ["Farm House"],
    allowedProjects: { "Farm Wheat": proj_FarmWheat },
  },
  Forest: {
    allowedBuildings: ["Hunter's Hut", "Lumberyard", "Iron Bloomery"],
    allowedProjects: {
      "Making Charcoal": proj_Charcoal,
      "Smelting Iron": proj_IronIngot,
    },
  },
  Hill: {
    allowedBuildings: ["Mine"],
    allowedProjects: {},
  },
  Manor: {
    allowedBuildings: [],
    allowedProjects: {},
  },
  Village: {
    allowedBuildings: ["Bakehouse", "Forge", "Wood Wall"],
    allowedProjects: {},
  },
  Mountain: {
    allowedBuildings: ["Mine"],
    allowedProjects: { Prospecting: proj_Prospecting },
  },
};

// Type to extract only farmable items
type FarmableItems = {
  [K in keyof typeof items]: (typeof items)[K] extends { farmable: true }
    ? K
    : never;
}[keyof typeof items];
type MineableItems = {
  [K in keyof typeof items]: (typeof items)[K] extends { mineable: true }
    ? K
    : never;
}[keyof typeof items];
