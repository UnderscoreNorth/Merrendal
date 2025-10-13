/**
 * Events V2 - JSON-Serializable Event System
 *
 * This is a complete redesign of the event system to be fully JSON-serializable.
 * All function references have been replaced with string handler IDs.
 */

import type { GameState } from "$lib/stores";

// Backward compatibility type aliases
export type Event = EventData;
export type SubEvent = SubEventData;
export type ChoiceEvent = ChoiceEventData;
export type Choice = ChoiceData;
export type Requirement = RequirementData;

// ===== CORE EVENT TYPES =====

/**
 * SubEvent - Represents an action the player can take within an event
 * Now fully JSON-serializable
 */
export type SubEventData = {
  id: string;
  title: string;
  desc: string;
  completed: boolean;
  visible: boolean;
  inProgress?: boolean;
  projectKey?: string;
  choiceGeneratorId: string; // Handler ID instead of function
};

/**
 * EventPhase - Represents the current state of an event
 */
export type EventPhase = {
  id: string;
  name: string;
  desc: string;
  [key: string]: any; // Allow custom properties
};

/**
 * EventData - The main event data structure (fully JSON-serializable)
 */
export type EventData = {
  id: string;
  instanceId: string; // Unique instance ID for tracking
  target: "NPC" | "Building" | "Area";
  desc: string;
  phase: EventPhase;
  subEvents: SubEventData[];
  actionHandlerId: string; // Handler ID for daily action
  resolvedHandlerId: string; // Handler ID for resolved check
  customData?: Record<string, any>; // Store any custom event-specific data
};

/**
 * EventTemplate - Template for creating event instances
 */
export type EventTemplate = {
  id: string;
  target: "NPC" | "Building" | "Area";
  desc: string;
  initialPhase: EventPhase;
  subEvents: Omit<SubEventData, "completed" | "visible" | "inProgress">[];
  actionHandlerId: string;
  resolvedHandlerId: string;
  condition: EventCondition;
  multiple: boolean; // Can this event occur multiple times?
  customData?: Record<string, any>;
};

/**
 * EventCondition - Determines when an event can trigger
 */
export type EventCondition = {
  type: "Time";
  mtth: number; // Mean time to happen (in days)
};

// ===== CHOICE EVENT TYPES =====

/**
 * ChoiceEventData - Represents a choice the player must make (JSON-serializable)
 */
export type ChoiceEventData = {
  id: string;
  instanceId: string;
  title: string;
  desc: string;
  choiceGeneratorId: string; // Handler ID that generates choices
  parentEventId?: string; // Reference to parent event if applicable
  customData?: Record<string, any>;
};

/**
 * Choice - A single choice option (JSON-serializable)
 */
export type ChoiceData = {
  desc: string;
  canPick?: boolean;
  requirements?: RequirementData[];
  effectHandlerId?: string; // Handler ID for effects
  customData?: Record<string, any>;
};

/**
 * RequirementData - Serializable requirement type
 */
export type RequirementData =
  | {
      type: "item";
      data: string;
      num: number;
      consume: boolean;
      not?: boolean;
    }
  | {
      type: "trait";
      trait: string[];
      not?: boolean;
    }
  | {
      type: "season";
      data: string;
      not?: boolean;
    }
  | {
      type: "building";
      data: string;
      not?: boolean;
    }
  | {
      type: "area";
      data: string;
      not?: boolean;
    }
  | {
      type: "hasYield";
      data: boolean;
      not?: boolean;
    }
  | {
      type: "pop";
      min?: number;
      max?: number;
      num: number;
      consume: boolean;
      cause?: string;
      not?: boolean;
    };

// ===== HELPER FUNCTIONS =====

/**
 * Create an event instance from a template
 */
export function createEventInstance(template: EventTemplate): EventData {
  return {
    id: template.id,
    instanceId: `${template.id}_${Date.now()}_${Math.random()}`,
    target: template.target,
    desc: template.desc,
    phase: { ...template.initialPhase },
    subEvents: template.subEvents.map((se) => ({
      ...se,
      completed: false,
      visible: true, // Default visible, templates can override
      inProgress: false,
    })),
    actionHandlerId: template.actionHandlerId,
    resolvedHandlerId: template.resolvedHandlerId,
    customData: template.customData ? { ...template.customData } : {},
  };
}

/**
 * Serialize event data to JSON
 */
export function serializeEvent(event: EventData): string {
  return JSON.stringify(event);
}

/**
 * Deserialize event data from JSON
 */
export function deserializeEvent(json: string): EventData {
  return JSON.parse(json);
}

/**
 * Create a choice event instance
 */
export function createChoiceEventInstance(
  id: string,
  title: string,
  desc: string,
  choiceGeneratorId: string,
  parentEventId?: string,
  customData?: Record<string, any>,
): ChoiceEventData {
  return {
    id,
    instanceId: `${id}_${Date.now()}_${Math.random()}`,
    title,
    desc,
    choiceGeneratorId,
    parentEventId,
    customData,
  };
}

/**
 * Serialize choice event to JSON
 */
export function serializeChoiceEvent(choiceEvent: ChoiceEventData): string {
  return JSON.stringify(choiceEvent);
}

/**
 * Deserialize choice event from JSON
 */
export function deserializeChoiceEvent(json: string): ChoiceEventData {
  return JSON.parse(json);
}
