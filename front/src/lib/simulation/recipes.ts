import { recipes } from "$lib/data/recipes";
import type { Recipe } from "$lib/data/recipes";
import type { ItemName, items } from "$lib/data/items";
import type { GameState } from "$lib/stores";
import type { Building } from "$lib/data/buildings";
import { assignNPCs, increaseSkill, getSkill } from "$lib/data/npcs";

export function findBuildingsForRecipe(gs: GameState, recipe: Recipe) {
  const availableBuildings = [];

  if (!recipe.buildings || recipe.buildings.length === 0) {
    return [];
  }

  for (const area of gs.areas) {
    for (const building of area.buildings) {
      if (
        building.status === "Built" &&
        recipe.buildings.includes(building.type) &&
        building.workers.size > 0
      ) {
        availableBuildings.push(building);
      }
    }
  }

  return availableBuildings;
}

export function calculateTotalWorkers(buildings: any[]) {
  let totalWorkers = 0;
  for (const building of buildings) {
    totalWorkers += building.workers.length;
  }
  return totalWorkers;
}

export function calculateAvailableWorkers(
  buildings: any[],
  dailyWorkerActivity: Set<string>,
) {
  let availableWorkers = 0;
  for (const building of buildings) {
    for (const workerId of building.workers) {
      if (!dailyWorkerActivity.has(workerId.toString())) {
        availableWorkers++;
      }
    }
  }
  return availableWorkers;
}

export function markWorkersAsUsed(
  buildings: any[],
  batches: number,
  dailyWorkerActivity: Set<string>,
) {
  let workersUsed = 0;

  for (const building of buildings) {
    for (const workerId of building.workers) {
      if (workersUsed >= batches) break;
      if (!dailyWorkerActivity.has(workerId.toString())) {
        dailyWorkerActivity.add(workerId.toString());
        workersUsed++;
      }
    }
    if (workersUsed >= batches) break;
  }
}

export function canProduceRecipe(gs: GameState, recipe: Recipe) {
  if (recipe.input.length == 0) return true;
  return recipe.input.every((input) => {
    return (gs.inventory[input.type] || 0) >= input.num;
  });
}

export function calculateMaxBatches(
  gs: GameState,
  recipe: Recipe,
  maxWorkers: number,
) {
  let maxBatches = maxWorkers; // Each available worker can produce one batch per day

  for (const input of recipe.input) {
    const available = gs.inventory[input.type] || 0;
    const possibleBatches = Math.floor(available / input.num);
    maxBatches = Math.min(maxBatches, possibleBatches);
  }

  return maxBatches;
}

export function processRecipe(
  gs: GameState,
  recipe: Recipe,
  building: Building,
  batches: number,
  priority: number,
) {
  // Check if work can be done during this time period
  const canWork =
    gs.currentPeriod !== "Evening" || recipe.worksAtNight === true;
  if (!canWork) return;

  // Special handling for Archive building
  if (building.type === "Archive") {
    processArchiveRecipe(gs, building);
    return;
  }

  const availableBatches = Math.min(
    batches,
    Math.min(
      ...recipe.input.map((input) => {
        return Math.ceil((gs.inventory[input.type] ?? 0) / input.num);
      }),
    ),
  );
  let availableWorkers = gs.npcs.filter(
    (npc) =>
      building.workers.has(Number(npc.id)) &&
      !gs.dailyWorkerActivity.has(npc.id),
  );
  if (availableWorkers.length < availableBatches) {
    const remainingSlots = building.maxPops - building.workers.size;

    assignNPCs(gs, building, priority, remainingSlots);
    availableWorkers = gs.npcs.filter(
      (npc) =>
        building.workers.has(Number(npc.id)) &&
        !gs.dailyWorkerActivity.has(npc.id),
    );
  }
  for (
    let i = 0;
    i < Math.min(availableWorkers.length, availableBatches);
    i++
  ) {
    const npc = availableWorkers[i];
    if (!npc) break;
    gs.dailyWorkerActivity.add(npc.id);

    // Consume inputs
    for (const input of recipe.input) {
      gs.inventory[input.type] = (gs.inventory[input.type] || 0) - input.num;
    }

    // Skill-based double yield chance (skill% chance for 2x output)
    const occupation = npc.job.title;
    const skill = getSkill(npc, occupation);
    const doubleYield = Math.random() * 100 < skill;
    const yieldMultiplier = doubleYield ? 2 : 1;

    // Produce outputs
    for (const output of recipe.output) {
      gs.inventory[output.type] =
        (gs.inventory[output.type] || 0) + output.num * yieldMultiplier;
    }

    // 50% chance to increase skill by 0.01%
    if (Math.random() < 0.5) {
      increaseSkill(npc, occupation, 0.02);
    }
  }
}

