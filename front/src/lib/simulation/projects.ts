import { type GameState } from "$lib/stores";
import type { Project, ProjectPhase } from "../data/projects/project";
import { recordLoop } from "../util/recordLoop";
import { log } from "./log";
import { type Area } from "$lib/data/areas";
import { assignNPCs, unassignNPC, increaseSkill } from "$lib/data/npcs";
import { capitalize } from "$lib/util/capitalize";
import { type Requirement } from "$lib/data/requirement";

export function processProject(gs: GameState, area: Area, project: Project) {
  const currentPhase = project.phases[project.currentPhase - 1];
  if (!currentPhase) return;
  if (currentPhase.progressPercent < 100) {
    // Check if work can be done during this time period
    const canWork =
      gs.currentPeriod !== "Evening" || currentPhase.worksAtNight === true;
    if (!canWork) return;

    // Check if phase requirements are met
    if (checkRequirements(gs, area, project, "currentPhase")) {
      if (currentPhase.building) {
        const building = area.buildings.filter(
          (i) => i.type == currentPhase.building && i.status == "Built",
        )[0];
        if (building == undefined) return;
      }

      // Calculate daily progress based on workers assigned to this project
      const dailyProgress = calculateDailyProgress(gs, project, currentPhase);
      if (dailyProgress > 0) {
        // Apply progress to current phase
        currentPhase.progressPercent = Math.min(
          100,
          currentPhase.progressPercent + dailyProgress,
        );
        // Check if phase is completed
        if (currentPhase.progressPercent >= 100) {
          currentPhase.progressPercent = 100;
          if (project.phases.length > 1)
            log(
              gs,
              `<i>${project.type}</i> phase <i>${currentPhase.name}</i> completed`,
              ["Projects"],
            );
          for (const worker of gs.npcs.filter((i) =>
            project.workers.has(Number(i.id)),
          )) {
            unassignNPC(worker);
          }
          project.workers.clear();
          // Check if this is the last phase
          if (project.currentPhase == project.phases.length) {
            // Project completed - apply final outputs
            completeProject(gs, area, project);
            return;
          }
        }
      }
    }
  }
  // Move to next phase
  if (
    project.phases[project.currentPhase] !== undefined &&
    checkRequirements(gs, area, project, "nextPhase")
  ) {
    consumeRequirements(gs, area, project, "nextPhase");
    project.currentPhase++;
    for (const worker of gs.npcs.filter((i) =>
      project.workers.has(Number(i.id)),
    )) {
      unassignNPC(worker);
    }
    project.workers.clear();
    log(
      gs,
      `<i>${project.type}</i> advanced to phase <i>${project.phases[project.currentPhase - 1].name}</i>`,
      ["Projects"],
    );
  }
}

function calculateDailyProgress(
  gs: GameState,
  project: Project,
  phase: ProjectPhase,
): number {
  // Get workers assigned to this project
  const assignedWorkers = gs.npcs
    .filter((i) => project.workers.has(Number(i.id)))
    .filter((npc) => !gs.dailyWorkerActivity.has(npc.id));

  if (assignedWorkers.length === 0) return 0;

  // Calculate total strength of assigned workers
  const totalStrength = assignedWorkers.reduce(
    (sum, worker) => sum + 1, // + getStat(worker, "str"),
    0,
  );
  // Mark workers as active and grant skill increases
  assignedWorkers.forEach((npc) => {
    gs.dailyWorkerActivity.add(npc.id);
    if (Math.random() < 0.5) {
      const occupation = npc.job.title;
      increaseSkill(npc, occupation, 0.02);
    }
  });
  // Base daily progress is based on man-days required and worker strength
  // Assuming 1 strength point = 1 man-day of work per day
  // Halved because there are now 3 work periods per day instead of 1
  const baseDailyProgress = (totalStrength / phase.manDaysRequired) * 100 * 0.5;
  return Math.min(
    baseDailyProgress,
    phase.maxDailyProgress ? phase.maxDailyProgress / 2 : 100,
  );
}

