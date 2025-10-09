import { type GameState } from "$lib/stores";
import { type ItemName } from "../data/items";
import { log } from "./log";

export function processStatuses(gs: GameState) {
  for (const npc of gs.npcs) {
    const statusNames = Object.keys(npc.statuses);

    for (const statusName of statusNames) {
      const status = npc.statuses[statusName];

      // Check if item costs are fulfilled for removal
      const removalConditions = status.removalConditions;
      if (
        removalConditions &&
        status.status == "Active" &&
        removalConditions.items
      ) {
        let canRemove = true;

        // Check if all required items are available
        for (const [itemName, requiredAmount] of Object.entries(
          removalConditions.items,
        )) {
          const availableAmount = gs.inventory[itemName as ItemName] || 0;
          if (availableAmount < requiredAmount) {
            canRemove = false;
            break;
          }
        }

        if (canRemove) {
          // Consume the items
          for (const [itemName, requiredAmount] of Object.entries(
            removalConditions.items,
          )) {
            gs.inventory[itemName as ItemName] =
              (gs.inventory[itemName as ItemName] || 0) - requiredAmount;
          }

          // Set duration to time cost (if any)
          status.duration = removalConditions.time || 0;
          status.status = "Removing";
          log(gs, `<i>${npc.fName}'s</i> ${status.name} is being treated`, [
            "Status",
          ]);
        }
      }

      // Process duration
      if (status.duration === 0) {
        // Remove status
        delete npc.statuses[statusName];
        log(gs, `<i>${npc.fName}'s</i> ${status.name} has been cured`, [
          "Status",
        ]);
      } else if (status.duration > 0) {
        // Tick down duration (but not if it's -1 for infinite)
        status.duration--;
      }
      // If duration is -1, it's infinite and doesn't change
    }
  }
}
