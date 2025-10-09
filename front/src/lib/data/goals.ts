import { killNPC } from "$lib/simulation/mortality";
import { type GameState } from "$lib/stores";
import { getStat } from "./npcs";
import type { Requirement } from "./requirement";

export type Goal = {
  name: string;
  desc: string;
  requirements: Requirement[];
  effect: (gs: GameState) => void;
};

export const goals = {
  /*"Discover Alchemy": {
    name: "Discover Alchemy",
    desc: `To obtain the philospher's stone`,
    requirements: (gs) => false,
    effect: (gs) => null,
  },
  "Return to grace": {
    name: "Return to grace",
    desc: "Exiled after a political faux-pas. {{fName}} is determined to return",
    requirements: (gs) => false,
    effect: (gs) => null,
  },
  "Rebuild the village": {
    name: "Rebuild the village",
    desc: "After years of oppression by cruel lords, {{fName}} rises up for their people.",
    requirements: (gs) => false,
    effect: (gs) => null,
  },*/
  "Get pop to 100": {
    name: "Get pops to 100",
    desc: "Get pops to 100",
    requirements: [{ type: "pop", num: 100, consume: false }],
    effect: (gs) => {},
  },
  "Raise an army": {
    name: "Raise an army",
    desc: "Raise an army",
    requirements: [
      { type: "pop", num: 30, min: 18, consume: false },
      {
        type: "pop",
        num: 10,
        min: 18,
        max: 40,
        consume: true,
        cause: "Sent to War",
      },
      { type: "item", num: 10, data: "Spears", consume: true },
      { type: "item", num: 600, data: "Bread", consume: true },
    ],

    /*(gs) => {
      return (
        gs.npcs.filter((npc) => {
          return npc.age >= 18;
        }).length > 20 &&
        gs.npcs.filter((npc) => {
          return npc.age >= 18 && npc.age < 40;
        }).length >= 10 &&
        (gs.inventory.Spears ?? 0) >= 10
      );
    },*/
    effect: (gs) => {},
  },
  /*"Raise taxes": {
    name: "Raise taxes",
    desc: "{{fName}} has been sent by the crown to increase state funds by extracting taxes from this backwater",
    requirements: (gs) => false,
    effect: (gs) => null,
  },*/
} as const satisfies Record<string, Goal>;
