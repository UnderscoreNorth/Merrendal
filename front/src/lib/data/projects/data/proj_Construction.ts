import { buildingTypes, type Building } from "$lib/data/buildings";
import type { Requirement } from "$lib/data/requirement";
import type { GameState } from "$lib/stores";
import type { Area } from "../../areas";
import type { ItemName, ItemRecord } from "../../items";
import type {
  Project,
  ProjectPhase,
  ProjectOutput,
  ProjectConstructor,
  ProjectArgs,
} from "../project";

export class ConstructionProject implements Project {
  type = "Construction";
  currentPhase = 1;
  phases: ProjectPhase[];
  outputs: ProjectOutput[];
  workers: Set<number> = new Set();

  requirements: Requirement[];

  constructor({ area, building }: { area: Area; building: Building }) {
    if (!area) throw "Building exists without area";

    this.outputs = [
      {
        type: "building",
        data: building,
      },
    ];
    this.requirements = [];
    Object.entries(buildingTypes[building.type].requirements).forEach(
      ([item, num]) => {
        this.requirements.push({
          type: "item",
          data: item as ItemName,
          num,
          consume: true,
        });
      },
    );

    this.phases = [
      {
        name: "Building " + building.type,
        manDaysRequired: buildingTypes[building.type].daysToComplete,
        progressPercent: 0,
        requirements: [],
        stuck: false,
        occupationTitle: "Builder",
      },
    ];
  }
}

export const proj_Construction: ProjectConstructor = {
  constructor: ({ area, building }) => {
    if (!area) throw "No area";
    if (!building) throw "No building";
    return new ConstructionProject({ area, building });
  },
  expectedOutputs: { items: [] },
};
