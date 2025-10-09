import { type GameState } from "$lib/stores";

export function log(gs: GameState, msg: string, tags: string[]) {
  gs.log.unshift({
    year: gs.currentYear,
    day: gs.currentDay,
    msg,
    tags,
  });
}
