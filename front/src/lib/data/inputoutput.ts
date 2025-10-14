import { AreaType } from "./areas";
import type { BuildingType } from "./buildings";
import type { ItemName } from "./items";
import { Trait } from "./living";
import { Season } from "./time";

export type Input =
  | {
      inputType: "item";
      data: ItemName;
      num: number;
      consume: boolean;
    }
  | {
      inputType: "villager";
      num: number;
      kill?: string;
      minAge?: number;
      maxAge?: number;
    }
  | {
      inputType: "building";
      data: BuildingType;
    }
  | {
      inputType: "area";
      data: AreaType;
    }
  | {
      inputType: "season";
      data: Season;
    }
  | { inputType: "hasYield"; data: string }
  | { inputType: "trait"; data: Trait[] };

export type Output =
  | {
      outputType: "item";
      item: string;
      num: number;
    }
  | {
      outputType: "building";
      building: string;
    };
