import { items } from "$lib/data/items";
import { type GameState } from "$lib/stores";
import { invAdd, invGet } from "$lib/util/inventory";
import { recordLoop } from "$lib/util/recordLoop";
import { getAllBuildings } from "./buildings";
import { killNPC } from "./mortality";

export function calculateWarmth(gs: GameState) {
  if (gs.season == "Summer") {
    gs.npcs.forEach((i) => {
      i.warmth = "Comfortable";
    });
    return;
  }
  if (gs.currentPeriod == "Evening") {
    let freezing = gs.npcs
      .filter((i) => i.warmth == "Freezing")
      .map((i) => i.id);
    gs.npcs.forEach((i) => {
      i.warmth = gs.season == "Winter" ? "Freezing" : "Cold";
    });
    let fireWoodCost = gs.season == "Winter" ? 30 : 15;
    for (const building of getAllBuildings(gs).filter(
      (i) => i.buildingType == "Burgage",
    )) {
      const occupants = gs.npcs.filter((i) => i.home == building.id);
      if (!occupants.length) continue;
      if (invGet(gs, "Lumber") >= fireWoodCost) {
        invAdd(gs, "Lumber", -fireWoodCost);
        occupants.forEach((i) => {
          i.warmth = gs.season == "Winter" ? "Cold" : "Comfortable";
          //Become comfortable if wool jacket is equipped
        });
      }
    }
    gs.npcs.forEach((i) => {
      if (i.warmth == "Freezing" && Math.random() > 0.5)
        killNPC(i, "freezing temperatures", gs);
    });
  } else if (gs.season == "Winter") {
    //Become comfortable if wool jacket is equipped
  }
}

export function calculateFood(gs: GameState) {
  let rationing = 1;
  // Process each NPC's food consumption and hunger
  const drinkItems = recordLoop(items)
    //@ts-ignore
    .filter(([itemName, item]) => item.category.includes("Drink"))
    .map(([itemName, item]) => itemName);
  const carbItems = recordLoop(items)
    //@ts-ignore
    .filter(([itemName, item]) => item.category.includes("Carbs"))
    .map(([itemName, item]) => itemName);
  const proteinItems = recordLoop(items)
    //@ts-ignore
    .filter(([itemName, item]) => item.category.includes("Protein"))
    .map(([itemName, item]) => itemName);
  const vitaminItems = recordLoop(items)
    //@ts-ignore
    .filter(([itemName, item]) => item.category.includes("Vitamins"))
    .map(([itemName, item]) => itemName);

  const categories = [
    { items: drinkItems, name: "Drink", baseAmount: 1 },
    { items: carbItems, name: "Carbs", baseAmount: 1 },
    { items: proteinItems, name: "Protein", baseAmount: 0.5 },
    { items: vitaminItems, name: "Vitamins", baseAmount: 0.5 },
  ] as const;
  const hungerItems = ["Drink", "Carbs", "Protein"];
  const healthItems = ["Drink", "Protein", "Vitamins"];
  for (const npc of gs.npcs) {
    const dailyRequirement = npc.age >= 16 && npc.age <= 60 ? 2 : 1.5;

    let hungerFed = 0;
    let healthFed = 0;
    const starving = npc.hunger == "Starving";
    for (const category of categories) {
      const availableItems = category.items.filter((itemName) => {
        const amount = invGet(gs, itemName);
        return (
          amount !== undefined &&
          amount > dailyRequirement * category.baseAmount
        );
      });
      if (availableItems.length > 0) {
        const randomItem =
          availableItems[Math.floor(Math.random() * availableItems.length)];
        invAdd(
          gs,
          randomItem,
          dailyRequirement * -category.baseAmount * rationing,
        );
        if (hungerItems.includes(category.name)) {
          hungerFed += rationing;
        }
        if (healthItems.includes(category.name)) {
          healthFed += rationing;
        }
      }
    }
    if (hungerFed == 3) {
      npc.hunger = "Well Fed";
    } else if (hungerFed >= 2) {
      npc.hunger = "Comfortable";
    } else if (hungerFed >= 1) {
      npc.hunger = "Hungry";
    } else {
      npc.hunger = "Starving";
      if (starving && Math.random() > 0.9) killNPC(npc, "starvation", gs);
    }
    if (npc.health == "Malnutritioned") {
      if (healthFed >= 2 && Math.random() > 0.9) npc.health = "Stable";
    } else if (npc.health == "Stable") {
      if (healthFed == 3 && Math.random() > 0.9) {
        npc.health = "Healthy";
      } else if (healthFed < 2 && Math.random() > 0.9)
        npc.health = "Malnutritioned";
    } else if (npc.health == "Healthy") {
      if (Math.random() > healthFed / 3) npc.health = "Stable";
    }
  }
}
