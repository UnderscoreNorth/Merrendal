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
  let rationing = 1;
  // Process each NPC's food consumption and hunger
  const drinkItems = recordLoop(items)
    .filter(([itemName, item]) => item.category.includes("Drink"))
    .map(([itemName, item]) => itemName);
  const carbItems = recordLoop(items)
    .filter(([itemName, item]) => item.category.includes("Carbs"))
    .map(([itemName, item]) => itemName);
  const proteinItems = recordLoop(items)
    .filter(([itemName, item]) => item.category.includes("Protein"))
    .map(([itemName, item]) => itemName);
  const vitaminItems = recordLoop(items)
    .filter(([itemName, item]) => item.category.includes("Vitamins"))
    .map(([itemName, item]) => itemName);
  for (const npc of gs.npcs) {
    const dailyRequirement = npc.age >= 16 && npc.age <= 60 ? 2 : 1.5;

    let itemsEaten = 0;
    const categories = [
      { items: drinkItems, name: "Drink", baseAmount: 1 },
      { items: carbItems, name: "Carbs", baseAmount: 1 },
      { items: proteinItems, name: "Protein", baseAmount: 0.5 },
      { items: vitaminItems, name: "Vitamins", baseAmount: 0.5 },
    ];

    // Try to consume one random item from each category
    for (const category of categories) {
      // Filter for items that are available in inventory
      const availableItems = category.items.filter((itemName) => {
        const amount = gs.inventory[itemName as keyof typeof gs.inventory];
        return (
          amount !== undefined &&
          amount > dailyRequirement * category.baseAmount
        );
      });

      if (availableItems.length > 0) {
        // Pick a random available item
        const randomItem =
          availableItems[Math.floor(Math.random() * availableItems.length)];

        // Consume the item
        const currentAmount =
          gs.inventory[randomItem as keyof typeof gs.inventory] ?? 0;
        if (currentAmount > 0) {
          gs.inventory[randomItem as keyof typeof gs.inventory] =
            currentAmount - dailyRequirement * category.baseAmount;
          itemsEaten++;
        }
      }
    }

    // Calculate hunger change based on items eaten
    // 4 items = -20 hunger
    // 2 items = 0 hunger change
    // 0 items = +20 hunger
    // Linear scale: hungerChange = 20 - (itemsEaten * 10)
    const hungerChange = 10 - itemsEaten * 5;
    let prevHunger = npc.hunger;
    npc.hunger = Math.max(0, Math.min(100, npc.hunger + hungerChange));
    if (npc.hunger > 50 && prevHunger <= 50 && itemsEaten >= 1) npc.hunger = 50;

    // Calculate health change based on items eaten
    let healthChange = 0;

    if (itemsEaten < 3 && Math.random() > 0.9) {
      // Health goes down, up to -6 at 0 items
      // Linear scale: 0 items = -6, 1 item = -4, 2 items = -2
      healthChange = -3 + itemsEaten;
    } else if (itemsEaten === 3) {
      // 50% chance to gain 1 health
      if (Math.random() > 0.9) {
        healthChange = 1;
      }
    } else if (itemsEaten === 4) {
      // 50% chance to gain 2 health
      if (Math.random() > 0.5) {
        healthChange = 1;
      }
    }
    let prevHealth = npc.health;
    npc.health = Math.max(0, Math.min(100, npc.health + healthChange));
    if (npc.health < 50 && prevHealth >= 50 && itemsEaten >= 2) npc.health = 50;
  }

  // Process hunger-based deaths (including lord)
  processHungerDeaths(gs);
}
