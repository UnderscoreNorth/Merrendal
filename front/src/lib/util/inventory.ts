import type { ItemName } from "$lib/data/items";
import type { GameState } from "$lib/stores";

export function invGet(gs: GameState, item: ItemName) {
  return gs.inventory[item] ?? 0;
}
export function invAdd(gs: GameState, item: ItemName, amount: number) {
  gs.inventory[item] = (gs.inventory[item] ?? 0) + amount;
}
