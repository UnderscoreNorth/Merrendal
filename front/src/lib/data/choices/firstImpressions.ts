import {
  checkChoiceRequirements,
  choiceMap,
  type Choice,
  type ChoiceEvent,
} from "../choices";

export const firstImpressions = [
  {
    id: "First Impression",
    title: "First Impression",
    desc: `To make your arrival, a first impression should be made.`,
    choices: (gs) => {
      return [
        {
          desc: "Kill random villager",
          requirements: [
            {
              type: "pop",
              num: 1,
              consume: true,
              cause: "Executed for intimidation",
            },
          ],
          effects: (gs) => {
            gs.choiceEvents.push(choiceMap["First Impression - Kill"]);
          },
        },
        {
          desc: "Show of Force",
          requirements: [{ type: "trait", trait: ["Cruel"] }],
          effects: (gs) => {},
        },
        {
          desc: "Host feast",
          requirements: [
            {
              type: "item",
              data: "Bread",
              num: 20 * gs.npcs.length,
              consume: false,
            }, // 10 days of bread
          ],
          effects: (gs) => {
            gs.choiceEvents.push(choiceMap["First Impression - Feast"]);
          },
        },
        {
          desc: "Do Nothing",
        },
      ];
    },
  },
  {
    id: "First Impression - Kill",
    title: "Kill random villager",
    desc: "Ya fucked that up real good ya hear",
    choices: (gs) => {
      return [{ desc: "Fear me!" }];
    },
  },

  {
    id: "First Impression - Feast",
    title: "Host Feast",
    desc: "You decide to host a feast, how far do you go?",
    choices: (gs) => {
      return [
        {
          desc: "Host an extravagant feast",
          requirements: [
            {
              type: "item",
              data: "Bread",
              num: 100 * gs.npcs.length,
              consume: true,
            },
          ],
          effects: (gs) => {
            gs.choiceEvents.push(
              choiceMap["First Impression - Feast - Execution"],
            );
          },
        },
        {
          desc: "Host a modest feast",
          requirements: [
            {
              type: "item",
              data: "Bread",
              num: 10 * gs.npcs.length,
              consume: true,
            },
          ],
          effects: (gs) => {
            gs.choiceEvents.push(
              choiceMap["First Impression - Feast - Execution"],
            );
          },
        },
        {
          desc: "Host a simple gathering",
          requirements: [
            {
              type: "item",
              data: "Bread",
              num: 2 * gs.npcs.length,
              consume: true,
            },
          ],
          effects: (gs) => {
            gs.choiceEvents.push(
              choiceMap["First Impression - Feast - Execution"],
            );
          },
        },
      ];
    },
  },
  {
    id: "First Impression - Feast - Execution",
    title: `The Feast's preparations`,
    desc: "With your decision made, how involved do you get?",
    choices: (gs) => {
      return [
        {
          desc: "Personally invite the villagers",
          effects: (gs) => {
            Math.random() > 0.5
              ? gs.choiceEvents.push(
                  choiceMap["First Impression - Feast - Normal End"],
                )
              : gs.choiceEvents.push(
                  choiceMap["First Impression - Feast - Normal End"],
                );
          },
        },
        {
          desc: "Help prepare the feast",
          effects: (gs) => {
            let chance = Math.random();
            console.log(chance);
            chance > 0.5
              ? gs.choiceEvents.push(
                  choiceMap["First Impression - Feast - Food Poisoning"],
                )
              : gs.choiceEvents.push(
                  choiceMap["First Impression - Feast - Normal End"],
                );
          },
        },
      ];
    },
  },
  {
    id: "First Impression - Feast - Normal End",
    title: "The Feast Concludes",
    desc: "The villagers come around and enjoy a night of feasting.",
    choices: (gs) => {
      return [{ desc: "They must get bigger" }];
    },
  },
  {
    id: "First Impression - Feast - Food Poisoning",
    title: "The Feast Concludes",
    desc: "The villagers come around and initially enjoy the feast, but some start to get sick",
    choices: (gs) => {
      return [
        {
          desc: "I'll leave the cooking to the chefs next time...",
        },
      ];
    },
  },
] as const satisfies ChoiceEvent[];
