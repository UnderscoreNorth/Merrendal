import type { GameState, type TimePeriod } from "$lib/stores";
import type { NPC } from "../data/npcs";
import { rollNewSTR, rollNewDEX } from "../data/npcs";
import { killLord, processBirths, processOldAgeDeaths } from "./mortality";

export function advanceTime(gs: GameState) {
  // Advance through time periods: Morning -> Afternoon -> Evening -> (next day) Morning
  if (gs.currentPeriod == "Morning") {
    gs.currentDay++;

    if (gs.currentDay > 365) {
      gs.currentDay = 1;
      gs.currentYear++;
    }

    processSeasons();

    // Process birthdays and aging (once per day)
    for (const npc of gs.npcs) {
      if (npc.birthday === gs.currentDay) {
        npc.age++;
        npc.stats.str = rollNewSTR(npc);
        npc.stats.dex = rollNewDEX(npc);
      }
    }
    if (gs.lord && gs.lord.birthday == gs.currentDay) gs.lord.age++;
    if (gs.lord && gs.lord.date.day == gs.currentDay) gs.lord.reign++;

    processOldAgeDeaths(gs);
    processBirths(gs);

    // Check for overthrow conditions (once per day)
    processOverthrowCheck(gs);
  }
  // Clear worker activity and reset area action each period
  gs.dailyWorkerActivity.clear();
  gs.areaActionTaken = false;
  function processSeasons() {
    let day = gs.currentDay;
    if (day > 80 && gs.season == "Spring") {
      const chance = (100 - day) / 20;
      if (chance < Math.random()) gs.season = "Summer";
    }
    if (day > 170 && gs.season == "Summer") {
      const chance = (190 - day) / 20;
      if (chance < Math.random()) gs.season = "Autumn";
    }
    if (day > 260 && gs.season == "Autumn") {
      const chance = (280 - day) / 20;
      if (chance < Math.random()) gs.season = "Winter";
    }
    if ((day > 350 || day < 100) && gs.season == "Winter") {
      if (day < 100) day += 365;
      const chance = (370 - day) / 20;
      if (chance < Math.random()) gs.season = "Spring";
    }
  }
}

/**
 * Check if the lord should be overthrown due to low trust/authority
 * Daily chance increases as trust/authority decrease
 */
function processOverthrowCheck(gs: GameState) {
  if (!gs.lord) return;

  const trust = gs.village.trust;
  const authority = gs.village.authority;

  // Calculate overthrow chance based on trust and authority
  let overthrowChance = 0;

  // Trust below 200 (Rebellious): Starts becoming dangerous
  if (trust < 200) {
    overthrowChance += (200 - trust) / 2000; // 0% at 200, up to 10% at 0
  }

  // Authority below 200 (Anarchy): Can't enforce rule
  if (authority < 200) {
    overthrowChance += (200 - authority) / 2000; // 0% at 200, up to 10% at 0
  }

  // Both low is extremely dangerous - multiply effect
  if (trust < 200 && authority < 200) {
    overthrowChance *= 2; // Double the chance if both are critically low
  }

  // Additional scaling for extremely low values
  if (trust < 100) {
    overthrowChance += 0.05; // Extra 5% if trust is critically low
  }
  if (authority < 100) {
    overthrowChance += 0.05; // Extra 5% if authority is critically low
  }

  // Cap at 50% daily chance
  overthrowChance = Math.min(0.5, overthrowChance);

  // Roll for overthrow
  if (Math.random() < overthrowChance) {
    triggerOverthrow(gs, trust, authority);
  }
}

/**
 * Execute the overthrow - kill or exile the lord
 */
function triggerOverthrow(gs: GameState, trust: number, authority: number) {
  if (!gs.lord) return;

  // Determine overthrow type based on trust/authority levels
  let overthrowType: "rebellion" | "coup" | "exile" | "execution";

  if (trust < 100 && authority < 100) {
    // Both extremely low: Violent execution
    overthrowType = "execution";
  } else if (trust < 100) {
    // Very low trust: Popular rebellion
    overthrowType = "rebellion";
  } else if (authority < 100) {
    // Very low authority: Military coup
    overthrowType = "coup";
  } else {
    // Low but not critical: Forced exile
    overthrowType = "exile";
  }

  // Create overthrow notification
  gs.choiceEvents.push(
    createOverthrowNotification(overthrowType, gs.lord.fName),
  );

  // Remove the lord
  if (overthrowType === "exile") {
    gs.lord.causeOfDeath = "Overthrown and exiled";
  } else if (overthrowType === "execution") {
    gs.lord.causeOfDeath = "Executed by the people";
  } else if (overthrowType === "rebellion") {
    gs.lord.causeOfDeath = "Killed in popular rebellion";
  } else {
    gs.lord.causeOfDeath = "Overthrown in coup";
  }
  killLord(gs.lord.causeOfDeath, gs);

  // Reset trust and authority to neutral after overthrow
  gs.village.trust = 500;
  gs.village.authority = 500;
}

/**
 * Create notification for overthrow event
 */
function createOverthrowNotification(
  type: "rebellion" | "coup" | "exile" | "execution",
  lordName: string,
) {
  const notifications = {
    rebellion: {
      title: "Popular Rebellion!",
      desc: `The people have had enough! A massive uprising has swept through the village. Lord ${lordName} was caught by the mob and killed in the chaos. The villagers declare they will choose their next leader more carefully.`,
    },
    coup: {
      title: "Military Coup!",
      desc: `Without authority to command respect, Lord ${lordName}'s guards have turned against them. In a swift military coup, the lord has been overthrown and killed. The soldiers now await new leadership.`,
    },
    exile: {
      title: "Forced into Exile",
      desc: `The villagers and guards have united in their dissatisfaction with Lord ${lordName}. Rather than violence, they've given an ultimatum: leave or face worse consequences. The lord has fled into exile, never to return.`,
    },
    execution: {
      title: "Public Execution!",
      desc: `With neither trust nor authority, Lord ${lordName}'s rule has collapsed utterly. The villagers stormed the manor, seized the lord, and held a makeshift trial. The sentence was death. Lord ${lordName} has been publicly executed in the village square.`,
    },
  };

  const notification = notifications[type];

  return {
    id: `overthrow_${type}`,
    title: notification.title,
    desc: notification.desc,
    choices: () => [
      {
        desc: "A new lord must be chosen...",
        effects: () => {},
      },
    ],
  };
}
