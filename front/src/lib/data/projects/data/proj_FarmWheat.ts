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

export class FarmWheatProject implements Project {
  type = "Farm Wheat";
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
        data: { Wheat: area.acres * 10 },
      },
    ];
    this.requirements = [
      { type: "season", data: "Spring" },
      { type: "building", data: "Farm House" },
    ];

    this.phases = [
      {
        name: "Planting",
        manDaysRequired: (area.acres * 50) / 5,
        progressPercent: 0,
        building: "Farm House",
        requirements: [],
        stuck: false,
      },
      {
        name: "Irrigation",
        manDaysRequired: area.acres / 10,
        progressPercent: 0,
        building: "Farm House",
        maxDailyProgress: 100 / 90,
        requirements: [
          { type: "season", data: "Summer" },
          { type: "progress", min: 100 },
        ],
        stuck: false,
      },
      {
        name: "Harvest",
        manDaysRequired: (area.acres * 50) / 5,
        progressPercent: 0,
        building: "Farm House",
        requirements: [
          { type: "season", data: "Autumn" },
          { type: "progress", min: 100 },
        ],
        requireOperator: "OR",
        stuck: false,
      },
    ];
    this.phases[0].outputModifiers = [
      {
        condition: () => true,
        modifier: () => this.phases[0]?.progressPercent / 100 || 0,
        description: "Planting progress affects output",
      },
    ];
    this.phases[1].outputModifiers = [
      {
        condition: () => true,
        modifier: () =>
          (area.yieldEff.Wheat ?? 1) *
          (this.phases[1]?.progressPercent / 100 || 0),
        description: "Irrigation progress and yield efficiency affect output",
      },
    ];
    this.phases[2].outputModifiers = [
      {
        condition: () => true,
        modifier: () => this.phases[2]?.progressPercent / 100 || 0,
        description: "Harvest progress affects output",
      },
    ];
  }
}

export const proj_FarmWheat: ProjectConstructor = {
  constructor: ({ area }) => {
    if (!area) throw "No area";
    return new FarmWheatProject({ area });
  },
  expectedOutputs: { items: ["Wheat"] },
};
