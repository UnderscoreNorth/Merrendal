import { type GameState } from "$lib/stores";
import { processBirths, processOldAgeDeaths } from "./mortality";

export function advanceTime(gs: GameState) {
  if (gs.currentPeriod === "Morning") {
    gs.currentPeriod = "Afternoon";
  } else if (gs.currentPeriod === "Afternoon") {
    gs.currentPeriod = "Evening";
  } else {
    gs.currentPeriod = "Morning";
  }
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
      }
    }

    processOldAgeDeaths(gs);
    processBirths(gs);
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
