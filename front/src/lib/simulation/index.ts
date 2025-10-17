import { get } from "svelte/store";
import { game } from "../stores";
import { advanceTime } from "./time";
import { doAssignedJobs } from "./recipes";
import { doConstruction, maintenance } from "./buildings";
import { consumeFood } from "./food";

export function simulateDay() {
  const gs = get(game);
  gs.priorInventory = { ...gs.inventory };

  gs.dailyWorkerActivity.clear();
  doAssignedJobs(gs);
  doConstruction(gs);
  maintenance(gs);
  //doFarming
  //doConstruction
  if (gs.currentPeriod == "Afternoon") consumeFood(gs);
  advanceTime(gs);
  // Update game state
  game.set(gs);
  //console.log(gs);
}
