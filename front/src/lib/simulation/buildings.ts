import type {
  Building,
  BuildingType,
  Upgrade,
  UpgradeType,
} from "../data/buildings";
import { buildingTypes } from "../data/buildings";
import { type GameState } from "$lib/stores";
import { type Area } from "$lib/data/areas";
import { v4 as uuidv4 } from "uuid";
import { type Villager } from "$lib/data/living";
import { skillUp } from "./workers";

export function getAllBuildings(gs: GameState) {
  return Object.values(gs.areas)
    .map((i) => i.buildings)
    .flat();
}

export function startConstruction(
  gs: GameState,
  buildingType: BuildingType,
  area: Area,
  spawn = false,
) {
  const building: Building = {
    id: uuidv4(),
    workers: new Set(),
    maintenanceCost: {},
    maxPops: buildingTypes[buildingType].maxPops,
    built: {
      day: gs.currentDay,
      period: gs.currentPeriod,
      year: gs.currentYear,
    },
    type: "building",
    status: "built",
    upgrades: {},
    buildingType,
  };
  if (spawn) {
    area.buildings.push(building);
  } else {
    area.currentProjects.push({ type: "construction", progress: {}, building });
  }
}

export function maintenance(gs: GameState) {
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

export function demolishBuilding(area: Area, building: Building) {
  if (!area.buildings.some((i) => i.id == building.id)) return;
  building.status = "demolishing";

  area.currentProjects.push({ type: "demolition", progress: 0, building });
}

export function startUpgrade(
  area: Area,
  building: Building,
  upgradeType: UpgradeType,
) {
  const buildingUpgrades = buildingTypes[building.buildingType].upgrades;
  if (upgradeType in buildingUpgrades) {
    area.currentProjects.push({
      type: "upgrade",
      building,
      upgrade: upgradeType,
      progress: {},
    });
  }
}
