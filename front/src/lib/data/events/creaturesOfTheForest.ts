import { killNPC } from "$lib/simulation/mortality";
import { type GameState } from "$lib/stores";
import { pick } from "$lib/util/rolls";
import { type ChoiceEvent } from "../choices";
import { Event, type EventContainer } from "../events";

class Event_CreaturesOfTheForest extends Event {
  phase: number;
  constructor(id: string) {
    super(id);
    this.target = "Area";
    this.phase = 1;
    this.desc = "Something is lurking in the shadows...";
    this.action = ({ gs }) => {
      if (!gs) return;
      if (this.phase == 1) {
        this.phase++;
        gs.choiceEvents.push(phase1(this));
      }
      if (this.phase == 3) {
        if (gs.npcs.length == 0) return;
        killNPC(pick(gs.npcs), "Creatures of the Forest", gs);
        gs.choiceEvents.push(killVillager);
      }
    };
    this.resolved = ({ gs }) => {
      return this.phase == 0;
    };
  }
}
export const event_CreaturesOfTheForest = {
  id: "Creatures of the Forest",
  condition: { type: "Time", mtth: 3 },
  multiple: false,
  event: Event_CreaturesOfTheForest,
} as const satisfies EventContainer;
function phase1(e: Event_CreaturesOfTheForest): ChoiceEvent {
  return {
    id: "cotf_phase1",
    title: "Creatures spotted!",
    desc: "Villagers have noticed shadows lurking in the shadow",
    choices: (gs) => {
      return [
        {
          desc: "Send some scouts",
          requirements: [{ type: "pop", min: 16, num: 4, consume: false }],
        },
        {
          desc: "Ignore the issue",
          effects: (gs) => {
            //e.phase = 3;
          },
        },
      ];
    },
  };
}

const killVillager: ChoiceEvent = {
  id: "cotf_killVillager",
  title: "Villager lost",
  desc: "A villager disappeared from the forest, they only found shreds of his tunic...",
  choices(gs) {
    return [{ desc: "Oh well" }];
  },
};
