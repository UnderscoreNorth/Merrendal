import type { Building } from "$lib/data/buildings";
import type { Villager } from "$lib/data/living";
import { GameState } from "$lib/stores";
import { skillUp } from "./workers";

function maintenance(gs: GameState) {
  const buildings: Building[] = [];
  const items = ["Lumber", "Stone", "Iron Ingot", "Leather"] as const;
  for (const itemName of items) {
    if (
      typeof gs.inventory[itemName] == "number" &&
      gs.inventory[itemName] > 0
    ) {
      let skill = "";
      switch (itemName) {
        case "Iron Ingot":
          skill = "Blacksmith";
          break;
        case "Leather":
          skill = "Leatherworker";
          break;
        case "Lumber":
          skill = "Carpenter";
          break;
        case "Stone":
          skill = "Stonemason";
          break;
      }
      const workers: Villager[] = [];
      outerBlock: {
        for (const worker of workers) {
          let availableWork = 5 * (1 + (worker.skills[skill] ?? 0));
          for (const building of buildings) {
            const entities = [];
            if (building.maintenanceCost[itemName]) entities.push(building);
            for (const upgrade of Object.values(building.upgrades)) {
              if (upgrade.maintenanceCost[itemName]) entities.push(upgrade);
            }
            for (const entity of entities) {
              if (entity.maintenanceCost[itemName] == undefined) continue;
              let workToDo = Math.min(
                entity.maintenanceCost[itemName],
                5,
                availableWork,
                gs.inventory[itemName],
              );
              if (workToDo > 0 && Math.random() > 0.5) {
                skillUp(gs, worker, skill);
              }
              availableWork -= workToDo;
              entity.maintenanceCost[itemName] -= workToDo;
              gs.inventory[itemName] -= workToDo;
            }
            if (availableWork <= 0) break;
            if (gs.inventory[itemName] <= 0) break outerBlock;
          }
        }
      }
    }
  }
  //TODO: Periodic maintenance increase, default is 2% of cost per year
}
