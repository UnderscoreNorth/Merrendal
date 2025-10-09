import { type AreaType, type Area, areaTypes } from "$lib/data/areas";
import { type BuildingType, buildingTypes } from "$lib/data/buildings";
import {
  itemCategories,
  type ItemName,
  type ItemRecord,
  items,
} from "$lib/data/items";
import { type GameState } from "$lib/stores";
import { type Recipe, recipes } from "$lib/data/recipes";
import { type Project } from "$lib/data/projects/project";
import { recordLoop } from "$lib/util/recordLoop";
import { calculateDailyCalorieConsumption } from "./food";

export type Need = //NPCNeed
  //|
  (ItemNeed | ItemCategoryNeed | BuildingNeed | AreaNeed) & {
    priority: number;
    primary: boolean;
    repeating: boolean;
  };
/*export type NPCNeed = {
  type: "npc";
  num: number;
  minAge: number;
  maxAge: number;
  total: number;
};*/
export type ItemNeed = {
  type: "item";
  num: number;
  item: ItemName;
};
export type ItemCategoryNeed = {
  type: "itemCategory";
  num: number;
  itemCategory: (typeof itemCategories)[number];
};
export type BuildingNeed = {
  type: "building";
  building: BuildingType;
  area?: Area;
};
export type AreaNeed = {
  type: "area";
  area: AreaType;
};
export type ProjectNeed = {
  type: "project";
  project: Project;
};

export function getNeedKey(need: Need) {
  let key = need.primary + need.type;
  switch (need.type) {
    case "item":
      key += need.item;
      break;
    case "area":
      key += need.area;
      break;
    case "building":
      key += need.building;
      break;
    case "itemCategory":
      key += need.itemCategory;
      break;
  }
  return key;
}

