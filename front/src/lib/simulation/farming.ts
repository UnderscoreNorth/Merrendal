import { Area } from "$lib/data/areas";
import type { Villager } from "$lib/data/living";
import type { GameState } from "$lib/stores";

export function sowing(gs: GameState, area: Area) {
  let unsowedLand = area.arableLand - (area.yields["Planted Grain"] ?? 0);
  let availableCattle = 0;
  let availablePlows = 0;
  let availableFarmers: Villager[] = getFarmers(gs.npcs);

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
  area.yields["Planted Grain"] =
    (area.yields["Planted Grain"] ?? 0) + area.arableLand - unsowedLand;
}

export function growing(gs: GameState, area: Area) {
  let numAcres = area.yields["Planted Grain"] ?? 0;
  let farmersRequired = numAcres / 40;
  let availableFarmers: Villager[] = getFarmers(gs.npcs);
  if (availableFarmers.length < farmersRequired) {
    if (Math.random() > availableFarmers.length / farmersRequired) {
      area.yields["Planted Grain"] = (area.yields["Planted Grain"] ?? 0) - 0.01;
    }
  }
}

export function harvesting(gs: GameState, area: Area) {
  let remainingAcres = area.yields["Planted Grain"] ?? 0;
  let availableFarmers: Villager[] = getFarmers(gs.npcs);
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
  gs.inventory.Grain = (gs.inventory.Grain ?? 0) + bushelsHarvested;
}

function getFarmers(villagers: Villager[]) {
  return villagers
    .filter((i) => i.age >= 16)
    .sort((a, b) => {
      if ((b.skills["Farmer"] ?? 0) == (a.skills["Farmer"] ?? 0)) {
        return b.stats.STR + b.stats.CON - (a.stats.STR - a.stats.CON);
      } else {
        return (b.skills["Farmer"] ?? 0) - (a.skills["Farmer"] ?? 0);
      }
    });
}
