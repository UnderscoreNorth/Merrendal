import { eventData } from "$lib/data/events/data";
import { type GameState } from "$lib/stores";

export function processEvents(gs: GameState) {
  for (const event of eventData) {
    if (!event.multiple && gs.activeEvents.some((e) => e.id == event.id))
      continue;
    if (event.condition.type === "Time") {
      // Calculate probability based on MTTH (Mean Time To Happen)
      // MTTH is the number of years for 50% chance
      // Daily probability = 1 - (0.5)^(1/(MTTH * 365))
      const mtthInDays = event.condition.mtth * 365;
      const dailyProbability = 1 - Math.pow(0.5, 1 / mtthInDays);
      if (Math.random() < dailyProbability) {
        gs.activeEvents.push(new event.event(event.id));
      }
    }
  }
  for (let i = gs.activeEvents.length - 1; i >= 0; i--) {
    const event = gs.activeEvents[i];
    event.action({ gs });
    if (event.resolved({ gs })) gs.activeEvents.splice(i, 1);
  }
}
