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
