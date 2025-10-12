import { type GameState } from "$lib/stores";
import { type AreaType, type Area } from "../areas";
import { type Building, type BuildingType } from "../buildings";
import { type ItemName, type ItemRecord } from "../items";
import { type Requirement } from "../requirement";

export type ProjectPhase = {
  name: string;
  manDaysRequired: number;
  outputModifiers?: OutputModifier[];
  progressPercent: number;
  building?: BuildingType;
  maxDailyProgress?: number;
  requirements: Requirement[];
  requireOperator?: "OR";
  occupationTitle?: string;
  stuck: boolean;
  worksAtNight?: boolean; // If true, can work during Evening period. Defaults to false.
};

export type ProjectArgs = {
  gs?: GameState;
  area?: Area;
  building?: Building;
};
export type ProjectConstructor = {
  expectedOutputs: { items: ItemName[] };
  constructor: (arg: ProjectArgs) => Project;
};

export type OutputModifier = {
  condition: (...args: any) => boolean;
  modifier: () => number; // multiplier for final output (0.8 = 20% penalty)
  description: string;
};

export type ProjectOutput =
  | {
      type: "items";
      data: ItemRecord;
    }
  | { type: "area_yield"; data: ItemRecord }
  | { type: "building"; data: Building };

export type Project = {
  type: string;
  currentPhase: number;
  phases: ProjectPhase[];
  outputs: ProjectOutput[];
  workers: Set<number>;
  requirements: Requirement[];
  dailyProgress: number;
};

export type ProjectType = {
  type: string;
  estTime: number;
  outputs: ItemName[];
};