function completeProject(gs: GameState, area: Area, project: Project) {
  // Calculate final output modifiers from all phases
  let finalModifier = 1;

  for (const phase of project.phases) {
    if (phase.outputModifiers) {
      for (const modifier of phase.outputModifiers) {
        if (modifier.condition(gs)) {
          finalModifier *= modifier.modifier();
        }
      }
    }
  }

  // Apply outputs based on type
  let completionSuffix = "";
  for (const output of project.outputs) {
    if (output.type === "items") {
      const itemData = output.data; // ItemRecord type
      for (const [itemName, baseAmount] of recordLoop(itemData)) {
        const finalAmount = Math.floor((baseAmount ?? 0) * finalModifier);
        if (finalAmount > 0) {
          gs.inventory[itemName] = (gs.inventory[itemName] || 0) + finalAmount;
        }
      }
    } else if (output.type === "area_yield") {
      area.yieldEff = output.data;
    } else if (output.type === "building") {
      output.data.status = "Built";
      area.buildings.push(output.data);
      completionSuffix = output.data.type;
    }
  }
  log(
    gs,
    `<i>${completionSuffix.length ? capitalize(completionSuffix) + " " : ""}${project.type}</i> project completed!`,
    ["Projects"],
  );
  // Remove completed project from building
  delete area.currentProjects[project.type + completionSuffix];
}

export function assignWorkersToProject(
  gs: GameState,
  project: Project,
  importance: number,
) {
  const currentPhase = project.phases[project.currentPhase - 1];
  if (!currentPhase) return;

  // Calculate how many workers we need based on man-days required and building capacity
  const remainingManDays =
    (currentPhase.manDaysRequired * (100 - currentPhase.progressPercent)) / 100;
  const maxWorkers = Math.ceil(
    currentPhase.maxDailyProgress
      ? currentPhase.manDaysRequired / currentPhase.maxDailyProgress
      : 9999,
  );
  const workersNeeded =
    Math.min(remainingManDays, maxWorkers) - project.workers.size;
  // Assign workers to project up to the building's capacity
  assignNPCs(gs, project, importance, workersNeeded);
}
export function getAllProjects(gs: GameState) {
  return Object.values(gs.areas)
    .map((i) => Object.values(i.currentProjects))
    .flat();
}

export function checkRequirements(
  gs: GameState,
  area: Area,
  project: Project,
  type: "main" | "currentPhase" | "nextPhase",
) {
  const phaseIndex =
    type == "nextPhase" ? project.currentPhase : project.currentPhase - 1;
  const requirements =
    type == "main"
      ? project.requirements
      : project.phases[phaseIndex].requirements;
  if (type !== "main" && project.phases[phaseIndex].requireOperator == "OR") {
    return requirements.some((requirement) => checkRequirement(requirement));
  } else {
    return requirements.every((requirement) => checkRequirement(requirement));
  }

  function checkRequirement(requirement: Requirement) {
    switch (requirement.type) {
      case "item":
        return (gs.inventory[requirement.data] ?? 0) >= requirement.num;
      case "area":
        return area.type == requirement.data;
      case "building":
        return area.buildings.some((b) => b.type == requirement.data);
      case "hasYield":
        return Object.keys(area.yieldEff).length > 0 == requirement.data;
      case "progress":
        if (requirement.min)
          return (
            project.phases[phaseIndex - 1].progressPercent >= requirement.min
          );
        break;
      case "season":
        return gs.season == requirement.data;
      default:
        return false;
    }
  }
}
export function getRequirements(
  project: Project,
  type: "main" | "currentPhase" | "nextPhase",
) {
  const phaseIndex =
    type == "nextPhase" ? project.currentPhase : project.currentPhase - 1;
  const requirements =
    type == "main"
      ? project.requirements
      : project.phases[phaseIndex].requirements;
  return requirements.filter((i) => i.type == "item").map((i) => i.data);
}
export function consumeRequirements(
  gs: GameState,
  area: Area,
  project: Project,
  type: "main" | "currentPhase" | "nextPhase",
) {
  const requirements =
    type == "main"
      ? project.requirements
      : type == "currentPhase"
        ? project.phases[project.currentPhase - 1].requirements
        : project.phases[project.currentPhase].requirements;
  requirements.every((requirement) => {
    switch (requirement.type) {
      case "item":
        if (requirement.consume)
          gs.inventory[requirement.data] =
            (gs.inventory[requirement.data] ?? 0) - requirement.num;
        break;
      default:
        break;
    }
  });
}
