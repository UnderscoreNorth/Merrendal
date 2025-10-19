import { type Area } from "$lib/data/areas";
import type { Villager } from "$lib/data/living";
import type { GameState } from "$lib/stores";
import { v4 as uuidv4 } from "uuid";

export function sowing(gs: GameState, area: Area) {
  // Get idle villagers (not already assigned work today)
  let availableFarmers: Villager[] = getIdleFarmers(gs);
  let unsowedLand = area.arableLand - (area.yields["Planted Grain"] ?? 0);

  if (unsowedLand <= 0) return;

  let availableCattle = 0;
  let availablePlows = 0;

  for (const farmer of availableFarmers) {
    if (unsowedLand <= 0) break;

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

    // Mark farmer as having worked
    gs.dailyWorkerActivity.add(farmer.id);

    // Skill up chance
    if (Math.random() > 0.7) {
      if (!farmer.skills["Farmer"]) farmer.skills["Farmer"] = 0;
      farmer.skills["Farmer"] += 0.1;
    }
  }

  const acresSowed = area.arableLand - unsowedLand - (area.yields["Planted Grain"] ?? 0);
  area.yields["Planted Grain"] = (area.yields["Planted Grain"] ?? 0) + acresSowed;
}

export function growing(gs: GameState, area: Area) {
  // Get idle villagers for tending crops
  let availableFarmers: Villager[] = getIdleFarmers(gs);
  let numAcres = area.yields["Planted Grain"] ?? 0;

  if (numAcres <= 0) return;

  let farmersRequired = numAcres / 40;

  // If we have enough farmers, tend the crops (prevents loss)
  if (availableFarmers.length >= farmersRequired) {
    // Crops are well-maintained
    for (let i = 0; i < Math.ceil(farmersRequired); i++) {
      if (i < availableFarmers.length) {
        gs.dailyWorkerActivity.add(availableFarmers[i].id);

        // Skill up chance
        if (Math.random() > 0.8) {
          if (!availableFarmers[i].skills["Farmer"]) availableFarmers[i].skills["Farmer"] = 0;
          availableFarmers[i].skills["Farmer"] += 0.05;
        }
      }
    }
  } else {
    // Not enough farmers, crops may be lost
    if (Math.random() > availableFarmers.length / farmersRequired) {
      area.yields["Planted Grain"] = (area.yields["Planted Grain"] ?? 0) - 0.01;
    }

    // Mark available farmers as working
    for (const farmer of availableFarmers) {
      gs.dailyWorkerActivity.add(farmer.id);
    }
  }
}

export function harvesting(gs: GameState, area: Area) {
  // Get idle villagers for harvesting
  let availableFarmers: Villager[] = getIdleFarmers(gs);
  let remainingAcres = area.yields["Planted Grain"] ?? 0;

  if (remainingAcres <= 0) return;

  let bushelsHarvested = 0;

  for (const farmer of availableFarmers) {
    if (remainingAcres <= 0) break;

    let skill = farmer.skills["Farmer"] ?? 0;
    let multiplier = 1 + (farmer.stats.STR + farmer.stats.CON - 10) * 0.05;
    multiplier += skill / 4;

    let acresHarvested = Math.min(0.5, remainingAcres);
    remainingAcres -= acresHarvested;
    bushelsHarvested += acresHarvested * 6 * multiplier;

    // Mark farmer as having worked
    gs.dailyWorkerActivity.add(farmer.id);

    // Skill up chance
    if (Math.random() > 0.7) {
      if (!farmer.skills["Farmer"]) farmer.skills["Farmer"] = 0;
      farmer.skills["Farmer"] += 0.1;
    }
  }

  // Reduce planted grain by harvested amount
  area.yields["Planted Grain"] = remainingAcres;

  // Add grain to inventory
  gs.inventory.Grain = (gs.inventory.Grain ?? 0) + bushelsHarvested;
}

export function startLandConversion(area: Area, targetAcres: number = 1) {
  // Calculate how much unused land is available
  const usedLand =
    area.arableLand +
    area.buildingLand +
    (area.terrain.forested * area.acres) / 100;
  const unusedLand = area.acres - usedLand;

  if (unusedLand <= 0) return false;

  const actualTarget = Math.min(targetAcres, unusedLand);

  area.currentProjects.push({
    type: "landConversion",
    targetAcres: actualTarget,
    progress: 0,
    workers: new Set(),
    id: uuidv4(),
    priority: 5,
  });

  return true;
}

export function convertToArableLand(
  gs: GameState,
  area: Area,
  availableWorkers: Villager[],
) {
  // Each worker can convert 0.1 acres per day (10 days for 1 acre)
  const acresPerWorkerPerDay = 0.1;

  // Calculate how much unused land is available
  const usedLand =
    area.arableLand +
    area.buildingLand +
    (area.terrain.forested * area.acres) / 100;
  const unusedLand = area.acres - usedLand;

  if (unusedLand <= 0) return 0;

  // Calculate total acres that can be converted
  let totalAcresToConvert = availableWorkers.length * acresPerWorkerPerDay;

  // If there's less than what we can convert, scale down the time proportionally
  // This means if only 0.05 acres are left, each worker converts it in 5 days instead of 10
  const actualAcresConverted = Math.min(totalAcresToConvert, unusedLand);

  // Add to arable land
  area.arableLand += actualAcresConverted;

  return actualAcresConverted;
}

function getIdleFarmers(gs: GameState): Villager[] {
  // Get villagers who haven't worked today and are of working age
  return gs.npcs
    .filter((i) => i.age >= 16 && !gs.dailyWorkerActivity.has(i.id))
    .sort((a, b) => {
      // Sort by farming skill, then by physical stats
      if ((b.skills["Farmer"] ?? 0) == (a.skills["Farmer"] ?? 0)) {
        return b.stats.STR + b.stats.CON - (a.stats.STR + a.stats.CON);
      } else {
        return (b.skills["Farmer"] ?? 0) - (a.skills["Farmer"] ?? 0);
      }
    });
}

export function doFarming(gs: GameState) {
  // Process farming based on season
  if (gs.season === "Spring") {
    // Sowing in spring
    for (const area of gs.areas) {
      if (area.arableLand > 0) {
        sowing(gs, area);
      }
    }
  } else if (gs.season === "Summer") {
    // Growing/tending in summer
    for (const area of gs.areas) {
      if ((area.yields["Planted Grain"] ?? 0) > 0) {
        growing(gs, area);
      }
    }
  } else if (gs.season === "Autumn") {
    // Harvesting in autumn
    for (const area of gs.areas) {
      if ((area.yields["Planted Grain"] ?? 0) > 0) {
        harvesting(gs, area);
      }
    }
  }
  // No farming work in winter
}
