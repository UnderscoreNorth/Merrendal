import type {
  Building,
  BuildingType,
  Upgrade,
  UpgradeType,
} from "../data/buildings";
import { buildingTypes } from "../data/buildings";
import { type GameState } from "$lib/stores";
import { type Area } from "$lib/data/areas";
import { type ItemRecord } from "$lib/data/items";
import { v4 as uuidv4 } from "uuid";
import { skillUp } from "./workers";
import { recordLoop } from "$lib/util/recordLoop";
import { getNeighboringCubes, fromCube } from "$lib/util/terrainHelpers";

export function getAllBuildings(gs: GameState) {
  return Object.values(gs.areas)
    .map((i) => i.buildings)
    .flat();
}
export function getAllProjects(gs: GameState) {
  return Object.values(gs.areas)
    .map((i) => i.currentProjects)
    .flat();
}

/**
 * Calculate total size of a building including all its upgrades
 */
export function getTotalBuildingSize(building: Building): number {
  const template = buildingTypes[building.buildingType];
  let totalSize = template.size;
  // Add sizes from all built upgrades
  for (const [upgradeName, upgradeStatus] of Object.entries(
    building.upgrades,
  )) {
    if (upgradeStatus.status === "built") {
      // @ts-ignore - Dynamic upgrade lookup
      const upgradeData = template.upgrades[upgradeName] as Upgrade | undefined;
      if (upgradeData && upgradeData.size) {
        totalSize += upgradeData.size;
      }
    }
  }

  return totalSize;
}

/**
 * Calculate how much of a building's size is in a specific area
 */
export function getBuildingSizeInArea(
  building: Building,
  areaId: string,
  gs: GameState,
): number {
  const template = buildingTypes[building.buildingType];

  // Find which area the building is in
  const buildingArea = gs.areas.find((a) =>
    a.buildings.some((b) => b.id === building.id),
  );
  if (!buildingArea) return 0;

  // Base size is in the building's main area
  let sizeInArea = buildingArea.areaID === areaId ? template.size : 0;
  // Add upgrade sizes based on their targetArea
  for (const [upgradeName, upgradeStatus] of Object.entries(
    building.upgrades,
  )) {
    if (upgradeStatus.status === "built") {
      // @ts-ignore - Dynamic upgrade lookup
      const upgradeData = template.upgrades[upgradeName] as Upgrade | undefined;
      if (upgradeData && upgradeData.size) {
        // If upgrade has a targetArea, size goes there; otherwise it's in the main area
        const upgradeAreaId = upgradeStatus.targetArea ?? buildingArea.areaID;
        if (upgradeAreaId === areaId) {
          sizeInArea += upgradeData.size;
        }
      }
    }
  }

  return sizeInArea;
}

/**
 * Calculate the total cost of a building based on its requirements
 */
function calculateBuildingCost(buildingType: BuildingType): number {
  const template = buildingTypes[buildingType];
  return Object.values(template.requirements).reduce(
    (sum, val) => sum + val,
    0,
  );
}

/**
 * Calculate the total maintenance cost accumulated for a building
 */
function getTotalMaintenanceCost(maintenanceCost: ItemRecord): number {
  return Object.values(maintenanceCost).reduce(
    (sum: number, val) => sum + (val ?? 0),
    0,
  );
}

/**
 * Evict all workers and residents from a ruined building
 */
function evictFromBuilding(gs: GameState, building: Building): void {
  // Evict all workers
  for (const workerId of building.workers) {
    const worker = gs.npcs.find((npc) => npc.id === workerId);
    if (worker) {
      worker.job = undefined;
    }
  }
  building.workers.clear();

  // Evict all residents (anyone who has this building as their home)
  for (const npc of gs.npcs) {
    if (npc.home === building.id) {
      npc.home = "";
    }
  }
}

/**
 * Assigns a villager and their family to a home
 * @param gs GameState
 * @param homeId The building ID to assign as home
 */
