import { generateFName, type Villager } from "$lib/data/living";
import { type GameState } from "$lib/stores";
import { assignVillagerToHome, getAllBuildings } from "./buildings";
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

/**
 * Evicts children from a home after both parents have died
 * Attempts to find another family to take them in
 */
function evictChildren(
  gs: GameState,
  homeId: string,
  deceasedParent: Villager,
): void {
  // Find all children living in this home
  const children = gs.npcs.filter(
    (npc) => npc.home === homeId && deceasedParent.children.includes(npc.id),
  );

  if (children.length === 0) return;

  // Try to find another family to take in the children
  // Prioritize families with space and no young children
  const potentialFamilies = gs.npcs.filter(
    (npc) =>
      npc.home && // Has a home
      npc.spouse && // Is married
      npc.home !== homeId && // Different home
      npc.age >= 18 && // Adult
      npc.children.length < 4, // Not too many children already
  );

  // Sort by fewest children (families with fewer children take priority)
  potentialFamilies.sort((a, b) => a.children.length - b.children.length);

  let newFamily: Villager | undefined;
  if (potentialFamilies.length > 0) {
    newFamily = potentialFamilies[0];
  }

  for (const child of children) {
    child.home = ""; // Evict from current home

    if (newFamily) {
      // Assign to new family
      child.home = newFamily.home;
      // Don't add to children list - they're not biological children
      log(
        gs,
        `<i>${child.fName}</i> (${child.age}) was taken in by <i>${newFamily.fName}</i>'s family after both parents died.`,
        ["Mortality"],
      );
    } else {
      log(
        gs,
        `<i>${child.fName}</i> (${child.age}) was orphaned after both parents died. No family could take them in.`,
        ["Mortality"],
      );
    }
  }

  // The old home is now empty and available for new families
}

export function killNPC(
  npc: Villager,
  cause: string,
  gs: GameState,
  decreaseStability: boolean = true,
): void {
  // Set cause of death
  npc.death = {
    cause,
    time: {
      day: gs.currentDay,
      year: gs.currentYear,
      period: gs.currentPeriod,
    },
  };

  // Check if both spouses are now dead
  if (npc.spouse && npc.home) {
    const spouse = gs.npcs.find((n) => n.id === npc.spouse);
    const spouseIsDead = spouse?.death !== undefined;

    if (spouseIsDead || !spouse) {
      // Both spouses are dead - evict all children from this home
      evictChildren(gs, npc.home, npc);
    }
  }

  unassignNPC(gs, npc);
  //if (gs.lord) gs.lord.reignStats.died++;
  // Move to dead NPCs array
  gs.deadNpcs.push(npc);
  // Remove dead NPCs from living population
  gs.npcs = gs.npcs.filter((npc) => !npc.death);
  if (decreaseStability) gs.village.stability--;
  log(gs, `${npc.age} yr old <i>${npc.fName}</i> died of <i>${cause}</i>`, [
    "Mortality",
  ]);
}

export function processOldAgeDeaths(gs: GameState) {
  for (const npc of gs.npcs) {
    if (npc.age > 40) {
      const deathChance = 1 - Math.pow(0.999999, Math.pow(npc.age - 40, 2));
      if (Math.random() < deathChance) {
        killNPC(npc, "Natural Causes", gs, false);
      }
    }
  }
}
/**
 * Checks if two villagers share any parents (siblings or half-siblings)
 */
function shareParents(villager1: Villager, villager2: Villager): boolean {
  const parents1 = villager1.parents.filter((p) => p !== undefined);
  const parents2 = villager2.parents.filter((p) => p !== undefined);

  if (parents1.length === 0 || parents2.length === 0) return false;

  return parents1.some((p1) => parents2.includes(p1));
}

/**
 * Processes marriages for villagers turning 18
 * Unmarried 18-year-olds will try to marry the closest-aged unmarried villager
 * that doesn't share parents with them
 */
export function processMarriages(gs: GameState): void {
  const availableHome = getAllBuildings(gs).find(
    (b) =>
      b.buildingType === "Burgage" && !gs.npcs.some((npc) => npc.home === b.id),
  );
  if (availableHome == undefined) return;
  // Find all unmarried villagers who are exactly 18 (just turned 18)
  const eligibleVillagers = gs.npcs.filter(
    (npc) => npc.age === 18 && !npc.spouse,
  );

  for (const villager of eligibleVillagers) {
    // Find all other unmarried 18+ villagers who don't share parents
    const potentialSpouses = gs.npcs.filter(
      (npc) =>
        npc.id !== villager.id &&
        npc.age >= 18 &&
        !npc.spouse &&
        !shareParents(villager, npc),
    );

    if (potentialSpouses.length === 0) continue;

    // Sort by age difference (closest in age first)
    potentialSpouses.sort((a, b) => {
      const ageDiffA = Math.abs(a.age - villager.age);
      const ageDiffB = Math.abs(b.age - villager.age);
      return ageDiffA - ageDiffB;
    });

    const spouse = potentialSpouses[0];

    // Marry them
    villager.spouse = spouse.id;
    spouse.spouse = villager.id;
    villager.home = "";
    spouse.home = "";

    // Find an available Burgage (home)

    assignVillagerToHome(gs, availableHome.id);
    log(
      gs,
      `<i>${villager.fName}</i> (${villager.age}) married <i>${spouse.fName}</i> (${spouse.age}) and moved into a new home.`,
      ["Mortality"],
    );
  }
}

export function processBirths(gs: GameState) {
  // Find all couples with homes
  const couplesWithHomes = gs.npcs.filter((npc) => {
    // Must have a spouse and a home
    if (!npc.spouse || !npc.home) return false;

    // Must be of childbearing age (16-50)
    if (npc.age < 16 || npc.age >= 40) return false;

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
    const birthChance = 0.001 * (gs.village.stability / 100); // ~0.1% per day = ~36.5% per year for eligible couples

    if (Math.random() < birthChance) {
      const spouse = parent.spouse
        ? gs.npcs.find((npc) => npc.id === parent.spouse)
        : undefined;

      const newNPC: Villager = {
        id: uuidv4(),
        fName: generateFName(),
        age: 0,
        birthday: gs.currentDay,
        stats: rollStats(),
        job: {
          title: "",
          stuck: false,
        },
        hunger: "Comfortable",
        status: [],
        skills: {},
        apprentices: [],
        children: [],
        parents: [parent.id, spouse?.id], // Track both parents
        equipement: [],
        home: parent.home, // Assign to parents' home
        type: "Villager",
        health: "Healthy",
        warmth: "Comfortable",
        comfort: 50,
      };

      // Add child to both parents' children lists
      parent.children.push(newNPC.id);
      if (spouse) {
        spouse.children.push(newNPC.id);
      }

      gs.npcs.push(newNPC);
      log(gs, `<i>${newNPC.fName}</i> was born to <i>${parent.fName}</i>.`, [
        "Mortality",
      ]);
      //if (gs.lord) gs.lord.reignStats.born++;
    }
  }
}
