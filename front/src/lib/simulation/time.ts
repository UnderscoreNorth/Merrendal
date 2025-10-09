import { type GameState } from "$lib/stores";
import type { NPC } from "../data/npcs";
import { rollNewSTR, rollNewDEX } from "../data/npcs";
import { processBirths, processOldAgeDeaths } from "./mortality";

export function advanceTime(gs: GameState) {
  // Advance the clock
  gs.currentDay++;
  if (gs.currentDay > 365) {
    gs.currentDay = 1;
    gs.currentYear++;
  }
  processSeasons();
  // Process birthdays and aging
  for (const npc of gs.npcs) {
    if (npc.birthday === gs.currentDay) {
      npc.age++;
      npc.stats.str = rollNewSTR(npc);
      npc.stats.dex = rollNewDEX(npc);
    }
  }
  if (gs.lord && gs.lord.birthday == gs.currentDay) gs.lord.age++;
  if (gs.lord && gs.lord.date.day == gs.currentDay) gs.lord.reign++;
  gs.dailyWorkerActivity.clear();
  processOldAgeDeaths(gs);
  processBirths(gs);
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