export function assignVillagerToHome(gs: GameState, homeId: string): void {
  // Find the building to check if it's ruined
  const building = getAllBuildings(gs).find((b) => b.id === homeId);
  if (!building || building.status === "ruined") {
    return; // Don't assign to ruined buildings
  }

  const npc = gs.npcs.filter((i) => i.home == "" && i.age >= 16)[0];
  if (npc) {
    npc.home = homeId;
    if (npc.spouse !== undefined) {
      const spouse = gs.npcs.find((i) => i.id == npc.spouse);
      if (spouse !== undefined) spouse.home = homeId;
    }
    for (const childrenID of npc.children) {
      const child = gs.npcs.find((i) => i.id == childrenID);
      if (child !== undefined) child.home = homeId;
    }
  }
}

export function doConstruction(gs: GameState) {
  if (gs.currentPeriod == "Evening") return;
  const workers = gs.npcs.filter(
    (i) => i.age >= 16 && !gs.dailyWorkerActivity.has(i.id),
  );
  getAllProjects(gs)
    .filter((i) => i.type == "construction")
    .forEach((i) => {
      i.leadCarpenter = "";
      i.leadStoneMason = "";
    });
  for (const worker of workers.sort((a, b) => {
    return (
      (b.skills["Carpenter"] ?? 0) +
      (b.skills["Stonemason"] ?? 0) -
      (a.skills["Carpenter"] ?? 0) +
      (a.skills["Stonemason"] ?? 0)
    );
  })) {
    let workerAssigned = false;
    for (const project of getAllProjects(gs).sort(
      (a, b) => b.priority - a.priority,
    )) {
      if (workerAssigned) break;
      const area = gs.areas.find((a) =>
        a.currentProjects.some((c) => c.id == project.id),
      );
      if (area == undefined) continue;
      const i = area.currentProjects.findIndex((p) => p.id == project.id);
      // Determine what requirements are needed for this project
      let requirements: Record<string, number> = {};

      if (project.type === "construction" || project.type === "upgrade") {
        // Special handling for Dirt Road construction
        if (
          project.type === "construction" &&
          project.building.buildingType === "Dirt Road"
        ) {
          // Dirt Road uses worker time instead of materials
          //@ts-ignore - Using custom progress tracking for work days
          const currentProgress = project.progress["Work Days"] ?? 0;
          const requiredWorkDays = 10; // 10 man-days for road

          if (currentProgress < requiredWorkDays) {
            //@ts-ignore - Using custom progress tracking for work days
            project.progress["Work Days"] = currentProgress + 0.1; // 0.1 per worker per period
            workerAssigned = true;
            gs.dailyWorkerActivity.add(worker.id);
          }

          // Check if complete
          //@ts-ignore - Using custom progress tracking for work days
          if ((project.progress["Work Days"] ?? 0) >= requiredWorkDays) {
            // Remove from currentProjects
            area.currentProjects.splice(i, 1);
            // Complete the building
            project.building.built = {
              day: gs.currentDay,
              period: gs.currentPeriod,
              year: gs.currentYear,
            };
            completeBuilding(gs, area, project.building);
          }
          continue;
        }

        if (project.type === "construction") {
          requirements =
            buildingTypes[project.building.buildingType].requirements;
        } else {
          const buildingUpgrades =
            buildingTypes[project.building.buildingType].upgrades;
          const upgradeKey = project.upgrade as string;
          if (upgradeKey in buildingUpgrades) {
            const upgrade = buildingUpgrades[
              upgradeKey as keyof typeof buildingUpgrades
            ] as Upgrade;
            requirements = upgrade.requirements;
          }
        }

        // Find an item type that still needs work
        // Prioritize based on worker skills
        const requirementEntries = Object.entries(requirements);

        // Sort requirements to prioritize based on worker skills
        const sortedRequirements = [...requirementEntries].sort((a, b) => {
          const [itemNameA] = a;
          const [itemNameB] = b;

          const hasCarpenterSkill = (worker.skills["Carpenter"] ?? 0) > 0;
          const hasStonemasonSkill = (worker.skills["Stonemason"] ?? 0) > 0;

          // Prioritize Lumber if worker has Carpenter skill
          if (hasCarpenterSkill) {
            if (itemNameA === "Lumber" && itemNameB !== "Lumber") return -1;
            if (itemNameA !== "Lumber" && itemNameB === "Lumber") return 1;
          }

          // Prioritize Stone if worker has Stonemason skill
          if (hasStonemasonSkill) {
            if (itemNameA === "Stone" && itemNameB !== "Stone") return -1;
            if (itemNameA !== "Stone" && itemNameB === "Stone") return 1;
          }

          return 0;
        });

        for (const [itemName, requiredAmount] of sortedRequirements) {
          const currentProgress =
            project.progress[itemName as keyof typeof project.progress] ?? 0;

          if (currentProgress < requiredAmount) {
            const amountNeeded = requiredAmount - currentProgress;
            const amountAvailable =
              gs.inventory[itemName as keyof typeof gs.inventory] ?? 0;
            const amountToAdd = Math.min(20, amountNeeded, amountAvailable);

            if (amountToAdd > 0) {
              // Add to progress
              project.progress[itemName as keyof typeof project.progress] =
                currentProgress + amountToAdd;

              // Subtract from inventory
              gs.inventory[itemName as keyof typeof gs.inventory] =
                (gs.inventory[itemName as keyof typeof gs.inventory] ?? 0) -
                amountToAdd;
              // Skill up chance
              if (
                itemName === "Lumber" &&
                project.type == "construction" &&
                project.leadCarpenter == ""
              ) {
                project.leadCarpenter = worker.id;
                if (Math.random() > 0.5) skillUp(gs, worker, "Carpenter");
              } else if (
                itemName === "Stone" &&
                project.type == "construction" &&
                project.leadStoneMason == ""
              ) {
                project.leadStoneMason == worker.id;
                if (Math.random() > 0.5) skillUp(gs, worker, "Stonemason");
              }
              workerAssigned = true;
              gs.dailyWorkerActivity.add(worker.id);
              break;
            }
          }
        }

        // Check if project is complete
        let isComplete = true;
        for (const [itemName, requiredAmount] of Object.entries(requirements)) {
          const currentProgress =
            project.progress[itemName as keyof typeof project.progress] ?? 0;
          if (currentProgress < requiredAmount) {
            isComplete = false;
            break;
          }
        }

        if (isComplete) {
          // Remove from currentProjects
          area.currentProjects.splice(i, 1);
          if (project.type === "construction") {
            // Add building to area
            project.building.built = {
              day: gs.currentDay,
              period: gs.currentPeriod,
              year: gs.currentYear,
            };
            completeBuilding(gs, area, project.building);
          } else if (project.type === "upgrade") {
            // Add upgrade to building
            const buildingUpgrades =
              buildingTypes[project.building.buildingType].upgrades;
            const upgradeKey = project.upgrade as string;
            const upgradeData = buildingUpgrades[
              upgradeKey as keyof typeof buildingUpgrades
            ] as Upgrade | undefined;

            // Mark upgrade as built
            project.building.upgrades[project.upgrade] = {
              status: "built",
              maintenanceCost: upgradeData?.maintenance?.cost ?? {},
              targetArea: project.targetArea, // Include targetArea if it exists
            };
            console.log(project.building);
            // Add upgrade size to building land if the upgrade has a size
            if (upgradeData?.size) {
              // Find the target area if specified, otherwise use current area
              const targetArea = project.targetArea
                ? (gs.areas.find((a) => a.areaID === project.targetArea) ??
                  area)
                : area;
              targetArea.buildingLand += upgradeData.size;
            }

            // Add upgrade recipes to building's allowedRecipes if they exist
            if (upgradeData?.allowedRecipes) {
              for (const recipe of upgradeData.allowedRecipes) {
                if (!project.building.allowedRecipes.includes(recipe)) {
                  project.building.allowedRecipes.push(recipe);
                }
              }
            }
          }
        }
      } else if (project.type === "demolition") {
        // For demolition, get requirements from building type
        const requirements =
          buildingTypes[project.building.buildingType].requirements;
        const totalWork = Object.values(requirements).reduce(
          (sum, val) => sum + val,
          0,
        );

        const amountToAdd = Math.min(20, totalWork - project.progress);

        if (amountToAdd > 0) {
          project.progress += amountToAdd;

          // Return half of a random material to inventory
          const itemNames = Object.keys(requirements);
          if (itemNames.length > 0) {
            const randomItem =
              itemNames[Math.floor(Math.random() * itemNames.length)];
            const halfAmount = amountToAdd / 2;

            gs.inventory[randomItem as keyof typeof gs.inventory] =
              (gs.inventory[randomItem as keyof typeof gs.inventory] ?? 0) +
              halfAmount;

            // Skill up chance
            if (randomItem === "Lumber" && Math.random() > 0.5) {
              skillUp(gs, worker, "Carpenter");
            } else if (randomItem === "Stone" && Math.random() > 0.5) {
              skillUp(gs, worker, "Stonemason");
            }
          }

          workerAssigned = true;
          gs.dailyWorkerActivity.add(worker.id);
        }

        // Check if demolition is complete
        if (project.progress >= totalWork) {
          // Remove from currentProjects
          area.currentProjects.splice(i, 1);

          // Remove building from area
          const buildingIndex = area.buildings.findIndex(
            (b) => b.id === project.building.id,
          );
          if (buildingIndex !== -1) {
            // Reduce building land by building size
            area.buildingLand -=
              buildingTypes[project.building.buildingType].size;

            // Also reduce building land by upgrade sizes
            const buildingTemplate =
              buildingTypes[project.building.buildingType];
            for (const [upgradeName, upgradeStatus] of Object.entries(
              project.building.upgrades,
            )) {
              if (upgradeStatus.status === "built") {
                //@ts-ignore - Dynamic upgrade lookup
                const upgradeData = buildingTemplate.upgrades[upgradeName] as
                  | Upgrade
                  | undefined;
                if (upgradeData?.size) {
                  area.buildingLand -= upgradeData.size;
                }
              }
            }

            area.buildings.splice(buildingIndex, 1);
          }
        }
      }
    }
  }
}

