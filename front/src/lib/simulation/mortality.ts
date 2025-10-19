import { generateFName, type Villager } from "$lib/data/living";
import { type GameState } from "$lib/stores";
import { pick } from "$lib/util/rolls";
import { getAllBuildings } from "./buildings";
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
  // Find all couples with homes
  const couplesWithHomes = gs.npcs.filter((npc) => {
    // Must have a spouse and a home
    if (!npc.spouse || !npc.home) return false;

    // Must be of childbearing age (16-50)
    if (npc.age < 16 || npc.age >= 50) return false;

    // Check if they have any children under 4 years old
    const hasYoungChild = npc.children.some((childId) => {
      const child = gs.npcs.find((c) => c.id === childId);
      return child && child.age < 4;
    });

    // Can only give birth if they don't have young children
    return !hasYoungChild;
  });

  // Try to give birth for each eligible couple
  for (const parent of couplesWithHomes) {
    // Small chance per day (adjusted for realistic birth rates)
    const birthChance = 0.001; // ~0.1% per day = ~36.5% per year for eligible couples

    if (Math.random() < birthChance) {
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
        home: parent.home, // Assign to parents' home
        type: "Villager",
        health: 100,
      };

      // Add child to both parents' children lists
      parent.children.push(newNPC.id);
      if (parent.spouse) {
        const spouse = gs.npcs.find((npc) => npc.id === parent.spouse);
        if (spouse) {
          spouse.children.push(newNPC.id);
        }
      }

      gs.npcs.push(newNPC);
      log(gs, `<i>${newNPC.fName}</i> was born to <i>${parent.fName}</i>.`, ["Mortality"]);
      //if (gs.lord) gs.lord.reignStats.born++;
    }
  }
}
