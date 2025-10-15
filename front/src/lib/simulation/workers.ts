import { type GameState } from "$lib/stores";
import { type Villager } from "$lib/data/living";

export function skillUp(gs: GameState, worker: Villager, skill: string) {
  const increase = 0.00007;
  if (worker.skills[skill] == undefined) worker.skills[skill] = 0;
  worker.skills[skill] += increase;
  if (worker.skills[skill] > 1) worker.skills[skill] = 1;
  for (const apprentice of gs.npcs.filter((npc) =>
    worker.apprentices.includes(npc.id),
  )) {
    if (apprentice.skills[skill] == undefined) apprentice.skills[skill] = 0;
    apprentice.skills[skill] += (increase * (1 + worker.skills[skill])) / 2;
    if (apprentice.skills[skill] > 1) apprentice.skills[skill] = 1;
  }
}
