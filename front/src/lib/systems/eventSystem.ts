import { get } from "svelte/store";
import { game, type GameState } from "$lib/stores";
import type {
  GameEvent,
  EventChoice,
  EventEffect,
  EventRequirement,
  ActiveEvent,
} from "$lib/data/events";
import { createEvent } from "$lib/data/events";

/**
 * Check if a requirement is met
 */
export function checkRequirement(requirement: EventRequirement): boolean {
  const gameState = get(game);

  switch (requirement.type) {
    case "item":
      const itemAmount = gameState.inventory[requirement.item] || 0;
      return itemAmount >= requirement.amount;

    case "villager_count":
      return gameState.npcs.length >= requirement.amount;

    case "village_stat":
      const statValue = gameState.village[requirement.stat];
      if (
        requirement.minValue !== undefined &&
        statValue < requirement.minValue
      ) {
        return false;
      }
      if (
        requirement.maxValue !== undefined &&
        statValue > requirement.maxValue
      ) {
        return false;
      }
      return true;

    default:
      return true;
  }
}

/**
 * Check if all requirements for a choice are met
 */
export function checkChoiceRequirements(choice: EventChoice): boolean {
  if (!choice.requirements || choice.requirements.length === 0) {
    return true;
  }

  return choice.requirements.every((req) => checkRequirement(req));
}

/**
 * Apply an event effect to the game state
 */
export function applyEffect(effect: EventEffect): void {
  game.update((state) => {
    switch (effect.type) {
      case "add_item":
        state.inventory[effect.item] =
          (state.inventory[effect.item] || 0) + effect.amount;
        break;

      case "remove_item":
        state.inventory[effect.item] = Math.max(
          0,
          (state.inventory[effect.item] || 0) - effect.amount,
        );
        break;

      case "modify_village_stat":
        state.village[effect.stat] = Math.max(
          0,
          Math.min(100, state.village[effect.stat] + effect.amount),
        );
        break;

      case "create_event":
        const newEvent = createEvent(
          effect.eventId,
          state.currentYear,
          state.currentDay,
          effect.delay || 0,
        );
        addEventToQueue(newEvent);
        break;

      case "add_villager":
        // This would need proper villager creation logic
        // For now, just log it
        console.log(`Would add ${effect.count} villagers`);
        break;

      case "remove_villager":
        // Remove villagers (move to dead or remove entirely)
        const toRemove = Math.min(effect.count, state.npcs.length);
        for (let i = 0; i < toRemove; i++) {
          if (state.npcs.length > 0) {
            const removed = state.npcs.pop();
            if (removed) {
              state.deadNpcs.push(removed);
            }
          }
        }
        break;

      case "log_message":
        state.log.push({
          year: state.currentYear,
          day: state.currentDay,
          msg: effect.message,
          tags: effect.tags || [],
        });
        break;
    }

    return state;
  });
}

/**
 * Consume requirements (for items/villagers that are consumed)
 */
export function consumeRequirements(requirements: EventRequirement[]): void {
  game.update((state) => {
    for (const req of requirements) {
      if (!req.consumed) continue;

      switch (req.type) {
        case "item":
          state.inventory[req.item] = Math.max(
            0,
            (state.inventory[req.item] || 0) - req.amount,
          );
          break;

        case "villager_count":
          // Remove villagers
          const toRemove = Math.min(req.amount, state.npcs.length);
          for (let i = 0; i < toRemove; i++) {
            if (state.npcs.length > 0) {
              const removed = state.npcs.pop();
              if (removed) {
                state.deadNpcs.push(removed);
              }
            }
          }
          break;
      }
    }

    return state;
  });
}

/**
 * Handle a player's choice in an event
 */
export function handleEventChoice(
  gs: GameState,
  event: GameEvent,
  choice: EventChoice,
): void {
  // Check if choice requirements are met
  if (!checkChoiceRequirements(choice)) {
    console.warn("Choice requirements not met:", choice.id);
    return;
  }

  // Consume requirements if needed
  if (choice.requirements) {
    consumeRequirements(choice.requirements);
  }

  // Apply all effects
  if (choice.effects) {
    for (const effect of choice.effects) {
      applyEffect(effect);
    }
  }
  gs.activeEvents = gs.activeEvents.filter((e) => e.event.id !== event.id);
  console.log(gs.activeEvents);
}

/**
 * Add an event to the queue (internal helper)
 */
function addEventToQueue(event: GameEvent): void {
  game.update((state) => {
    const activeEvent: ActiveEvent = {
      event,
      addedAt: {
        year: state.currentYear,
        day: state.currentDay,
      },
    };

    state.activeEvents.push(activeEvent);
    return state;
  });
}

/**
 * Add an event to the active events queue
 */
export function addEvent(eventId: string, delay: number = 0): void {
  const state = get(game);
  const event = createEvent(
    eventId,
    state.currentYear,
    state.currentDay,
    delay,
  );
  addEventToQueue(event);
}

/**
 * Get the next event that should be displayed
 * Returns the earliest non-delayed event, or null if none available
 */
export function getNextEvent(): ActiveEvent | null {
  const state = get(game);

  if (state.activeEvents.length === 0) {
    return null;
  }

  // Find events that are ready to trigger (no delay or delay has passed)
  const readyEvents = state.activeEvents.filter((ae) => {
    if (!ae.event.triggerAt) return true;

    // Check if trigger time has been reached
    if (state.currentYear > ae.event.triggerAt.year) return true;
    if (
      state.currentYear === ae.event.triggerAt.year &&
      state.currentDay >= ae.event.triggerAt.day
    )
      return true;

    return false;
  });

  if (readyEvents.length === 0) {
    return null;
  }

  // Return the earliest added event
  return readyEvents.sort((a, b) => {
    if (a.addedAt.year !== b.addedAt.year) {
      return a.addedAt.year - b.addedAt.year;
    }
    return a.addedAt.day - b.addedAt.day;
  })[0];
}

/**
 * Update choice enabled states based on current requirements
 */
export function updateChoiceStates(event: GameEvent): GameEvent {
  return {
    ...event,
    choices: event.choices.map((choice) => ({
      ...choice,
      enabled: checkChoiceRequirements(choice),
    })),
  };
}
