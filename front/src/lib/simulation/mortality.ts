import { firstNames } from "$lib/data/person";
import { game, type GameState } from "$lib/stores";
import { pick } from "$lib/util/rolls";
import type { NPC } from "../data/npcs";
import { getAllBuildings } from "./buildings";
import { calculateDaysOfFoodRemaining } from "./food";
import { log } from "./log";
import { getAllProjects } from "./projects";

export function killLord(cause: string, gs: GameState) {
  const lord = gs.lord;
  if (lord == undefined) return;
  lord.causeOfDeath = cause;
  log(gs, `<i>Lord ${lord.fName}</i> died of <i>${cause}</i>`, ["Mortality"]);
  gs.pastLords.push(lord);
  gs.lord = undefined;
}

export function killNPC(npc: NPC, cause: string, gs: GameState): void {
  // Set cause of death
  npc.causeOfDeath = cause;
  for (const building of getAllBuildings(gs)) {
    building.workers.delete(Number(npc.id));
  }
  for (const project of getAllProjects(gs)) {
    project.workers.delete(Number(npc.id));
  }
  // Remove from daily worker activity if present
  gs.dailyWorkerActivity.delete(npc.id);
  if (gs.lord) gs.lord.reignStats.died++;
  // Move to dead NPCs array
  gs.deadNpcs.push(npc);
  // Remove dead NPCs from living population
  gs.npcs = gs.npcs.filter((npc) => !npc.causeOfDeath);
  log(gs, `${npc.age} yr old <i>${npc.fName}</i> died of <i>${cause}</i>`, [
    "Mortality",
  ]);
}
export function processHungerDeaths(gs: GameState): void {
  // Check lord hunger death first
  if (gs.lord && gs.lord.hunger >= 80 && gs.lord.hunger <= 100) {
    // Calculate death chance: 0% at 80 hunger, 20% at 100 hunger
    const deathChance = ((gs.lord.hunger - 80) / 20) * 0.2; // 0 to 0.2 (0% to 20%)

    if (Math.random() < deathChance) {
      killLord("Starvation", gs);
    }
  }

  for (const npc of gs.npcs) {
    // Check hunger-based death for NPCs with hunger between 80-100
    if (npc.hunger >= 80 && npc.hunger <= 100) {
      // Calculate death chance: 0% at 80 hunger, 20% at 100 hunger
      const deathChance = ((npc.hunger - 80) / 20) * 0.2; // 0 to 0.2 (0% to 20%)

      if (Math.random() < deathChance) {
        killNPC(npc, "Starvation", gs);
      }
    }
  }
}

export function processOldAgeDeaths(gs: GameState) {
  for (const npc of gs.npcs) {
    if (npc.age > 40) {
      const deathChance = 1 - Math.pow(0.999999, Math.pow(npc.age - 40, 2));
      if (Math.random() < deathChance) {
        killNPC(npc, "Natural Causes", gs);
      }
    }
  }
  if (gs.lord && gs.lord.age > 40) {
    const deathChance = 1 - Math.pow(0.999999, Math.pow(gs.lord.age - 40, 1));
    if (Math.random() < deathChance) {
      killLord("Natural Causes", gs);
    }
  }
}
export function processBirths(gs: GameState) {
  if (calculateDaysOfFoodRemaining(gs) > 365) {
    const birthChance =
      Math.pow(1.001, gs.npcs.filter((i) => i.age >= 16 && i.age < 50).length) -
      1;
    if (Math.random() < birthChance) {
      const newNPC: NPC = {
        id: (gs.npcs.length + gs.deadNpcs.length).toString(),
        fName: pick(firstNames),
        age: 0,
        birthday: gs.currentDay,
        stats: {
          str: 0,
          dex: 0,
        },
        job: {
          title: "None",
          stuck: false,
          priority: 0,
        },
        hunger: 0,
        statuses: {},
        nameKnown: false,
        relations: {},
      };
      gs.npcs.push(newNPC);
      log(gs, `<i>${newNPC.fName}</i> was born.`, ["Mortality"]);
      if (gs.lord) gs.lord.reignStats.born++;
    }
  }
}
