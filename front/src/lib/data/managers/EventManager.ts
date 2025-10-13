/**
 * Event Manager
 *
 * Manages the lifecycle of events, including triggering, updating, and resolving them.
 * Works with the new JSON-serializable event system.
 */

import type { GameState } from "$lib/stores";
import type { EventData, EventTemplate, ChoiceEventData } from "../events";
import { createEventInstance, createChoiceEventInstance } from "../events";
import {
  executeEventAction,
  executeEventResolvedCheck,
  generateChoices,
  executeEffect,
} from "../handlers/registry";
import type { ChoiceData } from "../events";
import {
  checkChoiceRequirements as checkReqs,
  consumeChoiceRequirements as consumeReqs,
} from "../choices";

/**
 * EventManager class - handles all event-related operations
 */
export class EventManager {
  private eventTemplates = new Map<string, EventTemplate>();

  /**
   * Register an event template
   */
  registerEventTemplate(template: EventTemplate): void {
    if (this.eventTemplates.has(template.id)) {
      console.warn(`EventTemplate '${template.id}' is being overwritten`);
    }
    this.eventTemplates.set(template.id, template);
  }

  /**
   * Get an event template by ID
   */
  getEventTemplate(id: string): EventTemplate | undefined {
    return this.eventTemplates.get(id);
  }

  /**
   * Get all registered event templates
   */
  getAllEventTemplates(): EventTemplate[] {
    return Array.from(this.eventTemplates.values());
  }

  /**
   * Create a new event instance from a template
   */
  createEvent(templateId: string): EventData | undefined {
    const template = this.getEventTemplate(templateId);
    if (!template) {
      console.error(`EventTemplate '${templateId}' not found`);
      return undefined;
    }
    return createEventInstance(template);
  }

  /**
   * Process daily actions for all active events
   */
  processEvents(gs: GameState): void {
    // Process each active event
    for (const event of gs.events) {
      this.processEvent(event, gs);
    }

    // Remove resolved events
    gs.events = gs.events.filter((event) => !this.isEventResolved(event, gs));
  }

  /**
   * Process a single event's daily action
   */
  processEvent(event: EventData, gs: GameState): void {
    executeEventAction(event.actionHandlerId, event, gs);
  }

  /**
   * Check if an event is resolved
   */
  isEventResolved(event: EventData, gs: GameState): boolean {
    return executeEventResolvedCheck(event.resolvedHandlerId, event, gs);
  }

  /**
   * Generate choices for a choice event
   */
  generateChoicesForEvent(
    choiceEvent: ChoiceEventData,
    gs: GameState,
  ): ChoiceData[] {
    // Find parent event if it exists
    let parentEvent: EventData | undefined;
    if (choiceEvent.parentEventId) {
      parentEvent = gs.events.find(
        (e) => e.instanceId === choiceEvent.parentEventId,
      );
    }

    // Generate choices using the handler
    const choices = generateChoices(
      choiceEvent.choiceGeneratorId,
      parentEvent || ({ customData: choiceEvent.customData } as any),
      gs,
    );

    // Check requirements for each choice
    choices.forEach((choice) => {
      // Convert old Choice type to ChoiceData if needed
      const choiceData = choice as ChoiceData;
      if (choiceData.requirements) {
        choiceData.canPick = this.checkChoiceRequirements(gs, choiceData);
      } else {
        choiceData.canPick = true;
      }
    });

    return choices;
  }

  /**
   * Execute a choice's effects
   */
  executeChoice(
    choiceEvent: ChoiceEventData,
    choice: ChoiceData,
    gs: GameState,
  ): void {
    // Consume requirements
    if (choice.requirements) {
      this.consumeChoiceRequirements(gs, choice);
    }

    // Execute effects
    if (choice.effectHandlerId) {
      // Find parent event if it exists
      let parentEvent: EventData | undefined;
      if (choiceEvent.parentEventId) {
        parentEvent = gs.events.find(
          (e) => e.instanceId === choiceEvent.parentEventId,
        );
      }

      executeEffect(
        choice.effectHandlerId,
        parentEvent || ({ customData: choiceEvent.customData } as any),
        gs,
      );
    }
  }

  /**
   * Check if choice requirements are met
   */
  private checkChoiceRequirements(gs: GameState, choice: ChoiceData): boolean {
    if (!choice.requirements) return true;

    // Use existing checkRequirement logic from choices.ts
    // We'll need to bridge the old and new systems temporarily
    return choice.requirements.every((req) => this.checkRequirement(gs, req));
  }

  /**
   * Consume choice requirements
   */
  private consumeChoiceRequirements(gs: GameState, choice: ChoiceData): void {
    if (!choice.requirements) return;

    // Bridge to old system temporarily
    const oldChoice = choice as any;
    consumeReqs(gs, oldChoice);
  }

  /**
   * Check a single requirement (bridge method)
   */
  private checkRequirement(gs: GameState, requirement: any): boolean {
    // Use existing checkRequirement logic
    const oldChoice = { requirements: [requirement], canPick: true } as any;
    checkReqs(gs, oldChoice);
    return oldChoice.canPick;
  }

  /**
   * Trigger an event (add it to the active events list)
   */
  triggerEvent(templateId: string, gs: GameState): EventData | undefined {
    const event = this.createEvent(templateId);
    if (!event) return undefined;

    gs.events.push(event);
    return event;
  }

  /**
   * Remove an event from active events
   */
  removeEvent(eventInstanceId: string, gs: GameState): boolean {
    const index = gs.events.findIndex((e) => e.instanceId === eventInstanceId);
    if (index !== -1) {
      gs.events.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Find an event by instance ID
   */
  findEvent(eventInstanceId: string, gs: GameState): EventData | undefined {
    return gs.events.find((e) => e.instanceId === eventInstanceId);
  }

  /**
   * Check if an event can trigger based on its condition
   */
  canEventTrigger(template: EventTemplate, gs: GameState): boolean {
    // Check if event is already active (and multiple is false)
    if (!template.multiple) {
      const alreadyActive = gs.events.some((e) => e.id === template.id);
      if (alreadyActive) return false;
    }

    // Check condition
    switch (template.condition.type) {
      case "Time":
        // MTTH-based probability check
        const probability = 1 / template.condition.mtth;
        return Math.random() < probability;
      default:
        return false;
    }
  }

  /**
   * Process event triggers (called daily)
   */
  processEventTriggers(gs: GameState): void {
    for (const template of this.getAllEventTemplates()) {
      if (this.canEventTrigger(template, gs)) {
        this.triggerEvent(template.id, gs);
      }
    }
  }
}

// Export singleton instance
export const eventManager = new EventManager();
