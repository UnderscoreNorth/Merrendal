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
        // Special handling for Convert to Arable Land upgrade
        if (
          project.type === "upgrade" &&
          project.upgrade === "Convert to Arable Land"
        ) {
          // This upgrade uses worker time instead of materials
          //@ts-ignore - Using custom progress tracking for work days
          const currentProgress = project.progress["Work Days"] ?? 0;
          const requiredWorkDays = 10; // 10 days for 1 acre

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
            // Add 1 acre of arable land
            area.arableLand += 1;
          }
          continue;
        }

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
            if (project.building.buildingType == "Burgage") {
              const npc = gs.npcs.filter((i) => i.home == "" && i.age >= 16)[0];
              if (npc) {
                npc.home = project.building.id;
                if (npc.spouse !== undefined) {
                  const spouse = gs.npcs.find((i) => i.id == npc.spouse);
                  if (spouse !== undefined) spouse.home = project.building.id;
                }
                for (const childrenID of npc.children) {
                  const child = gs.npcs.find((i) => i.id == childrenID);
                  if (child !== undefined) child.home = project.building.id;
                }
              }
            }
          } else if (project.type === "upgrade") {
            // Add upgrade to building
            const buildingUpgrades =
              buildingTypes[project.building.buildingType].upgrades;
            const upgradeKey = project.upgrade as string;
            const upgradeData = buildingUpgrades[
              upgradeKey as keyof typeof buildingUpgrades
            ] as Upgrade | undefined;

            // Handle special upgrade: Convert to Arable Land
            if (
              project.upgrade === "Convert to Arable Land" &&
              project.building.buildingType === "Farm Field"
            ) {
              // Add 1 acre of arable land to the area
              area.arableLand += 1;
              // Don't mark as built for repeatable upgrades
            } else {
              project.building.upgrades[project.upgrade] = {
                status: "built",
                maintenanceCost: upgradeData?.maintenance?.cost ?? {},
              };

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
            area.buildings.splice(buildingIndex, 1);
            area.buildingLand -=
              buildingTypes[project.building.buildingType].size;
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
      for (const [itemName, amount] of recordLoop(
        buildingTemplate.requirements,
      )) {
        const maintenanceCost = amount * 0.02;
        //@ts-ignore
        building.maintenanceCost[itemName] =
          (building.maintenanceCost[itemName] ?? 0) + maintenanceCost;
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
          for (const [itemName, amount] of Object.entries(
            upgradeData.maintenance.cost,
          )) {
            //@ts-ignore
            upgrade.maintenanceCost[itemName] =
              (upgrade.maintenanceCost[itemName] ?? 0) + amount;
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
) {
  const buildingUpgrades = buildingTypes[building.buildingType].upgrades;
  if (upgradeType in buildingUpgrades) {
    area.currentProjects.push({
      type: "upgrade",
      building,
      upgrade: upgradeType,
      progress: {},
      id: uuidv4(),
      priority: 5,
    });
  }
}