export function startConstruction(
  gs: GameState,
  buildingType: BuildingType,
  area: Area,
  spawn = false,
) {
  const template = buildingTypes[buildingType];
  const building: Building = {
    id: uuidv4(),
    workers: new Set(),
    maintenanceCost: {},
    maxPops: template.maxPops,
    built: {
      day: gs.currentDay,
      period: gs.currentPeriod,
      year: gs.currentYear,
    },
    type: "building",
    status: "built",
    upgrades: {},
    buildingType,
    currentProjects: [],
    allowedRecipes: template.allowedRecipes,
  };
  if ("occupationTitle" in template)
    building.occupationTitle = template.occupationTitle;

  // Initialize Farm Fields with yields tracking
  if (buildingType === "Farm Field") {
    building.yields = {};
  }
  if (spawn || Object.keys(template.requirements).length == 0) {
    completeBuilding(gs, area, building);
  } else {
    area.currentProjects.push({
      type: "construction",
      progress: {},
      building,
      leadCarpenter: "",
      leadStoneMason: "",
      id: uuidv4(),
      priority: 5,
    });
  }
}

export function completeBuilding(
  gs: GameState,
  area: Area,
  building: Building,
) {
  area.buildings.push(building);
  area.buildingLand += buildingTypes[building.buildingType].size;
  if (gs.map) {
    if (building.buildingType == "Dirt Road") {
      const neighboringCubes = getNeighboringCubes(area.loc);
      let road = area.buildings.some((i) => i.buildingType == "Dirt Road")
        ? "init"
        : "";
      let roadArray: number[] = [];
      for (const i in neighboringCubes) {
        const neighborId = fromCube(neighboringCubes[i]);
        const oTile = gs.map.tiles[neighborId];
        if (oTile && oTile.terrain.topography !== "Water") {
          if (
            oTile.buildings.some((i) => i.buildingType == "Dirt Road") &&
            road == "init"
          ) {
            roadArray.push(Number(i));
            let oTileRoads = oTile.terrain.road.split("").map((i) => Number(i));
            oTileRoads.push(Number(i) + (3 % 6));
            console.log(oTileRoads);
            oTile.terrain.road = oTileRoads.sort().join("");
          }
          const alreadyExists = gs.areas.some((a) => a.areaID === neighborId);
          if (!alreadyExists) {
            gs.areas.push(oTile);
          }
        }
      }
      if (road == "init" && roadArray.length) {
        area.terrain.road = roadArray.sort().join("");
      }
    } else if (building.buildingType == "Burgage") {
      assignVillagerToHome(gs, building.id);
    }
  }
}

