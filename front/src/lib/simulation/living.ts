import { type Building } from "$lib/data/buildings";
import type { Stats, Villager } from "$lib/data/living";
import { type GameState } from "$lib/stores";
import { rollRange } from "$lib/util/rolls";
import { getAllBuildings } from "./buildings";

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

export function assignNPCs(gs: GameState, target: Building, num: number) {
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
  }

  if (title == "") throw target;
  let assigned = 0;
  for (let i = 0; i < num; i++) {
    let npc = gs.npcs
      .filter(
        (npc) =>
          (!npc.job || npc.job.title == "") &&
          npc.age >= 16 &&
          !gs.dailyWorkerActivity.has(npc.id),
      )
      .sort((a, b) => {
        // If priorities are equal, sort by skill (higher is better, so descending)
        const skillA = getSkill(a, title);
        const skillB = getSkill(b, title);
        return skillB - skillA;
      })[0];
    if (npc) {
      assigned++;
      target.workers.add(npc.id);
      npc.job = {
        title,
        stuck,
        attached: target.id,
      };
    }
  }
  console.log(assigned);
  return assigned;
}

export function unassignNPC(gs: GameState, npc: Villager) {
  const job = npc.job;
  if (job == undefined) return;
  let buildingID = job.attached;
  npc.job = undefined;
  if (buildingID == undefined) return;
  for (const building of getAllBuildings(gs)) {
    building.workers.delete(npc.id);
  }
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