export function determineNeeds(gs: GameState) {
  // Remove all non-primary needs (these will be regenerated)
  for (const [needKey, need] of recordLoop(gs.needs)) {
    if (!need.primary) delete gs.needs[needKey];
  }
  const breadNeed: Need = {
    type: "item",
    item: "Bread",
    num: calculateDailyCalorieConsumption(gs) * 365,
    primary: false,
    repeating: false,
    priority: 2,
  };
  const breadKey = getNeedKey(breadNeed);
  gs.needs[breadKey] = breadNeed;
  const itemBalance: ItemRecord = {};
  for (const [itemName, num] of recordLoop(gs.inventory)) {
    if (num) itemBalance[itemName] = num;
  }
  for (const [needKey, need] of recordLoop(gs.needs)) {
    recurseNeed(need);
  }

  function recurseNeed(need: Need) {
    switch (need.type) {
      case "itemCategory":
        break;
      case "item":
        // Subtract the needed amount from the balance
        itemBalance[need.item] = (itemBalance[need.item] || 0) - need.num;
        const balance = itemBalance[need.item] ?? 0;
        // If balance is non-negative and this isn't a repeating need, we're done
        if (balance >= 0 && !need.repeating) {
          delete gs.needs[getNeedKey(need)];
          return;
        }

        // If balance is below 0, we need to produce more
        if (balance < 0) {
          const shortfall = Math.abs(balance);

          // Find recipe that produces this item
          const recipe = recipes.find((r) =>
            r.output.some((output) => output.type === need.item),
          );

          if (recipe) {
            addRecipeInput(recipe, need, shortfall);
          }

          // If balance is still below 0, try projects
          if (balance < 0) {
            const remainingShortfall = Math.abs(balance);

            for (const area of gs.areas) {
              for (const project of Object.values(
                areaTypes[area.type].allowedProjects,
              )) {
                if (project.expectedOutputs.items.some((i) => need.item == i)) {
                  const newProject = project.constructor({
                    gs: gs,
                    area,
                  });
                  for (const phase of newProject.phases) {
                    const buildingType = phase.building;
                    if (!buildingType) continue;
                    addBuilding(buildingType, need);
                  }
                  addProjectInput(newProject, need, remainingShortfall);
                  break; // Only use first viable project to avoid duplicates
                }
              }
            }
          }
        }
        break;
      case "building":
        const buildingTemplate = buildingTypes[need.building];
        if (!buildingTemplate) return;

        // Create needs for building materials
        for (const [itemName, amount] of recordLoop(
          buildingTemplate.requirements,
        )) {
          const current = gs.inventory[itemName] ?? 0;
          if (current < amount) {
            const newNeed: Need = {
              type: "item",
              item: itemName,
              num: amount,
              priority: need.priority + 0.1,
              primary: false,
              repeating: false,
            };
            const key = getNeedKey(newNeed);
            if (gs.needs[key] && gs.needs[key].type == "item") {
              gs.needs[key].priority = need.priority + 0.1;
              gs.needs[key].num += amount;
            } else {
              gs.needs[key] = newNeed;
            }
            recurseNeed(newNeed);
          }
        }
        // Checking if areas exist
        const existingArea = gs.areas.some((area) =>
          areaTypes[area.type].allowedBuildings.includes(need.building),
        );
        if (!existingArea) {
          for (const [areaType, area] of recordLoop(areaTypes)) {
            if (area.allowedBuildings.includes(need.building)) {
              const newNeed: Need = {
                type: "area",
                area: areaType,
                priority: need.priority + 0.1,
                primary: false,
                repeating: false,
              };
              const key = getNeedKey(newNeed);
              if (gs.needs[key]) {
                gs.needs[key].priority = need.priority + 0.1;
              } else {
                gs.needs[key] = newNeed;
              }
            }
          }
        }
        break;
    }
  }

  function addBuilding(buildingType: BuildingType, need: Need) {
    const newNeed: Need = {
      type: "building",
      building: buildingType,
      priority: need.priority + 0.1,
      primary: false,
      repeating: false,
    };

    const needKey = getNeedKey(newNeed);
    const buildingExists = gs.areas.some((area) =>
      area.buildings.some(
        (b) => b.type === buildingType && b.status === "Built",
      ),
    );
    if (!buildingExists) {
      if (!gs.needs[needKey]) {
        gs.needs[needKey] = newNeed;
        recurseNeed(newNeed);
      } else {
        gs.needs[needKey].priority = need.priority + 0.1;
      }
    }
  }
  function addRecipeInput(recipe: Recipe, need: Need, needed: number) {
    if (need.type !== "item") return;
    const outputItem = recipe.output.find((i) => i.type == need.item);
    if (!outputItem) return;

    const outputRatio = outputItem.num;
    // Calculate how many batches we need (rounded up to ensure we meet the requirement)
    const batchesNeeded = Math.ceil(needed / outputRatio);

    // Calculate actual output (might be more than needed due to integer batches)
    const actualOutput = batchesNeeded * outputRatio;

    // Update item balance with the production
    itemBalance[need.item] = (itemBalance[need.item] || 0) + actualOutput;

    // Create needs for input items based on batches
    for (const input of recipe.input) {
      const inputNeeded = batchesNeeded * input.num;
      const newNeed: Need = {
        type: "item",
        item: input.type,
        num: inputNeeded,
        priority: need.priority + 0.1,
        primary: false,
        repeating: false,
      };
      const key = getNeedKey(newNeed);
      if (gs.needs[key] && gs.needs[key].type == "item") {
        gs.needs[key].num += inputNeeded;
        gs.needs[key].priority = need.priority + 0.1;
      } else {
        gs.needs[key] = newNeed;
      }
      recurseNeed(newNeed);
    }

    // Create needs for required buildings
    if (recipe.buildings && recipe.buildings.length > 0) {
      for (const buildingType of recipe.buildings) {
        addBuilding(buildingType, need);
      }
    }
  }
  function addProjectInput(project: Project, need: Need, needed: number) {
    if (need.type !== "item") return;

    // Find the output that matches our needed item
    const itemsOutput = project.outputs.find((i) => i.type == "items");
    if (!itemsOutput) return;

    const outputEntry = recordLoop(itemsOutput.data).find(
      ([itemName, num]) => itemName == need.item,
    );
    if (!outputEntry) return;

    const outputRatio = outputEntry[1];
    if (!outputRatio) return;

    // Calculate how many project "batches" we need (rounded up to ensure we meet the requirement)
    const batchesNeeded = Math.ceil(needed / outputRatio);

    // Calculate actual output (might be more than needed due to integer batches)
    const actualOutput = batchesNeeded * outputRatio;

    // Update item balance with the production
    itemBalance[need.item] = (itemBalance[need.item] || 0) + actualOutput;

    // Create needs for input items based on batches
    for (const input of project.requirements) {
      if (input.type == "item") {
        const inputNeeded = batchesNeeded * input.num;
        const newNeed: Need = {
          type: "item",
          num: inputNeeded,
          item: input.data,
          repeating: false,
          primary: false,
          priority: need.priority + 0.1,
        };
        const key = getNeedKey(newNeed);
        if (gs.needs[key] == undefined) {
          gs.needs[key] = newNeed;
        } else if (gs.needs[key].type == "item") {
          gs.needs[key].num += inputNeeded;
          gs.needs[key].priority = need.priority + 0.1;
        }
        recurseNeed(newNeed);
      }
    }
  }
}

