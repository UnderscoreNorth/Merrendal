import { killNPC } from "$lib/simulation/mortality";
import type { GameState } from "$lib/stores";
import { arrayToObject } from "$lib/util/arrayToObject";
import { firstImpressions } from "./choices/firstImpressions";
import type { Requirement } from "./requirement";

export type ChoiceEvent = {
  id: string;
  title: string;
  desc: string;
  choices: (gs: GameState) => Choice[];
};
export type Choice = {
  desc: string;
  canPick?: boolean;
  requirements?: Requirement[];
  effects?: (gs: GameState) => void;
};
export const choices = [...firstImpressions] as const satisfies ChoiceEvent[];
export type choiceIDs = (typeof choices)[number]["id"];
export const choiceMap = arrayToObject(choices);

// Helper function to check if choice requirements are met
export function checkChoiceRequirements(gs: GameState, choice: Choice) {
  choice.canPick = true;
  if (choice.requirements == undefined) return;
  if (
    !choice.requirements.every((requirement) =>
      checkRequirement(gs, requirement),
    )
  )
    choice.canPick = false;
}

function checkRequirement(gs: GameState, requirement: Requirement): boolean {
  const result = (() => {
    switch (requirement.type) {
      case "item":
        return (gs.inventory[requirement.data] ?? 0) >= requirement.num;
      case "trait":
        const lord = gs.lord;
        if (lord == undefined) {
          return false;
        } else {
          return requirement.trait.every((trait) => lord.traits.has(trait));
        }
      case "season":
        return gs.season === requirement.data;
      case "building":
        return gs.areas.some((area) =>
          area.buildings.some(
            (building) =>
              building.type === requirement.data && building.status === "Built",
          ),
        );
      case "area":
        return gs.areas.some((area) => area.type === requirement.data);
      case "hasYield":
        return (
          gs.areas.some((area) => Object.keys(area.yieldEff).length > 0) ===
          requirement.data
        );
      case "pop":
        const matchingNPCs = gs.npcs.filter((npc) => {
          const ageMatch =
            (!requirement.min || npc.age >= requirement.min) &&
            (!requirement.max || npc.age <= requirement.max);
          return ageMatch;
        });
        return matchingNPCs.length >= requirement.num;
      default:
        return false;
    }
  })();

  // Apply 'not' modifier if present
  return requirement.not ? !result : result;
}

// Helper function to consume choice requirements
export function consumeChoiceRequirements(gs: GameState, choice: Choice): void {
  if (choice.requirements == undefined) return;
  choice.requirements.forEach((requirement) => {
    if ("consume" in requirement) {
      switch (requirement.type) {
        case "item":
          gs.inventory[requirement.data] =
            (gs.inventory[requirement.data] ?? 0) - requirement.num;
          break;
        case "pop":
          if (requirement.cause) {
            const npcsToRemove = gs.npcs
              .filter((npc) => {
                const ageMatch =
                  (!requirement.min || npc.age >= requirement.min) &&
                  (!requirement.max || npc.age <= requirement.max);
                return ageMatch;
              })
              .slice(0, requirement.num);

            npcsToRemove.forEach((npc) => {
              killNPC(npc, requirement.cause ?? "", gs);
            });
          }
          break;
      }
    }
  });
}
