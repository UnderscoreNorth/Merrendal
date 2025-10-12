import { type GameState } from "$lib/stores";
import { assignNPCs, unassignNPC } from "../data/npcs";
import { areaTypes, type Area } from "../data/areas";
import { buildingTypes, type Building } from "../data/buildings";
import { type ItemName, items, type ItemRecord } from "$lib/data/items";
import { recipes } from "$lib/data/recipes";
import { recordLoop } from "$lib/util/recordLoop";
import {
  assignWorkersToProject,
  checkRequirements,
  consumeRequirements,
  getRequirements,
  processProject,
} from "./projects";
import { proj_Prospecting } from "$lib/data/projects/data/proj_Prospecting";
import { proj_Construction } from "$lib/data/projects/data/proj_Construction";
import { processRecipe } from "./recipes";
import type { Project } from "$lib/data/projects/project";
import { getNeedKey } from "./needs";
import { getAllBuildings } from "./buildings";

export function reassignWorkers(gs: GameState) {
  let projects: Set<Project> = new Set();
  const itemNeeds: ItemRecord = {};
  for (const need of Object.values(gs.needs).sort(
    (a, b) => b.priority - a.priority,
  )) {
    if (need.type == "area") {
      const village = gs.map?.villages[0];
      if (!village || !gs.map) continue;
      if (need.area == "Mountain") {
        let found = false;
        for (let n = 1; n < 5; n++) {
          if (found) continue;
          for (const tile of gs.map.getRing(
            village.q,
            village.s,
            village.r,
            n,
          )) {
            if (found) continue;
            const exists = gs.areas.some(
              (i) =>
                i.loc.q == tile.q && i.loc.r == tile.r && i.loc.s == tile.s,
            );
            if (!exists) {
              found = true;
              const area: Area = {
                areaID: Math.random().toString(),
                yieldEff: {},
                type: "Mountain",
                currentProjects: {},
                acres: 50,
                loc: {
                  q: tile.q,
                  r: tile.r,
                  s: tile.s,
                },
                buildings: [],
              };
              area.currentProjects["Prospecting"] =
                proj_Prospecting.constructor({ gs, area });
              gs.areas.push(area);
            }
          }
        }
      }
    } else if (need.type == "building") {
      const area = gs.areas.filter((a) =>
        areaTypes[a.type].allowedBuildings.includes(need.building),
      )[0];
      if (!area) continue;
      if (area.currentProjects["Construction"] !== undefined) continue;
      const buildingType = buildingTypes[need.building];
      let maxPops = 0;
      if (typeof buildingType.maxPops == "number") {
        maxPops = buildingType.maxPops;
      } else {
        maxPops = buildingType.maxPops(area);
      }
      const building: Building = {
        type: need.building,
        maxPops,
        daysToComplete: buildingType.daysToComplete,
        status: "Building",
        id: Math.random().toString(),
        workers: new Set(),
      };
      if ("stuck" in buildingType) building.stuck = buildingType.stuck;
      if ("occupationTitle" in buildingType)
        building.occupationTitle = buildingType.occupationTitle;
      const project = proj_Construction.constructor({
        gs,
        area,
        building,
      });
      const key = "Construction" + need.building;
      const requirements = checkRequirements(gs, area, project, "main");

      const itemRequirements = getRequirements(project, "main");

      const blocked = itemRequirements.some(
        (item) =>
          Math.round((itemNeeds[item] ?? 0) * 10) >
          Math.round(need.priority * 10),
      );
      if (requirements && !area.currentProjects[key] && !blocked) {
        consumeRequirements(gs, area, project, "main");
        delete gs.needs[getNeedKey(need)];
        area.currentProjects[key] = project;
      } else {
        itemRequirements.every(
          (item) => (itemNeeds[item] = itemNeeds[item] || need.priority),
        );
      }
    } else if (need.type == "item") {
      produceItem(need.item, need.priority, need.num);
    }
  }
  for (const area of gs.areas) {
    for (const [projectName, project] of recordLoop(area.currentProjects)) {
      if (!project) continue;
      if (
        checkRequirements(gs, area, project, "currentPhase") &&
        !projects.has(project)
      ) {
        assignWorkersToProject(gs, project, 1);
      }
      processProject(gs, area, project);
    }
  }
  for (let i = 0; i < gs.npcs.filter((i) => i.age >= 16).length; i++) {
    for (const [itemName, itemData] of recordLoop(items)) {
      if ("stockpile" in itemData) {
        produceItem(itemName, 1);
      }
    }
  }
  for (const building of getAllBuildings(gs)) {
    if (building.type == "Archive" && building.workers.size == 0)
      assignNPCs(gs, building, 1, 1);
  }
  if (gs.currentPeriod == "Evening") return;
  for (const npc of gs.npcs.filter(
    (i) => i.age >= 16 && i.job.stuck == false,
  )) {
    if (!gs.dailyWorkerActivity.has(npc.id)) unassignNPC(npc);
  }
  //assignWorkersByPriorityProjects(gs);
  //assignWorkersByPriorityRecipes(gs);
  //assignLeftoverWorkers(gs);
  function produceItem(itemName: ItemName, priority: number, num?: number) {
    const recipesProducingItem = recipes.filter((recipe) =>
      recipe.output.some((output) => output.type === itemName),
    );
    for (const recipe of recipesProducingItem) {
      if (recipe.buildings) {
        for (const buildingType of recipe.buildings) {
          // Find all buildings of this type and assign workers
          for (const area of gs.areas) {
            for (const building of area.buildings) {
              if (
                building.type === buildingType &&
                building.status === "Built"
              ) {
                processRecipe(
                  gs,
                  recipe,
                  building,
                  num == undefined
                    ? 1
                    : Math.ceil(
                        num /
                          recipe.output.filter((i) => i.type == itemName)[0]
                            .num,
                      ),
                  priority,
                );
              }
            }
          }
        }
      }
    }
    for (const area of gs.areas) {
      let project: Project | undefined = undefined;
      for (const [projectName, p] of recordLoop(area.currentProjects)) {
        if (!p) continue;
        if (
          !p.outputs.some((output) => {
            if (
              output.type == "items" &&
              Object.keys(output.data).some((item) => item == itemName)
            )
              return true;
            return false;
          })
        )
          continue;
        project = p;
      }
      if (project == undefined) {
        for (const [projectName, p] of recordLoop(
          areaTypes[area.type].allowedProjects,
        )) {
          if (!p.expectedOutputs.items.some((item) => item == itemName))
            continue;
          project = p.constructor({ gs, area });
          if (checkRequirements(gs, area, project, "main")) {
            consumeRequirements(gs, area, project, "main");
            area.currentProjects[project.type] = project;
          } else {
            project = undefined;
          }
        }
      }
      if (project == undefined) continue;
      projects.add(project);
      if (!checkRequirements(gs, area, project, "currentPhase")) continue;
      assignWorkersToProject(gs, project, priority);
      processProject(gs, area, project);
    }
  }
}