export function maintenance(gs: GameState) {
  if (gs.currentPeriod == "Evening") return;
  const buildings = getAllBuildings(gs);

  for (const building of buildings) {
    // Initialize nextMaintenance if not set
    if (building.nextMaintenance === undefined) {
      const randomDay = Math.floor(Math.random() * 360) + 1;
      // Schedule for next year if random day is today or earlier, otherwise this year
      const year =
        randomDay <= gs.currentDay ? gs.currentYear + 1 : gs.currentYear;
      building.nextMaintenance = { year, day: randomDay };
    }

    // Check if maintenance is due today
    if (
      building.nextMaintenance.year === gs.currentYear &&
      building.nextMaintenance.day === gs.currentDay
    ) {
      // Calculate maintenance cost (2% of building requirements)
      const buildingTemplate = buildingTypes[building.buildingType];
      const buildingCost = calculateBuildingCost(building.buildingType);

      for (const [itemName, amount] of recordLoop(
        buildingTemplate.requirements,
      )) {
        const maintenanceCost = amount * 0.02;
        //@ts-ignore
        building.maintenanceCost[itemName] =
          (building.maintenanceCost[itemName] ?? 0) + maintenanceCost;
      }

      // Cap maintenance cost at building cost
      const totalMaintenance = getTotalMaintenanceCost(
        building.maintenanceCost,
      );
      if (totalMaintenance > buildingCost) {
        // Scale down all maintenance costs proportionally
        const scale = buildingCost / totalMaintenance;
        for (const [itemName, cost] of Object.entries(
          building.maintenanceCost,
        )) {
          if (cost !== undefined) {
            //@ts-ignore
            building.maintenanceCost[itemName] = cost * scale;
          }
        }
      }

      // Check for building ruin based on maintenance cost
      if (building.status === "built") {
        const ruinThreshold = buildingCost * 0.5; // 50% of building cost
        if (totalMaintenance >= ruinThreshold) {
          // Calculate ruin chance: scales from 0% at 50% to 100% at 100%
          const excessMaintenance = totalMaintenance - ruinThreshold;
          const ruinRange = buildingCost - ruinThreshold;
          const ruinChance = Math.min(1, excessMaintenance / ruinRange);

          if (Math.random() < ruinChance) {
            building.status = "ruined";
            evictFromBuilding(gs, building);
            gs.log.push({
              year: gs.currentYear,
              day: gs.currentDay,
              msg: `${building.buildingType} has fallen into ruin due to lack of maintenance!`,
              tags: ["building", "ruin"],
            });
          }
        }
      }

      // Schedule next maintenance (random day next year)
      const randomDay = Math.floor(Math.random() * 360) + 1;
      building.nextMaintenance = { year: gs.currentYear + 1, day: randomDay };
    }

    // Check upgrades for maintenance
    for (const [upgradeName, upgrade] of Object.entries(building.upgrades)) {
      if (upgrade.status !== "built") continue;

      // Initialize nextMaintenance for upgrade if not set
      if (upgrade.nextMaintenance === undefined) {
        const randomDay = Math.floor(Math.random() * 360) + 1;
        // Schedule for next year if random day is today or earlier, otherwise this year
        const year =
          randomDay <= gs.currentDay ? gs.currentYear + 1 : gs.currentYear;
        upgrade.nextMaintenance = { year, day: randomDay };
      }

      // Check if maintenance is due today for this upgrade
      if (
        upgrade.nextMaintenance.year === gs.currentYear &&
        upgrade.nextMaintenance.day === gs.currentDay
      ) {
        const buildingTemplate = buildingTypes[building.buildingType];
        //@ts-ignore - Dynamic upgrade lookup
        const upgradeData = buildingTemplate.upgrades[upgradeName] as
          | Upgrade
          | undefined;

        if (upgradeData && upgradeData.maintenance) {
          for (const [itemName, amount] of recordLoop(
            upgradeData.maintenance.cost,
          )) {
            upgrade.maintenanceCost[itemName] =
              (upgrade.maintenanceCost[itemName] ?? 0) + (amount ?? 0);
          }
        }

        // Schedule next maintenance for upgrade (random day next year)
        const randomDay = Math.floor(Math.random() * 360) + 1;
        upgrade.nextMaintenance = { year: gs.currentYear + 1, day: randomDay };
      }
    }
  }

  // Process pending maintenance costs with idle workers
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
      const workers = gs.npcs
        .filter((i) => i.age >= 16 && !gs.dailyWorkerActivity.has(i.id))
        .sort((a, b) => (b.skills[skill] ?? 0) - (a.skills[skill] ?? 0));

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
              if (workToDo > 0 && Math.random() > 0.9) {
                skillUp(gs, worker, skill);
              }
              availableWork -= workToDo;
              entity.maintenanceCost[itemName] -= workToDo;
              gs.inventory[itemName] -= workToDo;
            }

            // Check if building is fully repaired (rebuilt)
            if (building.status === "ruined") {
              const totalMaintenance = getTotalMaintenanceCost(
                building.maintenanceCost,
              );
              if (totalMaintenance <= 0) {
                building.status = "built";
                gs.log.push({
                  year: gs.currentYear,
                  day: gs.currentDay,
                  msg: `${building.buildingType} has been rebuilt!`,
                  tags: ["building", "rebuild"],
                });
              }
            }

            if (availableWork <= 0) {
              gs.dailyWorkerActivity.add(worker.id);
              break;
            }
            if (gs.inventory[itemName] <= 0) break outerBlock;
          }
        }
      }
    }
  }
}

export function demolishBuilding(area: Area, building: Building) {
  if (!area.buildings.some((i) => i.id == building.id)) return;
  building.status = "demolishing";

  area.currentProjects.push({
    type: "demolition",
    progress: 0,
    building,
    id: uuidv4(),
    priority: 5,
  });
}

export function startUpgrade(
  area: Area,
  building: Building,
  upgradeType: UpgradeType,
  sourceAreaId?: string,
) {
  const buildingUpgrades = buildingTypes[building.buildingType].upgrades;
  if (upgradeType in buildingUpgrades) {
    area.currentProjects.push({
      type: "upgrade",
      building,
      upgrade: upgradeType,
      progress: {},
      targetArea: sourceAreaId !== undefined ? area.areaID : undefined,
      id: uuidv4(),
      priority: 5,
    });
  }
}
