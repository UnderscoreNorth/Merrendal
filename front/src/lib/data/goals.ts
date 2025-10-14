import { Input } from "./inputoutput";
export type Goal = {
  name: string;
  desc: string;
  requirements: Input[];
  effectID: string;
};

export const goals = {
  "Discover Alchemy": {
    name: "Discover Alchemy",
    desc: `To obtain the philospher's stone`,
    requirements: [{ inputType: "trait", data: ["Alchemy"] }],
    effectID: "",
  },
  /*"Return to grace": {
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
  /* "Get pop to 100": {
    name: "Get pops to 100",
    desc: "Get pops to 100",
    requirements: [{ type: "pop", num: 100, consume: false }],
    effect: (gs) => {},
  },*/
  "Raise an army": {
    name: "Raise an army",
    desc: "Raise an army",
    requirements: [
      { inputType: "villager", num: 30, minAge: 18 },
      {
        inputType: "villager",
        num: 10,
        minAge: 18,
        maxAge: 40,
        kill: "Sent to War",
      },
      { inputType: "item", num: 10, data: "Spears", consume: true },
      { inputType: "item", num: 600, data: "Bread", consume: true },
    ],
    effectID: "",
  },
  /*"Raise taxes": {
    name: "Raise taxes",
    desc: "{{fName}} has been sent by the crown to increase state funds by extracting taxes from this backwater",
    requirements: (gs) => false,
    effect: (gs) => null,
  },*/
} as const satisfies Record<string, Goal>;
