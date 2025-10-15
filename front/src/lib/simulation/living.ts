import type { Stats, Villager } from "$lib/data/living";
import { rollRange } from "$lib/util/rolls";

export function getSkill(npc: Villager, occupation: string): number {
  return npc.skills[occupation] || 0;
}

export function increaseSkill(
  npc: Villager,
  occupation: string,
  amount: number,
) {
  if (!npc.skills[occupation]) {
    npc.skills[occupation] = 0;
  }
  npc.skills[occupation] = Math.min(100, npc.skills[occupation] + amount);
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
    if ("stuck" in target && typeof target.stuck == "boolean")
      stuck = target.stuck;
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
      .sort((a, b) => {
        // First, sort by priority (lower is better, so ascending)
        const priorityDiff = a.job.priority - b.job.priority;
        if (priorityDiff !== 0) return priorityDiff;

        // If priorities are equal, sort by skill (higher is better, so descending)
        const skillA = getSkill(a, title);
        const skillB = getSkill(b, title);
        return skillB - skillA;
      })[0];
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

export function rollStats(): Stats {
  return {
    STR: rollRange(2, 7),
    DEX: rollRange(2, 7),
    CON: rollRange(2, 7),
    WIS: rollRange(2, 7),
    INT: rollRange(2, 7),
    CHA: rollRange(2, 7),
  };
}
