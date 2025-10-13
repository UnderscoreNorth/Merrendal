/**
 * Handler Registry System
 *
 * This module provides a centralized registry for all event handlers, choice handlers,
 * and effect handlers. This allows us to reference handlers by string ID instead of
 * direct function references, making the system JSON-serializable.
 */

import type { GameState } from "$lib/stores";
import type { Choice } from "../choices";
import type { EventData } from "../events";

// ===== TYPES =====

/**
 * Handler that runs each day for an event
 */
export type EventActionHandler = (eventData: EventData, gs: GameState) => void;

/**
 * Handler that checks if an event is resolved
 */
export type EventResolvedHandler = (eventData: EventData, gs: GameState) => boolean;

/**
 * Handler that generates choices for a choice event
 */
export type ChoiceGeneratorHandler = (eventData: EventData, gs: GameState) => Choice[];

/**
 * Handler that executes effects when a choice is selected
 */
export type EffectHandler = (eventData: EventData, gs: GameState) => void;

/**
 * Handler for output modifier conditions
 */
export type OutputConditionHandler = (gs: GameState, data?: any) => boolean;

/**
 * Handler for output modifier calculations
 */
export type OutputModifierHandler = (gs: GameState, data?: any) => number;

// ===== REGISTRIES =====

const eventActionHandlers = new Map<string, EventActionHandler>();
const eventResolvedHandlers = new Map<string, EventResolvedHandler>();
const choiceGeneratorHandlers = new Map<string, ChoiceGeneratorHandler>();
const effectHandlers = new Map<string, EffectHandler>();
const outputConditionHandlers = new Map<string, OutputConditionHandler>();
const outputModifierHandlers = new Map<string, OutputModifierHandler>();

// ===== REGISTRATION FUNCTIONS =====

export function registerEventActionHandler(id: string, handler: EventActionHandler): void {
  if (eventActionHandlers.has(id)) {
    console.warn(`EventActionHandler '${id}' is being overwritten`);
  }
  eventActionHandlers.set(id, handler);
}

export function registerEventResolvedHandler(id: string, handler: EventResolvedHandler): void {
  if (eventResolvedHandlers.has(id)) {
    console.warn(`EventResolvedHandler '${id}' is being overwritten`);
  }
  eventResolvedHandlers.set(id, handler);
}

export function registerChoiceGeneratorHandler(id: string, handler: ChoiceGeneratorHandler): void {
  if (choiceGeneratorHandlers.has(id)) {
    console.warn(`ChoiceGeneratorHandler '${id}' is being overwritten`);
  }
  choiceGeneratorHandlers.set(id, handler);
}

export function registerEffectHandler(id: string, handler: EffectHandler): void {
  if (effectHandlers.has(id)) {
    console.warn(`EffectHandler '${id}' is being overwritten`);
  }
  effectHandlers.set(id, handler);
}

export function registerOutputConditionHandler(id: string, handler: OutputConditionHandler): void {
  if (outputConditionHandlers.has(id)) {
    console.warn(`OutputConditionHandler '${id}' is being overwritten`);
  }
  outputConditionHandlers.set(id, handler);
}

export function registerOutputModifierHandler(id: string, handler: OutputModifierHandler): void {
  if (outputModifierHandlers.has(id)) {
    console.warn(`OutputModifierHandler '${id}' is being overwritten`);
  }
  outputModifierHandlers.set(id, handler);
}

// ===== LOOKUP FUNCTIONS =====

export function getEventActionHandler(id: string): EventActionHandler | undefined {
  return eventActionHandlers.get(id);
}

export function getEventResolvedHandler(id: string): EventResolvedHandler | undefined {
  return eventResolvedHandlers.get(id);
}

export function getChoiceGeneratorHandler(id: string): ChoiceGeneratorHandler | undefined {
  return choiceGeneratorHandlers.get(id);
}

export function getEffectHandler(id: string): EffectHandler | undefined {
  return effectHandlers.get(id);
}

export function getOutputConditionHandler(id: string): OutputConditionHandler | undefined {
  return outputConditionHandlers.get(id);
}

export function getOutputModifierHandler(id: string): OutputModifierHandler | undefined {
  return outputModifierHandlers.get(id);
}

// ===== HELPER FUNCTIONS =====

/**
 * Execute an event action handler safely
 */
export function executeEventAction(handlerId: string, eventData: EventData, gs: GameState): void {
  const handler = getEventActionHandler(handlerId);
  if (!handler) {
    console.error(`EventActionHandler '${handlerId}' not found`);
    return;
  }
  try {
    handler(eventData, gs);
  } catch (error) {
    console.error(`Error executing EventActionHandler '${handlerId}':`, error);
  }
}

/**
 * Execute an event resolved check safely
 */
export function executeEventResolvedCheck(handlerId: string, eventData: EventData, gs: GameState): boolean {
  const handler = getEventResolvedHandler(handlerId);
  if (!handler) {
    console.error(`EventResolvedHandler '${handlerId}' not found`);
    return false;
  }
  try {
    return handler(eventData, gs);
  } catch (error) {
    console.error(`Error executing EventResolvedHandler '${handlerId}':`, error);
    return false;
  }
}

/**
 * Generate choices safely
 */
export function generateChoices(handlerId: string, eventData: EventData, gs: GameState): Choice[] {
  const handler = getChoiceGeneratorHandler(handlerId);
  if (!handler) {
    console.error(`ChoiceGeneratorHandler '${handlerId}' not found`);
    return [];
  }
  try {
    return handler(eventData, gs);
  } catch (error) {
    console.error(`Error executing ChoiceGeneratorHandler '${handlerId}':`, error);
    return [];
  }
}

/**
 * Execute an effect handler safely
 */
export function executeEffect(handlerId: string, eventData: EventData, gs: GameState): void {
  const handler = getEffectHandler(handlerId);
  if (!handler) {
    console.error(`EffectHandler '${handlerId}' not found`);
    return;
  }
  try {
    handler(eventData, gs);
  } catch (error) {
    console.error(`Error executing EffectHandler '${handlerId}':`, error);
  }
}
