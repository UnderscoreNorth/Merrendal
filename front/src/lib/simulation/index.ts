import { get } from "svelte/store";
import { game } from "../stores";
import { advanceTime } from "./time";

export function simulateDay() {
  const gs = get(game);
  gs.priorInventory = { ...gs.inventory };

  // Determine needs
  //determineNeeds(gs);

  // Reassign workers after aging (for new 16-year-olds and filling gaps from deaths)
  //reassignWorkers(gs);

  // Consume food
  //if (gs.currentPeriod == "Afternoon") consumeFood(gs);
  // Advance time
  advanceTime(gs);
  // Update game state
  game.set(gs);
  //console.log(gs);
}
