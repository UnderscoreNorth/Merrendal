import type { GameState } from "$lib/stores";
import { recordLoop } from "$lib/util/recordLoop";
import { getAllBuildings } from "./buildings";
import { skillUp } from "./workers";
import { recipes as baseRecipes } from "../data/recipes";

export function doAssignedJobs(gs: GameState) {
  if (gs.currentPeriod == "Evening") return;
  for (const building of getAllBuildings(gs)) {
    // For burgages, use residents instead of assigned workers
    const isBurgage = building.buildingType === "Burgage";
    const workers = isBurgage
      ? gs.npcs.filter(
          (i) =>
            i.home === building.id &&
            i.age >= 16 &&
            !gs.dailyWorkerActivity.has(i.id),
        )
      : gs.npcs.filter(
          (i) =>
            building.workers.has(i.id) && !gs.dailyWorkerActivity.has(i.id),
        );

    let recipes = Array.from(
      new Set(workers.map((i) => i.job?.recipe).filter((i) => i !== undefined)),
    );
    if (building.allowedRecipes.length && recipes.length == 0)
      recipes.push(building.allowedRecipes[0]);
    for (const recipe of recipes) {
      if (recipe == undefined) continue;
      if (!building.allowedRecipes.includes(recipe)) continue;
      const recipeWorkers = workers.filter((i) => i.job?.recipe == recipe);
      const recipeTemplate = baseRecipes[recipe];
      for (let worker of recipeWorkers) {
        let index = building.currentProjects.findIndex(
          (i) => i.output == recipe,
        );
        if (index == -1) {
          if (
            recipeWorkers.filter((i) => !gs.dailyWorkerActivity.has(i.id))
              .length >= recipeTemplate.numWorkers
          ) {
            const newRecipe = recipeTemplate.constructor({
              gs,
              workers: [worker],
              building,
            });
            if (
              recordLoop(newRecipe.input).every(([itemName, amount]) => {
                return (gs.inventory[itemName] ?? 0) >= amount;
              })
            ) {
              recordLoop(newRecipe.input).forEach(([itemName, amount]) => {
                gs.inventory[itemName] = (gs.inventory[itemName] ?? 0) - amount;
              });
              building.currentProjects.push({
                amount: newRecipe.amount,
                input: newRecipe.input,
                output: recipe,
                numWorkers: recipeTemplate.numWorkers,
                periodsLeft: newRecipe.numPeriods,
                type: "recipe",
              });
              index = building.currentProjects.length - 1;
            }
          }
        }
        if (index == -1) continue;
        let currentRecipe = building.currentProjects[index];
        currentRecipe.periodsLeft -= 1 / currentRecipe.numWorkers;
        gs.dailyWorkerActivity.add(worker.id);
        if (Math.random() > 0.5 && worker.job?.title)
          skillUp(gs, worker, worker.job.title);
        if (currentRecipe !== undefined && currentRecipe.periodsLeft == 0) {
          gs.inventory[currentRecipe.output] =
            (gs.inventory[currentRecipe.output] ?? 0) + currentRecipe.amount;
          building.currentProjects.splice(index, 1);
        }
      }
      let currentRecipe = building.currentProjects.find(
        (i) => i.output == recipe,
      );
      if (currentRecipe !== undefined)
        currentRecipe.periodsLeft = Math.ceil(currentRecipe.periodsLeft);
    }
  }
}
