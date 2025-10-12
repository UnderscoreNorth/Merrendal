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

export class CharcoalProject implements Project {
  type = "Make Charcoal";
  currentPhase = 1;
  phases: ProjectPhase[];
  outputs: ProjectOutput[];
  workers: Set<number> = new Set();
  requirements: Requirement[];

  dailyProgress = 0;
  constructor({ area }: { area: Area }) {
    if (!area) throw "Building exists without area";

    this.outputs = [
      {
        type: "items",
        data: { Charcoal: 200 },
      },
    ];
    this.requirements = [
      { type: "building", data: "Iron Bloomery" },
      { type: "item", data: "Lumber", num: 0.25, consume: true },
    ];
    this.phases = [
      {
        name: "Making Charcoal",
        manDaysRequired: 10,
        maxDailyProgress: 20,
        progressPercent: 0,
        building: "Iron Bloomery",
        stuck: false,
        requirements: [],
      },
    ];
  }
}

export const proj_Charcoal: ProjectConstructor = {
  expectedOutputs: { items: ["Charcoal"] },
  constructor: ({ area }) => {
    if (area == undefined) throw "No area defined";
    return new CharcoalProject({ area });
  },
};
