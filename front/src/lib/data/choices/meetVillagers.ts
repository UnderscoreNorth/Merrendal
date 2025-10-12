import type { GameState } from "$lib/stores";
import { pick } from "$lib/util/rolls";
import type { ChoiceEvent } from "../choices";

export function createMeetVillagersEvent(areaId: string): ChoiceEvent {
  return {
    id: `meet_villagers_${areaId}`,
    title: "Meet the Villagers",
    desc: "You approach the village to meet the people who live here. How do you want to introduce yourself?",
    choices: (gs) => {
      const villagersInArea = gs.npcs.filter(
        (npc) => npc.homeAreaId === areaId,
      );
      const unmetVillagers = villagersInArea.filter((npc) => !npc.metByLord);

      if (unmetVillagers.length === 0) {
        return [
          {
            desc: "You've already met everyone here",
            effects: () => {},
          },
        ];
      }

      return [
        {
          desc: "Approach humbly and listen to their concerns",
          effects: (gs) => {
            // Mark that an area action has been taken
            gs.areaActionTaken = true;

            // Meet 1-3 random villagers
            const numToMeet = Math.min(
              Math.floor(Math.random() * 3) + 20,
              unmetVillagers.length,
            );
            const metVillagers: string[] = [];

            for (let i = 0; i < numToMeet; i++) {
              const villager = pick(unmetVillagers.filter((v) => !v.metByLord));
              if (villager) {
                villager.metByLord = true;
                villager.nameKnown = true;
                metVillagers.push(villager.fName);
              }
            }

            // Increase trust
            gs.village.trust = Math.min(1000, gs.village.trust + 15);

            // Follow-up event
            gs.choiceEvents.push({
              id: `meet_result_humble_${areaId}`,
              title: "A Warm Welcome",
              desc: `You met ${metVillagers.join(", ")}. They appreciate your humility and share their concerns about food supplies and safety. Trust increased by 15.`,
              choices: () => [
                {
                  desc: "I'll do what I can to help",
                  effects: () => {},
                },
              ],
            });
          },
        },
        {
          desc: "Assert your authority as the new lord",
          effects: (gs) => {
            // Mark that an area action has been taken
            gs.areaActionTaken = true;

            // Meet 1-2 random villagers
            const numToMeet = Math.min(
              Math.floor(Math.random() * 2) + 1,
              unmetVillagers.length,
            );
            const metVillagers: string[] = [];

            for (let i = 0; i < numToMeet; i++) {
              const villager = pick(unmetVillagers.filter((v) => !v.metByLord));
              if (villager) {
                villager.metByLord = true;
                villager.nameKnown = true;
                metVillagers.push(villager.fName);
              }
            }

            // Increase authority, slight decrease to trust
            gs.village.authority = Math.min(1000, gs.village.authority + 20);
            gs.village.trust = Math.max(0, gs.village.trust - 5);

            // Follow-up event
            gs.choiceEvents.push({
              id: `meet_result_authority_${areaId}`,
              title: "Respect Through Power",
              desc: `You met ${metVillagers.join(", ")}. They bow to your authority, though some seem wary. Authority increased by 20, trust decreased by 5.`,
              choices: () => [
                {
                  desc: "They will learn to respect me",
                  effects: () => {},
                },
              ],
            });
          },
        },
        {
          desc: "Share a meal and stories with them",
          effects: (gs) => {
            // Mark that an area action has been taken
            gs.areaActionTaken = true;

            // Meet 2-4 random villagers
            const numToMeet = Math.min(
              Math.floor(Math.random() * 3) + 2,
              unmetVillagers.length,
            );
            const metVillagers: string[] = [];

            for (let i = 0; i < numToMeet; i++) {
              const villager = pick(unmetVillagers.filter((v) => !v.metByLord));
              if (villager) {
                villager.metByLord = true;
                villager.nameKnown = true;
                metVillagers.push(villager.fName);
              }
            }

            // Large trust increase, requires bread
            const breadCost = numToMeet * 10;
            if ((gs.inventory["Bread"] || 0) >= breadCost) {
              gs.inventory["Bread"] = (gs.inventory["Bread"] || 0) - breadCost;
              gs.village.trust = Math.min(1000, gs.village.trust + 30);

              // Follow-up event
              gs.choiceEvents.push({
                id: `meet_result_feast_${areaId}`,
                title: "Bonds of Fellowship",
                desc: `You shared a meal with ${metVillagers.join(", ")}. They warm to you quickly, sharing stories and laughter. Trust increased by 30. (Cost: ${breadCost} bread)`,
                choices: () => [
                  {
                    desc: "These are good people",
                    effects: () => {},
                  },
                ],
              });
            } else {
              // Not enough bread - embarrassing outcome
              gs.village.trust = Math.max(0, gs.village.trust - 10);

              gs.choiceEvents.push({
                id: `meet_result_feast_fail_${areaId}`,
                title: "Empty Promises",
                desc: `You offered to share a meal with ${metVillagers.join(", ")}, but didn't have enough food. They feel deceived. Trust decreased by 10.`,
                choices: () => [
                  {
                    desc: "I should have been better prepared",
                    effects: () => {},
                  },
                ],
              });
            }
          },
        },
        {
          desc: "Not now",
          effects: () => {},
        },
      ];
    },
  };
}
