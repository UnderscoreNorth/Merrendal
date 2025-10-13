/**
 * Farm Wheat Project - V2 (JSON-Serializable)
 *
 * Converted to V2 JSON-serializable architecture.
 * Three-phase farming: Planting (Spring) → Irrigation (Summer) → Harvest (Autumn)
 */

import type { Area } from "../../areas";
import type { ProjectTemplate, ProjectData } from "../project";
import type { GameState } from "$lib/stores";
import {
  registerOutputConditionHandler,
  registerOutputModifierHandler,
} from "../../handlers/registry";

// ===== OUTPUT MODIFIER HANDLERS =====

// Planting phase: progress affects output
registerOutputConditionHandler(
  "wheat_planting_condition",
  (gs: GameState, data?: any) => {
    return true; // Always applies
  },
);

registerOutputModifierHandler(
  "wheat_planting_modifier",
  (gs: GameState, data?: any) => {
    const projectData = data as ProjectData;
    return projectData.phases[0]?.progressPercent / 100 || 0;
  },
);

// Irrigation phase: yield efficiency and progress affect output
registerOutputConditionHandler(
  "wheat_irrigation_condition",
  (gs: GameState, data?: any) => {
    return true; // Always applies
  },
);

registerOutputModifierHandler(
  "wheat_irrigation_modifier",
  (gs: GameState, data?: any) => {
    const projectData = data as { project: ProjectData; area: Area };
    const area = projectData.area;
    const project = projectData.project;

    const yieldEff = area.yieldEff.Wheat ?? 1;
    const progress = project.phases[1]?.progressPercent / 100 || 0;

    return yieldEff * progress;
  },
);

// Harvest phase: progress affects output
registerOutputConditionHandler(
  "wheat_harvest_condition",
  (gs: GameState, data?: any) => {
    return true; // Always applies
  },
);

registerOutputModifierHandler(
  "wheat_harvest_modifier",
  (gs: GameState, data?: any) => {
    const projectData = data as ProjectData;
    return projectData.phases[2]?.progressPercent / 100 || 0;
  },
);

// ===== PROJECT TEMPLATE FACTORY =====

/**
 * Creates a Farm Wheat project template for a specific area
 */
export function createFarmWheatTemplate(area: Area): ProjectTemplate {
  if (!area) throw new Error("Farm Wheat project requires an area");

  const acres = area.acres;

  return {
    type: "Farm Wheat",
    phases: [
      {
        name: "Planting",
        manDaysRequired: (acres * 50) / 5,
        progressPercent: 0,
        building: "Farm House",
        requirements: [],
        stuck: false,
        outputModifiers: [
          {
            conditionHandlerId: "wheat_planting_condition",
            modifierHandlerId: "wheat_planting_modifier",
            description: "Planting progress affects output",
          },
        ],
      },
      {
        name: "Irrigation",
        manDaysRequired: acres / 10,
        progressPercent: 0,
        building: "Farm House",
        maxDailyProgress: 100 / 90,
        requirements: [
          { type: "season", data: "Summer" },
          // Note: "progress" type requirement needs to be handled in project processing
        ],
        stuck: false,
        outputModifiers: [
          {
            conditionHandlerId: "wheat_irrigation_condition",
            modifierHandlerId: "wheat_irrigation_modifier",
            description:
              "Irrigation progress and yield efficiency affect output",
          },
        ],
      },
      {
        name: "Harvest",
        manDaysRequired: (acres * 50) / 5,
        progressPercent: 0,
        building: "Farm House",
        requirements: [
          { type: "season", data: "Autumn" },
          // Note: "progress" type requirement needs to be handled in project processing
        ],
        requireOperator: "OR",
        stuck: false,
        outputModifiers: [
          {
            conditionHandlerId: "wheat_harvest_condition",
            modifierHandlerId: "wheat_harvest_modifier",
            description: "Harvest progress affects output",
          },
        ],
      },
    ],
    outputs: [
      {
        type: "items",
        data: { Wheat: acres * 10 },
      },
    ],
    requirements: [
      { type: "season", data: "Spring" },
      { type: "building", data: "Farm House" },
    ],
    customData: {
      areaId: area.areaID,
      acres: acres,
    },
  };
}

/**
 * Project constructor for compatibility with existing system
 */
export const proj_FarmWheat = {
  constructor: ({ area }: { area?: Area }) => {
    if (!area) throw new Error("No area");
    const template = createFarmWheatTemplate(area);

    // Create a project instance from the template
    // This would normally use createProjectInstance from project.ts
    const project: any = {
      type: template.type,
      instanceId: `${template.type}_${Date.now()}_${Math.random()}`,
      currentPhase: 1,
      phases: template.phases.map((phase) => ({ ...phase })),
      outputs: [...template.outputs],
      workers: [], // Array instead of Set for V2
      requirements: [...template.requirements],
      dailyProgress: 0,
      customData: template.customData,
    };

    return project;
  },
  expectedOutputs: { items: ["Wheat"] },
};

// ===== V2 EXPORT =====

/**
 * V2 Project Template for Farm Wheat
 *
 * This is a factory function because the template depends on the area's acres.
 * Call this function with an area to get a specific template.
 *
 * @example
 * ```typescript
 * const template = createFarmWheatTemplate(myArea);
 * const project = createProjectInstance(template);
 * ```
 */
export const farmWheatTemplateFactory = createFarmWheatTemplate;