/*
 case "building": {
          // Check if building exists
          const buildingExists = gs.areas.some((area) =>
            area.buildings.some(
              (b) => b.type === need.building && b.status === "Built",
            ),
          );

          if (buildingExists && !need.repeating) {
            gs.needs.splice(i, 1);
            hasChanges = true;
            continue;
          }

          // Get building requirements
          const buildingTemplate = buildingTypes[need.building];
          if (!buildingTemplate) continue;

          // Create needs for building materials
          for (const [itemName, amount] of Object.entries(
            buildingTemplate.requirements,
          )) {
            const needKey = `item:${itemName}`;
            if (!processedNeeds.has(needKey)) {
              const existingNeed = gs.needs.find(
                (n) => n.type === "item" && n.item === itemName,
              );
              if (!existingNeed) {
                gs.needs.push({
                  type: "item",
                  item: itemName as ItemName,
                  num: amount,
                  priority: need.priority + 0.1,
                  primary: false,
                  repeating: false,
                });
                processedNeeds.add(needKey);
                hasChanges = true;
              }
            }
          }

          // Find which area types allow this building
          const allowedAreaTypes: AreaType[] = [];
          for (const [areaType, config] of Object.entries(areaTypes)) {
            if (config.allowedBuildings.includes(need.building)) {
              allowedAreaTypes.push(areaType as AreaType);
            }
          }

          // Create needs for areas if they don't exist
          for (const areaType of allowedAreaTypes) {
            const needKey = `area:${areaType}`;
            if (!processedNeeds.has(needKey)) {
              const areaExists = gs.areas.some(
                (area) => area.type === areaType,
              );

              if (!areaExists) {
                const existingNeed = gs.needs.find(
                  (n) => n.type === "area" && n.area === areaType,
                );
                if (!existingNeed) {
                  gs.needs.push({
                    type: "area",
                    area: areaType,
                    priority: need.priority + 0.1,
                    primary: false,
                    repeating: false,
                  });
                  processedNeeds.add(needKey);
                  hasChanges = true;
                }
              }
            }
          }
          break;
        }

        case "area": {
          // Check if area exists
          const areaExists = gs.areas.some((area) => area.type === need.area);

          if (areaExists && !need.repeating) {
            gs.needs.splice(i, 1);
            hasChanges = true;
            continue;
          }
          break;
        }

        case "itemCategory": {
          // Check if requirement is met (sum all items in category)
          let totalAmount = 0;
          for (const [itemName, itemData] of Object.entries(items)) {
            if (itemData.category === need.itemCategory) {
              totalAmount += gs.inventory[itemName as ItemName] || 0;
            }
          }

          if (totalAmount >= need.num && !need.repeating) {
            gs.needs.splice(i, 1);
            hasChanges = true;
          }
          break;
        }
      }
    }
  } while (hasChanges);
*/
