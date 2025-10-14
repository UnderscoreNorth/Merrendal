import type { Villager } from "$lib/data/living";

function sowing() {
  //get # acres not sowed yet.
  //get # of available cattle
  //get # of available plows
  //get # of available farmers
  let unsowedLand = 0;
  let availableCattle = 0;
  let availablePlows = 0;
  let availableFarmers: Villager[] = [];

  for (const farmer of availableFarmers) {
    let skill = farmer.skills["Farmer"] ?? 0;
    let multiplier = 1 + (farmer.stats.STR + farmer.stats.CON - 10) * 0.05;
    multiplier += skill / 4;
    if (availableCattle && availablePlows) {
      availableCattle--;
      availablePlows--;
      unsowedLand -= 0.5 * multiplier;
    } else if (availablePlows) {
      availablePlows--;
      unsowedLand -= 0.5 * 0.1 * multiplier;
    } else {
      unsowedLand -= 0.5 * 0.05 * multiplier;
    }
    if (unsowedLand <= 0) break;
  }
}

function growing() {
  let currentYield = 0;
  let numAcres = 0;
  let farmersRequired = numAcres / 40;
  let availableFarmers = 0;
  if (availableFarmers < farmersRequired) {
    if (Math.random() > availableFarmers / farmersRequired) {
      currentYield -= 0.01;
    }
  }
}

function harvesting() {
  let remainingAcres = 0;
  let availableFarmers: Villager[] = [];
  let bushelsHarvested = 0;
  for (const farmer of availableFarmers) {
    let skill = farmer.skills["Farmer"] ?? 0;
    let multiplier = 1 + (farmer.stats.STR + farmer.stats.CON - 10) * 0.05;
    multiplier += skill / 4;
    let acresHarvested = Math.min(0.5, remainingAcres);
    remainingAcres -= acresHarvested;
    bushelsHarvested = acresHarvested * 6 * multiplier;
    if (remainingAcres <= 0) break;
  }
}
