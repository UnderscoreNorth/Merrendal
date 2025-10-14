import type { ItemName } from "$lib/data/items";
import type { Season } from "../data/time";

export type Task = {
  type: "task";
  currentPhase: number;
  phases: Array<{ input: Input[]; output: Output[]; worksAtNight?: boolean }>;
};
