import { get } from "svelte/store";
import { changedAreas, game } from "../stores";
import { advanceTime } from "./time";
import { doAssignedJobs } from "./recipes";
import { doConstruction, maintenance } from "./buildings";
import { doFarming } from "./farming";
import { calculateFood, calculateWarmth } from "./villager";

export function simulateDay() {
  const gs = get(game);
  gs.priorInventory = { ...gs.inventory };

  // Execute the AI's decisions and normal daily activities
  gs.dailyWorkerActivity.clear();
  doAssignedJobs(gs);
  doConstruction(gs);
  maintenance(gs);
  doFarming(gs);
  if (gs.currentPeriod == "Afternoon") calculateFood(gs);
  calculateWarmth(gs);
  advanceTime(gs);
  // Update game state
  game.set(gs);
  gs.dailyWorkerActivity.clear();
}
