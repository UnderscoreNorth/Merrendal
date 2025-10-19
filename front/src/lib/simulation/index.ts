import { get } from "svelte/store";
import { game } from "../stores";
import { advanceTime } from "./time";
import { doAssignedJobs } from "./recipes";
import { doConstruction, maintenance } from "./buildings";
import { consumeFood } from "./food";
import { doFarming } from "./farming";

export function simulateDay() {
  const gs = get(game);
  gs.priorInventory = { ...gs.inventory };

  gs.dailyWorkerActivity.clear();
  doAssignedJobs(gs);
  doConstruction(gs);
  maintenance(gs);
  doFarming(gs);
  if (gs.currentPeriod == "Afternoon") consumeFood(gs);
  advanceTime(gs);
  // Update game state
  game.set(gs);
  gs.dailyWorkerActivity.clear();
}
