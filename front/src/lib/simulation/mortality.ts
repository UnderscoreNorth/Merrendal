import { generateFName, type Villager } from "$lib/data/living";
import { type GameState } from "$lib/stores";
import { pick } from "$lib/util/rolls";
import { getAllBuildings } from "./buildings";
import { calculateDaysOfFoodRemaining } from "./food";
import { rollStats, unassignNPC } from "./living";
import { log } from "./log";
import { v4 as uuidv4 } from "uuid";

/*export function killLord(cause: string, gs: GameState) {
  const lord = gs.lord;
  if (lord == undefined) return;
  lord.causeOfDeath = cause;
  gs.log = [];
  log(gs, `<i>Lord ${lord.fName}</i> died of <i>${cause}</i>`, ["Mortality"]);
  gs.pastLords.push(lord);
  gs.lord = undefined;
}*/

export function killNPC(npc: Villager, cause: string, gs: GameState): void {
  // Set cause of death
  npc.death = {
    cause,
    time: {
      day: gs.currentDay,
      year: gs.currentYear,
      period: gs.currentPeriod,
    },
  };
  unassignNPC(gs, npc);
  // Remove from daily worker activity if present
  gs.dailyWorkerActivity.delete(npc.id);
  //if (gs.lord) gs.lord.reignStats.died++;
  // Move to dead NPCs array
  gs.deadNpcs.push(npc);
  // Remove dead NPCs from living population
  gs.npcs = gs.npcs.filter((npc) => !npc.death);
  log(gs, `${npc.age} yr old <i>${npc.fName}</i> died of <i>${cause}</i>`, [
    "Mortality",
  ]);
}
export function processHungerDeaths(gs: GameState): void {
  // Check lord hunger death first
  /*if (gs.lord && gs.lord.hunger >= 80 && gs.lord.hunger <= 100) {
    // Calculate death chance: 0% at 80 hunger, 20% at 100 hunger
    const deathChance = ((gs.lord.hunger - 80) / 20) * 0.2; // 0 to 0.2 (0% to 20%)

    if (Math.random() < deathChance) {
      killLord("Starvation", gs);
    }
  }*/

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
        //killNPC(npc, "Natural Causes", gs);
      }
    }
  }
  /*if (gs.lord && gs.lord.age > 40) {
    const deathChance = 1 - Math.pow(0.999999, Math.pow(gs.lord.age - 40, 1));
    if (Math.random() < deathChance) {
      killLord("Natural Causes", gs);
    }
  }*/
}
export function processBirths(gs: GameState) {
  if (calculateDaysOfFoodRemaining(gs) > 365) {
    const birthChance =
      Math.pow(1.001, gs.npcs.filter((i) => i.age >= 16 && i.age < 50).length) -
      1;
    if (Math.random() < birthChance) {
      // Find village for home area

      const newNPC: Villager = {
        id: uuidv4(),
        fName: generateFName(),
        age: 0,
        birthday: gs.currentDay,
        stats: rollStats(),
        job: {
          title: "None",
          stuck: false,
        },
        hunger: 0,
        status: [],
        skills: {},
        apprentices: [],
        children: [],
        equipement: [],
        home: "",
        type: "Villager",
        health: 100,
      };
      gs.npcs.push(newNPC);
      log(gs, `<i>${newNPC.fName}</i> was born.`, ["Mortality"]);
      //if (gs.lord) gs.lord.reignStats.born++;
    }
  }
}
