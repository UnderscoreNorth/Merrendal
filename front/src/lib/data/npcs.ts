import { type GameState } from "$lib/stores";
import { pick, rollRange } from "../util/rolls";
import { type Building, buildingTypes } from "./buildings";
import { type Person } from "./person";
import { type Project } from "./projects/project";

export type NPC = Person & {
  nameKnown: boolean;
  relations: Record<
    string,
    {
      trust: TrustLevel;
    }
  >;
  job: {
    title: string;
    stuck: boolean;
    priority: number;
    attached?: Building | Project;
  };
};
export const trustLevels = [
  "Loyal",
  "Trusting",
  "Approving",
  "Cautious",
  "Suspicious",
  "Distrustful",
  "Rebellious",
] as const;
export type TrustLevel = (typeof trustLevels)[number];

type ExtractOccupationTitles<T> = {
  [K in keyof T]: T[K] extends { occupationTitle: infer U } ? U : never;
}[keyof T];
export type Occupation = ExtractOccupationTitles<typeof buildingTypes> | "None";

export function rollNewSTR(npc: NPC) {
  if (npc.age < 9) return 1;
  if (npc.age < 13) return rollRange(1, 2);
  if (npc.age < 15) return rollRange(2, 3);
  if (npc.age < 17) return rollRange(3, 4);
  if (npc.age < 49) return rollRange(4, 5);
  if (npc.age < 59) return rollRange(3, 4);
  return rollRange(2, 3);
}
export function rollNewDEX(npc: NPC) {
  if (npc.age < 9) return 1;
  if (npc.age < 13) return rollRange(1, 2);
  if (npc.age < 15) return rollRange(2, 3);
  if (npc.age < 17) return rollRange(3, 4);
  if (npc.age < 49) return rollRange(4, 5);
  if (npc.age < 59) return rollRange(3, 4);
  return rollRange(2, 3);
}

export function getStat(npc: NPC, stat: "str" | "dex") {
  let base = npc.stats[stat];
  for (let status of Object.values(npc.statuses)) {
    for (let modifier of status.modifiers) {
      if (modifier.type == "statModifier" && modifier.stat == stat) {
        base += modifier.modifier;
      }
    }
  }
  return base;
}

export function unassignNPC(npc: NPC) {
  if (npc.job.attached) npc.job.attached.workers.delete(Number(npc.id));
  npc.job = {
    title: "None",
    priority: 0,
    stuck: false,
  };
}
export function assignNPCs(
  gs: GameState,
  target: Building | Project,
  priority: number,
  num: number,
) {
  let title = "";
  let stuck = false;
  let targetArea: any = null;

  // Find which area this target belongs to
  if ("occupationTitle" in target) {
    // It's a building - find the area containing it
    targetArea = gs.areas.find((area) => area.buildings.includes(target));
    title = target.occupationTitle ?? "";
  } else if ("phases" in target) {
    // It's a project - find the area containing it
    targetArea = gs.areas.find((area) =>
      Object.values(area.currentProjects).includes(target),
    );
    const currentPhase = target.phases[target.currentPhase - 1];
    title = currentPhase.occupationTitle ?? "";
    stuck = currentPhase.stuck;
    if (title == "" && currentPhase.building) {
      const currentBuilding = buildingTypes[currentPhase.building];
      if ("occupationTitle" in currentBuilding)
        title = currentBuilding.occupationTitle;
    }
  }

  // Check if forest work is blocked by Creatures of the Forest event
  if (targetArea && targetArea.type === "Forest") {
    const cotfEvent = gs.activeEvents.find(
      (e) => e.id === "Creatures of the Forest",
    );
    if (cotfEvent && cotfEvent.phase.forestWorkRefused) {
      // Only allow scouting and hunting projects for this event
      if (
        !("type" in target) ||
        (target.type !== "Scouting_COTF" && target.type !== "Hunting_COTF")
      ) {
        return 0; // Don't assign workers to forest areas
      }
    }
  }

  if (title == "") throw target;
  let assigned = 0;
  for (let i = 0; i < num; i++) {
    let npc = gs.npcs
      .filter(
        (npc) =>
          !npc.job.stuck &&
          npc.age >= 16 &&
          !gs.dailyWorkerActivity.has(npc.id),
      )
      .sort((a, b) => a.job.priority - b.job.priority)[0];
    if (npc) {
      if (npc.job.attached) npc.job.attached.workers.delete(Number(npc.id));
      assigned++;
      target.workers.add(Number(npc.id));
      npc.job = {
        title,
        priority,
        stuck,
        attached: target,
      };
    }
  }
  return assigned;
}
