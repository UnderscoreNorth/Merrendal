import {
  checkChoiceRequirements,
  choiceMap,
  type Choice,
  type ChoiceEvent,
} from "../choices";
import { pick } from "$lib/util/rolls";

export const firstImpressions = [
  {
    id: "First Impression",
    title: "First Impression",
    desc: `You have arrived as the new lord. How will you introduce yourself to the villagers?`,
    choices: (gs) => {
      return [
        {
          desc: "Execute a villager to establish dominance",
          requirements: [
            {
              type: "pop",
              num: 1,
              consume: true,
              cause: "Executed for intimidation",
            },
          ],
          effects: (gs) => {
            // High authority gain, massive trust loss
            gs.village.authority = Math.min(1000, gs.village.authority + 100);
            gs.village.trust = Math.max(0, gs.village.trust - 150);
            gs.choiceEvents.push(choiceMap["First Impression - Kill"]);
          },
        },
        {
          desc: "Show of Force - Military demonstration",
          requirements: [{ type: "trait", trait: ["Cruel"] }],
          effects: (gs) => {
            // Moderate authority gain, slight trust loss
            gs.village.authority = Math.min(1000, gs.village.authority + 50);
            gs.village.trust = Math.max(0, gs.village.trust - 20);
            gs.choiceEvents.push(choiceMap["First Impression - Show of Force"]);
          },
        },
        {
          desc: "Host a feast for the villagers",
          requirements: [
            {
              type: "item",
              data: "Bread",
              num: 20 * gs.npcs.length,
              consume: false,
            },
          ],
          effects: (gs) => {
            gs.choiceEvents.push(choiceMap["First Impression - Feast"]);
          },
        },
        {
          desc: "Quietly arrive and observe",
          effects: (gs) => {
            // Slight trust loss, slight authority loss
            gs.village.trust = Math.max(0, gs.village.trust - 10);
            gs.village.authority = Math.max(0, gs.village.authority - 10);
            gs.choiceEvents.push(choiceMap["First Impression - Quiet"]);
          },
        },
      ];
    },
  },
  {
    id: "First Impression - Kill",
    title: "Rule Through Fear",
    desc: "You publicly execute a random villager to establish your authority. The villagers watch in horror, too terrified to speak. They will obey you out of fear, but they will never trust you.",
    choices: (gs) => {
      return [{ desc: "Fear is the foundation of order", effects: () => {} }];
    },
  },
  {
    id: "First Impression - Show of Force",
    title: "Military Display",
    desc: "You gather your armed retinue and demonstrate military drills in the village square. The villagers understand that you have the power to enforce your will, but you haven't harmed anyone... yet.",
    choices: (gs) => {
      return [{ desc: "They know who's in charge now", effects: () => {} }];
    },
  },
  {
    id: "First Impression - Quiet",
    title: "The Quiet Arrival",
    desc: "You arrive without fanfare, offering no introduction or engagement with the people. The villagers are uncertain about you - some see it as humility, others as weakness or indifference.",
    choices: (gs) => {
      return [{ desc: "Actions will speak louder than words", effects: () => {} }];
    },
  },

  {
    id: "First Impression - Feast",
    title: "Host Feast",
    desc: "You decide to host a feast to meet the villagers. How lavish should it be?",
    choices: (gs) => {
      return [
        {
          desc: "Host an extravagant feast (100 bread per person)",
          requirements: [
            {
              type: "item",
              data: "Bread",
              num: 100 * gs.npcs.length,
              consume: true,
            },
          ],
          effects: (gs) => {
            (gs as any).feastType = "extravagant";
            gs.choiceEvents.push(
              choiceMap["First Impression - Feast - Preparation"],
            );
          },
        },
        {
          desc: "Host a modest feast (20 bread per person)",
          requirements: [
            {
              type: "item",
              data: "Bread",
              num: 20 * gs.npcs.length,
              consume: true,
            },
          ],
          effects: (gs) => {
            (gs as any).feastType = "modest";
            gs.choiceEvents.push(
              choiceMap["First Impression - Feast - Preparation"],
            );
          },
        },
        {
          desc: "Host a simple gathering (5 bread per person)",
          requirements: [
            {
              type: "item",
              data: "Bread",
              num: 5 * gs.npcs.length,
              consume: true,
            },
          ],
          effects: (gs) => {
            (gs as any).feastType = "simple";
            gs.choiceEvents.push(
              choiceMap["First Impression - Feast - Preparation"],
            );
          },
        },
      ];
    },
  },
  {
    id: "First Impression - Feast - Preparation",
    title: `The Feast's Preparations`,
    desc: "With your decision made, how involved do you get?",
    choices: (gs) => {
      return [
        {
          desc: "Personally greet and meet each villager",
          effects: (gs) => {
            const feastType = (gs as any).feastType;

            // Meet many villagers
            const villagersToMeet = gs.npcs.filter((npc) => !npc.metByLord);
            const numToMeet = Math.floor(villagersToMeet.length * 0.8); // Meet 80% of villagers

            for (let i = 0; i < numToMeet; i++) {
              const villager = pick(villagersToMeet.filter((v) => !v.metByLord));
              if (villager) {
                villager.metByLord = true;
                villager.nameKnown = true;
              }
            }

            // Trust and authority based on feast type
            if (feastType === "extravagant") {
              gs.village.trust = Math.min(1000, gs.village.trust + 80);
              gs.village.authority = Math.min(1000, gs.village.authority + 30);
            } else if (feastType === "modest") {
              gs.village.trust = Math.min(1000, gs.village.trust + 50);
              gs.village.authority = Math.min(1000, gs.village.authority + 20);
            } else {
              gs.village.trust = Math.min(1000, gs.village.trust + 30);
              gs.village.authority = Math.min(1000, gs.village.authority + 10);
            }

            gs.choiceEvents.push(
              choiceMap["First Impression - Feast - Personal Success"],
            );
          },
        },
        {
          desc: "Help prepare the feast yourself",
          effects: (gs) => {
            const feastType = (gs as any).feastType;
            const chance = Math.random();

            // 30% chance of food poisoning disaster
            if (chance < 0.3) {
              gs.choiceEvents.push(
                choiceMap["First Impression - Feast - Food Poisoning"],
              );
            } else {
              // Meet fewer villagers but gain more trust
              const villagersToMeet = gs.npcs.filter((npc) => !npc.metByLord);
              const numToMeet = Math.floor(villagersToMeet.length * 0.5);

              for (let i = 0; i < numToMeet; i++) {
                const villager = pick(villagersToMeet.filter((v) => !v.metByLord));
                if (villager) {
                  villager.metByLord = true;
                  villager.nameKnown = true;
                }
              }

              // Extra trust for being hands-on
              if (feastType === "extravagant") {
                gs.village.trust = Math.min(1000, gs.village.trust + 100);
                gs.village.authority = Math.min(1000, gs.village.authority + 20);
              } else if (feastType === "modest") {
                gs.village.trust = Math.min(1000, gs.village.trust + 70);
                gs.village.authority = Math.min(1000, gs.village.authority + 15);
              } else {
                gs.village.trust = Math.min(1000, gs.village.trust + 50);
                gs.village.authority = Math.min(1000, gs.village.authority + 10);
              }

              gs.choiceEvents.push(
                choiceMap["First Impression - Feast - Hands-On Success"],
              );
            }
          },
        },
        {
          desc: "Let the servants handle everything",
          effects: (gs) => {
            const feastType = (gs as any).feastType;

            // Meet fewer villagers, less personal connection
            const villagersToMeet = gs.npcs.filter((npc) => !npc.metByLord);
            const numToMeet = Math.floor(villagersToMeet.length * 0.4);

            for (let i = 0; i < numToMeet; i++) {
              const villager = pick(villagersToMeet.filter((v) => !v.metByLord));
              if (villager) {
                villager.metByLord = true;
                villager.nameKnown = true;
              }
            }

            // Reduced trust gains, seen as distant
            if (feastType === "extravagant") {
              gs.village.trust = Math.min(1000, gs.village.trust + 40);
              gs.village.authority = Math.min(1000, gs.village.authority + 25);
            } else if (feastType === "modest") {
              gs.village.trust = Math.min(1000, gs.village.trust + 25);
              gs.village.authority = Math.min(1000, gs.village.authority + 15);
            } else {
              gs.village.trust = Math.min(1000, gs.village.trust + 10);
              gs.village.authority = Math.min(1000, gs.village.authority + 5);
            }

            gs.choiceEvents.push(
              choiceMap["First Impression - Feast - Distant Success"],
            );
          },
        },
      ];
    },
  },
  {
    id: "First Impression - Feast - Personal Success",
    title: "A Warm Reception",
    desc: "You personally greet each villager by name, sharing stories and laughter throughout the feast. They are impressed by your generosity and genuine interest in them. Many feel they can trust their new lord.",
    choices: (gs) => {
      const numMet = gs.npcs.filter((npc) => npc.metByLord).length;
      return [{
        desc: `These are good people (Met ${numMet} villagers)`,
        effects: () => {}
      }];
    },
  },
  {
    id: "First Impression - Feast - Hands-On Success",
    title: "A Lord of the People",
    desc: "You roll up your sleeves and help prepare the feast alongside the villagers. They are amazed to see a lord working with their own hands. Though the food is simple, the gesture speaks volumes. You've earned genuine respect.",
    choices: (gs) => {
      const numMet = gs.npcs.filter((npc) => npc.metByLord).length;
      return [{
        desc: `We're all in this together (Met ${numMet} villagers)`,
        effects: () => {}
      }];
    },
  },
  {
    id: "First Impression - Feast - Distant Success",
    title: "A Lordly Distance",
    desc: "The feast proceeds smoothly under your servants' management. The villagers enjoy the food, but you remain somewhat distant. They appreciate the gesture, but wonder if you truly care about them as individuals.",
    choices: (gs) => {
      const numMet = gs.npcs.filter((npc) => npc.metByLord).length;
      return [{
        desc: `A lord must maintain proper distance (Met ${numMet} villagers)`,
        effects: () => {}
      }];
    },
  },
  {
    id: "First Impression - Feast - Food Poisoning",
    title: "A Disastrous Feast",
    desc: "Your attempt to help with the cooking goes horribly wrong. Several villagers fall ill from food poisoning, and rumors spread that you're either incompetent or tried to poison them. Your first impression is a disaster.",
    choices: (gs) => {
      // Massive trust loss, moderate authority loss
      gs.village.trust = Math.max(0, gs.village.trust - 100);
      gs.village.authority = Math.max(0, gs.village.authority - 30);

      return [
        {
          desc: "I should have left it to the professionals...",
          effects: () => {},
        },
      ];
    },
  },
] as const satisfies ChoiceEvent[];