/**
 * Special recipe processing for Archive building
 * Copies game logs to lord's logs array while archivist is working
 */
function processArchiveRecipe(gs: GameState, building: Building) {
  if (!gs.lord) return;

  // Check if there's an archivist working
  const availableWorkers = gs.npcs.filter(
    (npc) =>
      building.workers.has(Number(npc.id)) &&
      !gs.dailyWorkerActivity.has(npc.id),
  );

  if (availableWorkers.length === 0) {
    // Try to assign an archivist if none are working
    const remainingSlots = building.maxPops - building.workers.size;
    assignNPCs(gs, building, 5, remainingSlots); // Medium priority
    return;
  }

  // Mark archivist as having worked
  const archivist = availableWorkers[0];
  gs.dailyWorkerActivity.add(archivist.id);

  // Copy new logs from game log to lord's archive
  // Only copy logs that aren't already in the lord's logs
  const lastArchivedLogIndex = gs.lord.logs.length;

  // Get any new logs from the game log that haven't been archived yet
  for (let i = lastArchivedLogIndex; i < gs.log.length; i++) {
    const logEntry = gs.log[i];
    // Copy the log entry to the lord's archive
    gs.lord.logs.push({ ...logEntry });
  }

  // 50% chance to increase skill
  if (Math.random() < 0.5) {
    increaseSkill(archivist, "Archivist", 0.02);
  }
}

/*export function processRecipeWithBuildings(
  gs: GameState,
  recipe: Recipe,
) {
  // Check if this recipe should be produced based on stockpile rules
  if (!shouldProduceRecipe(recipe, gs)) return false;

  // Find all built buildings of required types with workers
  const availableBuildings = findBuildingsForRecipe(gs, recipe);

  if (availableBuildings.length === 0) return false;

  // Calculate available workers (those who haven't worked today)
  const availableWorkers = calculateAvailableWorkers(
    availableBuildings,
    gs.dailyWorkerActivity,
  );

  if (availableWorkers === 0) return false;

  // Check if we have enough input materials
  if (!canProduceRecipe(gs, recipe)) return false;

  // Calculate max batches we can produce
  const maxBatches = calculateMaxBatches(gs, recipe, availableWorkers);

  if (maxBatches > 0) {
    // Mark workers as used for today
    markWorkersAsUsed(
      availableBuildings,
      maxBatches,
      gs.dailyWorkerActivity,
    );

    // Process the recipe
    processRecipe(gs, recipe, maxBatches);
    return true;
  }

  return false;
}*/

export function recipeProducesStockpileItems(recipe: Recipe): boolean {
  return recipe.output.some((output) => {
    const item = items[output.type];
    return "stockpile" in item && item.stockpile == true;
  });
}

export function isNonStockpileItemNeeded(
  itemType: ItemName,
  gs: GameState,
): boolean {
  const item = items[itemType];
  if ("stockpile" in item && item.stockpile == true) {
    return true;
  }

  // Find recipes that use this non-stockpile item as input and produce stockpile items
  const dependentRecipes = recipes.filter(
    (recipe) =>
      recipe.input.some((input) => input.type === itemType) &&
      recipeProducesStockpileItems(recipe),
  );

  // Check if any of these recipes need more of this item
  for (const depRecipe of dependentRecipes) {
    // Find buildings that can process this dependent recipe
    const buildings = findBuildingsForRecipe(gs, depRecipe);
    if (buildings.length === 0) continue;

    // Check if we need more of this item for the dependent recipe
    const currentAmount = gs.inventory[itemType] || 0;
    const neededForOneRecipe =
      depRecipe.input.find((input) => input.type === itemType)?.num || 0;

    // We need this item if we have less than what's needed for one recipe batch
    if (currentAmount < neededForOneRecipe) {
      return true;
    }
  }

  return false;
}

export function shouldProduceRecipe(recipe: Recipe, gs: GameState): boolean {
  // If recipe produces stockpile items, always allow it
  if (recipeProducesStockpileItems(recipe)) {
    return true;
  }

  // If recipe produces non-stockpile items, check if they're needed
  return recipe.output.some((output) =>
    isNonStockpileItemNeeded(output.type, gs),
  );
}
