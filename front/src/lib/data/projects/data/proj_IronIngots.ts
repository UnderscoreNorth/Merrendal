import type { Requirement } from "$lib/data/requirement";
import type { GameState } from "$lib/stores";
import type { Area } from "../../areas";
import type { ItemRecord } from "../../items";
import type {
  Project,
  ProjectPhase,
  ProjectOutput,
  ProjectConstructor,
  ProjectArgs,
} from "../project";

export class IronIngotProject implements Project {
  type = "Smelt Iron";
  currentPhase = 1;
  phases: ProjectPhase[];
  outputs: ProjectOutput[];
  workers: Set<number> = new Set();
  requirements: Requirement[];
  constructor({ area }: { area: Area }) {
    if (!area) throw "Building exists without area";

    this.outputs = [
      {
        type: "items",
        data: { "Iron Ingots": 1 },
      },
    ];
    this.requirements = [
      { type: "building", data: "Iron Bloomery" },
      { type: "item", data: "Iron Ore", num: 2, consume: true },
      { type: "item", data: "Charcoal", num: 100, consume: true },
    ];

    this.phases = [
      {
        name: "Smelting Iron",
        manDaysRequired: 10,
        progressPercent: 0,
        building: "Iron Bloomery",
        requirements: [],
        stuck: false,
      },
    ];
  }
}

export const proj_IronIngot: ProjectConstructor = {
  constructor: ({ area }) => {
    if (!area) throw "No area";
    return new IronIngotProject({ area });
  },
  expectedOutputs: { items: ["Iron Ingots"] },
};
