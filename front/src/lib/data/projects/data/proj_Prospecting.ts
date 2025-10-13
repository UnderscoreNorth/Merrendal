import type { Requirement } from "$lib/data/requirement";
import type { GameState } from "$lib/stores";
import { fromCube } from "$lib/util/terrainHelpers";
import type { Area } from "../../areas";
import type { ItemName, items, type ItemRecord } from "../../items";
import type {
  Project,
  ProjectPhase,
  ProjectOutput,
  ProjectConstructor,
  ProjectArgs,
} from "../project";

export class ProspectingProject implements Project {
  type = "Prospecting";
  currentPhase = 1;
  phases: ProjectPhase[];
  outputs: ProjectOutput[];
  workers: Set<number> = new Set();
  requirements: Requirement[];

  dailyProgress = 0;
  constructor({ gs, area }: { gs: GameState; area: Area }) {
    if (!area) throw "Area required for prospecting";
    if (area.type !== "Mountain")
      throw "Prospecting only available on Mountain tiles";

    const mineableItems = Object.entries(items)
      .filter(([_, item]) => "mineable" in item)
      .map(([name, _]) => name as ItemName);

    // Pick random mineable item
    const randomIndex = Math.floor(Math.random() * mineableItems.length);
    const ore = mineableItems[randomIndex];
    this.outputs = [];
    if (gs.map) {
      const data: ItemRecord = {};
      data[ore] = gs.map.tiles[fromCube(area.loc)].yield;
      this.outputs = [{ type: "area_yield", data }];
    }

    this.requirements = [
      { type: "area", data: "Mountain" },
      { type: "hasYield", data: false },
    ];

    this.phases = [];
    this.phases.push({
      name: "Survey",
      manDaysRequired: 40, // 10 days minimum with 4 people
      progressPercent: 0,
      maxDailyProgress: 10, // 10% per day max, so minimum 10 days
      requirements: [],
      occupationTitle: "Prospector",
      stuck: true,
    });
    this.phases.push({
      name: "Deep Analysis",
      manDaysRequired: 40, // 10 days minimum with 4 people
      progressPercent: 0,
      maxDailyProgress: 10, // 10% per day max, so minimum 10 days
      requirements: [{ type: "progress", min: 100 }],
      occupationTitle: "Prospector",
      stuck: true,
    });
  }
}

export const proj_Prospecting: ProjectConstructor = {
  constructor: ({ area, gs }) => {
    if (!area || !gs) throw "Missing args";
    return new ProspectingProject({ area, gs });
  },
  expectedOutputs: { items: ["Iron Ore"] },
};
