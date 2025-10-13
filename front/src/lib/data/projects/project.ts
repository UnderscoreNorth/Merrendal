/**
 * Projects V2 - JSON-Serializable Project System
 *
 * This is a redesign of the project system to be fully JSON-serializable.
 */

import type { BuildingType } from "../buildings";
import type { ItemRecord } from "../items";
import type { RequirementData } from "../events";

// Re-export for backward compatibility
export type { RequirementData };

// Backward compatibility type aliases
export type Project = ProjectData;
export type ProjectPhase = ProjectPhaseData;
export type OutputModifier = OutputModifierData;
export type ProjectOutput = ProjectOutputData;

// ===== CORE PROJECT TYPES =====

/**
 * ProjectPhase - A single phase of a project (JSON-serializable)
 */
export type ProjectPhaseData = {
  name: string;
  manDaysRequired: number;
  progressPercent: number;
  maxDailyProgress?: number;
  requirements: RequirementData[];
  requireOperator?: "OR";
  occupationTitle?: string;
  stuck: boolean; // Workers can't be reassigned
  worksAtNight?: boolean;
  outputModifiers?: OutputModifierData[];
  building?: BuildingType;
};

/**
 * OutputModifier - Modifies project output (JSON-serializable)
 */
export type OutputModifierData = {
  conditionHandlerId: string; // Handler ID for condition check
  modifierHandlerId: string; // Handler ID for modifier calculation
  description: string;
  conditionData?: any; // Optional data passed to condition handler
  modifierData?: any; // Optional data passed to modifier handler
};

/**
 * ProjectOutput - Represents what a project produces (JSON-serializable)
 */
export type ProjectOutputData =
  | {
      type: "items";
      data: ItemRecord;
    }
  | {
      type: "area_yield";
      data: ItemRecord;
    }
  | {
      type: "building";
      buildingType: BuildingType;
      buildingId: string;
    };

/**
 * ProjectData - The main project data structure (fully JSON-serializable)
 */
export type ProjectData = {
  type: string;
  instanceId: string; // Unique instance ID
  currentPhase: number;
  phases: ProjectPhaseData[];
  outputs: ProjectOutputData[];
  workers: number[]; // Array instead of Set for JSON serialization
  requirements: RequirementData[];
  dailyProgress: number;
  customData?: Record<string, any>; // Store any custom project-specific data
};

/**
 * ProjectTemplate - Template for creating project instances
 */
export type ProjectTemplate = {
  type: string;
  phases: ProjectPhaseData[];
  outputs: ProjectOutputData[];
  requirements: RequirementData[];
  customData?: Record<string, any>;
};

// ===== HELPER FUNCTIONS =====

/**
 * Create a project instance from a template
 */
export function createProjectInstance(template: ProjectTemplate): ProjectData {
  return {
    type: template.type,
    instanceId: `${template.type}_${Date.now()}_${Math.random()}`,
    currentPhase: 1,
    phases: template.phases.map((phase) => ({
      ...phase,
      progressPercent: 0,
    })),
    outputs: [...template.outputs],
    workers: [],
    requirements: [...template.requirements],
    dailyProgress: 0,
    customData: template.customData ? { ...template.customData } : {},
  };
}

/**
 * Serialize project data to JSON
 */
export function serializeProject(project: ProjectData): string {
  return JSON.stringify(project);
}

/**
 * Deserialize project data from JSON
 */
export function deserializeProject(json: string): ProjectData {
  return JSON.parse(json);
}

/**
 * Add a worker to a project
 */
export function addWorkerToProject(
  project: ProjectData,
  workerId: number,
): void {
  if (!project.workers.includes(workerId)) {
    project.workers.push(workerId);
  }
}

/**
 * Remove a worker from a project
 */
export function removeWorkerFromProject(
  project: ProjectData,
  workerId: number,
): void {
  const index = project.workers.indexOf(workerId);
  if (index !== -1) {
    project.workers.splice(index, 1);
  }
}

/**
 * Get the current phase of a project
 */
export function getCurrentPhase(
  project: ProjectData,
): ProjectPhaseData | undefined {
  return project.phases[project.currentPhase - 1];
}

/**
 * Check if a project is complete
 */
export function isProjectComplete(project: ProjectData): boolean {
  const currentPhase = getCurrentPhase(project);
  return (
    project.currentPhase > project.phases.length ||
    (!!currentPhase && currentPhase.progressPercent >= 100)
  );
}

/**
 * Advance project to next phase
 */
export function advanceToNextPhase(project: ProjectData): boolean {
  if (project.currentPhase < project.phases.length) {
    project.currentPhase++;
    project.dailyProgress = 0;
    return true;
  }
  return false;
}
