import { processHungerDeaths } from "./mortality";
import { type GameState } from "$lib/stores";
import { recordLoop } from "$lib/util/recordLoop";
import { items } from "$lib/data/items";

export function calculateDailyCalorieConsumption(gs: GameState): number {
  let totalCalories = 0;
  for (const npc of gs.npcs) {
    if (npc.age >= 16 && npc.age <= 60) {
      totalCalories += 2;
    } else {
      totalCalories += 1.5;
    }
  }

  // Add lord's consumption
  if (gs.lord) {
    if (gs.lord.age >= 16 && gs.lord.age <= 60) {
      totalCalories += 2;
    } else {
      totalCalories += 1.5;
    }
  }
  return totalCalories;
}
export function getAvailableFood(gs: GameState) {
  let totalCalories = 0;
  for (const [itemName, calories] of recordLoop(gs.inventory)) {
    //@ts-ignore
    if (items[itemName].category.includes("Food") && calories !== undefined)
      totalCalories += calories;
  }
  return totalCalories;
}

export function calculateDaysOfFoodRemaining(gs: GameState): number {
  const totalCalories = getAvailableFood(gs);
  const dailyConsumption = calculateDailyCalorieConsumption(gs);

  if (dailyConsumption === 0) return Infinity;

  return totalCalories / dailyConsumption;
}

export function consumeFood(gs: GameState) {
  const availableCalories = getAvailableFood(gs);
  let totalConsumed = 0;

  // Process lord's food consumption first (lords eat first!)
  if (gs.lord) {
    const dailyRequirement = gs.lord.age >= 16 && gs.lord.age <= 60 ? 2 : 1.5;
    const lordConsumption = Math.min(dailyRequirement, availableCalories);

    // Calculate calories deficit percentage
    const caloriesDeficit = dailyRequirement - lordConsumption;
    const deficitPercentage = caloriesDeficit / dailyRequirement;

    if (deficitPercentage > 0) {
      gs.lord.hunger += deficitPercentage * 20;
      gs.lord.hunger = Math.min(gs.lord.hunger, 100);
    }

    if (lordConsumption >= dailyRequirement) {
      // Full meal reduces hunger by 20
      gs.lord.hunger = Math.max(0, gs.lord.hunger - 20);
    }

    totalConsumed += lordConsumption;
  }
  let rationing = 1;
  const daysRemaining = calculateDaysOfFoodRemaining(gs);
  if (daysRemaining <= 28 * 3) rationing = 0.8;
  if (daysRemaining <= 28) rationing = 0.5;
  if (daysRemaining <= 14) rationing = 0.2;
  // Process each NPC's food consumption and hunger
  for (const npc of gs.npcs) {
    const dailyRequirement = npc.age >= 16 && npc.age <= 60 ? 2 : 1.5;
    const personalConsumption =
      Math.min(dailyRequirement, availableCalories - totalConsumed) * rationing;

    // Calculate calories deficit percentage
    const caloriesDeficit = dailyRequirement - personalConsumption;
    const deficitPercentage = caloriesDeficit / dailyRequirement;

    if (deficitPercentage > 0) {
      npc.hunger += deficitPercentage * 20;
      npc.hunger = Math.min(npc.hunger, 100);
    }

    if (personalConsumption >= dailyRequirement) {
      // Full meal reduces hunger by 20
      npc.hunger = Math.max(0, npc.hunger - 20);
    }

    totalConsumed += personalConsumption;

    // Stop distributing food if we run out
    if (totalConsumed >= availableCalories) break;
  }

  // Update inventory - consume food items sequentially until depleted
  let caloriesToConsume = totalConsumed;

  for (const [itemName, calories] of recordLoop(gs.inventory)) {
    if (
      //@ts-ignore
      items[itemName].category.includes("Food") &&
      calories !== undefined &&
      calories > 0
    ) {
      if (caloriesToConsume <= 0) break;

      const consumedFromThisItem = Math.min(calories, caloriesToConsume);
      gs.inventory[itemName] = calories - consumedFromThisItem;
      caloriesToConsume -= consumedFromThisItem;
    }
  }

  // Process hunger-based deaths (including lord)
  processHungerDeaths(gs);
}
