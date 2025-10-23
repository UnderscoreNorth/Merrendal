import type { Area } from "$lib/data/areas";
import type { Villager } from "$lib/data/living";
import type { GameState } from "$lib/stores";
import { v4 as uuidv4 } from "uuid";
import type { Building, FieldRotationType } from "$lib/data/buildings";
import { getTotalBuildingSize } from "./buildings";

/**
 * Get what crop should be planted based on field rotation
 * 2-field: grain -> fallow -> legumes -> grain (4 year cycle)
 * 3-field: grain -> legumes -> fallow (3 year cycle)
 */
function getCurrentCrop(
  rotation: { type: FieldRotationType; currentYear: number } | undefined,
): "grain" | "legumes" | "fallow" {
  if (!rotation) return "grain"; // Default to grain if no rotation set

  if (rotation.type === "2-field") {
    // 4 year cycle: grain (0) -> fallow (1) -> legumes (2) -> grain (3)
    switch (rotation.currentYear % 4) {
      case 0:
        return "grain";
      case 1:
      case 3:
        return "fallow";
      case 2:
        return "legumes";
      default:
        return "grain";
    }
  } else {
    // 3-field rotation: 3 year cycle: grain (0) -> legumes (1) -> fallow (2)
    switch (rotation.currentYear % 3) {
      case 0:
        return "grain";
      case 1:
        return "legumes";
      case 2:
        return "fallow";
      default:
        return "grain";
    }
  }
}

/**
 * Advance the rotation year for a farm field (called once per year in winter)
 */
export function advanceRotation(farmField: Building): void {
  if (farmField.fieldRotation) {
    farmField.fieldRotation.currentYear++;
  }
}

export function sowing(gs: GameState, farmField: Building) {
  // Only process Farm Field buildings
  if (farmField.buildingType !== "Farm Field") return;

  // Get total size of the farm field (base + all upgrades)
  const farmSize = getTotalBuildingSize(farmField);
  if (farmSize <= 0) return;

  // Initialize yields if not present
  if (!farmField.yields) farmField.yields = {};

  // Check what should be planted based on rotation
  const currentCrop = getCurrentCrop(farmField.fieldRotation);

  // If it's a fallow year, don't plant anything
  if (currentCrop === "fallow") {
    return;
  }

  // Get idle villagers (not already assigned work today)
  let availableFarmers: Villager[] = getIdleFarmers(gs);

  const cropKey = currentCrop === "grain" ? "Planted Grain" : "Planted Legumes";
  let unsowedLand = farmSize - (farmField.yields[cropKey] ?? 0);

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

  const acresSowed = farmSize - unsowedLand - (farmField.yields[cropKey] ?? 0);
  farmField.yields[cropKey] = (farmField.yields[cropKey] ?? 0) + acresSowed;
}

export function growing(gs: GameState, farmField: Building) {
  // Only process Farm Field buildings
  if (farmField.buildingType !== "Farm Field") return;
  if (!farmField.yields) return;

  // Get idle villagers for tending crops
  let availableFarmers: Villager[] = getIdleFarmers(gs);

  // Check what crop is planted
  const currentCrop = getCurrentCrop(farmField.fieldRotation);
  if (currentCrop === "fallow") return;

  const cropKey = currentCrop === "grain" ? "Planted Grain" : "Planted Legumes";
  let numAcres = farmField.yields[cropKey] ?? 0;

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
          if (!availableFarmers[i].skills["Farmer"])
            availableFarmers[i].skills["Farmer"] = 0;
          availableFarmers[i].skills["Farmer"] += 0.05;
        }
      }
    }
  } else {
    // Not enough farmers, crops may be lost
    if (Math.random() > availableFarmers.length / farmersRequired) {
      farmField.yields[cropKey] = (farmField.yields[cropKey] ?? 0) - 0.01;
    }

    // Mark available farmers as working
    for (const farmer of availableFarmers) {
      gs.dailyWorkerActivity.add(farmer.id);
    }
  }
}

export function harvesting(gs: GameState, farmField: Building) {
  // Only process Farm Field buildings
  if (farmField.buildingType !== "Farm Field") return;
  if (!farmField.yields) return;

  // Get idle villagers for harvesting
  let availableFarmers: Villager[] = getIdleFarmers(gs);

  // Check what crop is planted
  const currentCrop = getCurrentCrop(farmField.fieldRotation);
  if (currentCrop === "fallow") return;

  const cropKey = currentCrop === "grain" ? "Planted Grain" : "Planted Legumes";
  const harvestKey = currentCrop === "grain" ? "Grain" : "Legumes";

  let remainingAcres = farmField.yields[cropKey] ?? 0;

  if (remainingAcres <= 0) return;

  let bushelsHarvested = 0;

  for (const farmer of availableFarmers) {
    if (remainingAcres <= 0) break;

    let skill = farmer.skills["Farmer"] ?? 0;
    let multiplier = 1 + (farmer.stats.STR + farmer.stats.CON - 10) * 0.05;
    multiplier += skill / 4;

    let acresHarvested = Math.min(0.5, remainingAcres);
    remainingAcres -= acresHarvested;

    // Legumes yield slightly less than grain
    const yieldPerAcre = currentCrop === "grain" ? 6 : 5;
    bushelsHarvested += acresHarvested * yieldPerAcre * multiplier;

    // Mark farmer as having worked
    gs.dailyWorkerActivity.add(farmer.id);

    // Skill up chance
    if (Math.random() > 0.7) {
      if (!farmer.skills["Farmer"]) farmer.skills["Farmer"] = 0;
      farmer.skills["Farmer"] += 0.1;
    }
  }

  // Reduce planted crop by harvested amount
  farmField.yields[cropKey] = remainingAcres;

  // Add harvest to inventory
  gs.inventory[harvestKey] = (gs.inventory[harvestKey] ?? 0) + bushelsHarvested;
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
    areaID: area.areaID,
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

/**
 * Get all Farm Field buildings from all areas
 */
function getAllFarmFields(gs: GameState): Building[] {
  const farmFields: Building[] = [];
  for (const area of Object.values(gs.areas)) {
    for (const building of area.buildings) {
      if (
        building.buildingType === "Farm Field" &&
        building.status === "built"
      ) {
        farmFields.push(building);
      }
    }
  }
  return farmFields;
}

export function doFarming(gs: GameState) {
  // Process farming based on season
  const farmFields = getAllFarmFields(gs);

  if (gs.season === "Spring") {
    // Sowing in spring
    for (const farmField of farmFields) {
      if (getTotalBuildingSize(farmField) > 0) {
        sowing(gs, farmField);
      }
    }
  } else if (gs.season === "Summer") {
    // Growing/tending in summer
    for (const farmField of farmFields) {
      if (
        (farmField.yields?.["Planted Grain"] ?? 0) > 0 ||
        (farmField.yields?.["Planted Legumes"] ?? 0) > 0
      ) {
        growing(gs, farmField);
      }
    }
  } else if (gs.season === "Autumn") {
    // Harvesting in autumn
    for (const farmField of farmFields) {
      if (
        (farmField.yields?.["Planted Grain"] ?? 0) > 0 ||
        (farmField.yields?.["Planted Legumes"] ?? 0) > 0
      ) {
        harvesting(gs, farmField);
      }
    }
  } else if (gs.season === "Winter" && gs.currentDay === 1) {
    // Advance rotation at the start of winter (end of farming year)
    for (const farmField of farmFields) {
      if (getTotalBuildingSize(farmField) > 0) {
        advanceRotation(farmField);
      }
    }
  }
}
