import type { AreaType } from "./areas";
import type { BuildingType } from "./buildings";
import type { ItemName } from "./items";
import type { Trait } from "./lords";

export type Requirement = { not?: true } & (
  | { type: "item"; data: ItemName; num: number; consume: boolean }
  | { type: "season"; data: "Spring" | "Winter" | "Autumn" | "Summer" }
  | { type: "building"; data: BuildingType }
  | { type: "area"; data: AreaType }
  | { type: "hasYield"; data: boolean }
  | { type: "progress"; min?: number }
  | {
      type: "pop";
      consume: boolean;
      min?: number;
      max?: number;
      num: number;
      cause?: string;
    }
  | { type: "trait"; trait: Trait[] }
);
