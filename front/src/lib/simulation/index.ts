import { get } from "svelte/store";
import { game } from "../stores";
import { advanceTime } from "./time";
import { consumeFood } from "./food";
import { processEvents } from "./events";
import { processStatuses } from "./statuses";
import { reassignWorkers } from "./workers";
import { procressGoals } from "./goals";
import { determineNeeds } from "./needs";

export function simulateDay() {
  const gs = get(game);
  gs.priorInventory = { ...gs.inventory };
  // Advance time
  advanceTime(gs);

  // Process events after aging
  processEvents(gs);

  // Determine needs
  determineNeeds(gs);

  // Reassign workers after aging (for new 16-year-olds and filling gaps from deaths)
  reassignWorkers(gs);

  // Process goals
  procressGoals(gs);

  // Consume food
  if (gs.currentPeriod == "Afternoon") consumeFood(gs);

  // Process statuses after food consumption
  processStatuses(gs);

  if (gs.currentPeriod === "Morning") {
    gs.currentPeriod = "Afternoon";
  } else if (gs.currentPeriod === "Afternoon") {
    gs.currentPeriod = "Evening";
  } else {
    gs.currentPeriod = "Morning";
  }
  // Update game state
  game.set(gs);
  //console.log(gs);
}
