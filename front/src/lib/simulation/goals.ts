import { type GameState } from "$lib/stores";
import { log } from "./log";
import { killNPC } from "./mortality";

export function procressGoals(gs: GameState) {
  if (gs.lord) {
    const goal = gs.lord.goal;
    if (
      goal.requirements.every((requirement) => {
        switch (requirement.type) {
          case "item":
            return (gs.inventory[requirement.data] ?? 0) >= requirement.num;
          case "pop":
            let pass = 0;
            for (const npc of gs.npcs) {
              if (requirement.min && npc.age < requirement.min) continue;
              if (requirement.max && npc.age > requirement.max) continue;
              pass++;
            }
            return pass >= requirement.num;
          default:
            return false;
        }
      })
    ) {
      goal.requirements.forEach((requirement) => {
        if ("consume" in requirement && requirement.consume == true) {
          switch (requirement.type) {
            case "item":
              //@ts-ignore
              gs.inventory[requirement.data] -= requirement.num;
              break;
            case "pop":
              let pass = 0;
              for (const npc of gs.npcs) {
                if (requirement.min && npc.age < requirement.min) continue;
                if (requirement.max && npc.age > requirement.max) continue;
                pass++;
                killNPC(npc, requirement.cause ?? "", gs);
                if (pass > requirement.num) break;
              }
              break;
            default:
              break;
          }
        }
      });
      goal.effect(gs);
      log(
        gs,
        `Lord ${gs.lord.fName}, the ${gs.lord.background}, achieved his goal: ${gs.lord.goal.desc}`,
        ["Event"],
      );
      gs.pastLords.push(gs.lord);
      gs.lord = undefined;
    }
  }
}
