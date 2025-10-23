import { type Prosperity } from "$lib/data/village";
import { GameState } from "$lib/stores";

function getProsperity(gs: GameState): Prosperity {
  //If average hunger is above 40, return Destitute
  //If average hunger is above 20, return Struggling
  //If there's no hunger, return Stable
  //If average villager is eating at least 3.5 different food categories, return Thriving
  //If average villager is eating all 4 food categories, and at average food quality eaten is at least 1, return Golden
}
