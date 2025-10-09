import { log } from "$lib/simulation/log";
import { map, type GameState } from "$lib/stores";
import { pick } from "$lib/util/rolls";
import { ruinBuilding } from "../buildings";
import { Event, type EventContainer } from "../events";

class Event_BrokenPickaxe extends Event {
  constructor(id: string) {
    super(id);
    this.target = "NPC";

    this.action = ({ gs }) => {
      if (!gs) return;
      const miners = gs.npcs.filter((i) => i.job.title == "Miner");
      if (miners.length == 0) return;
      const npc = pick(miners);
      if (npc.statuses["Broken Pickaxe"] == undefined) {
        npc.statuses["Broken Pickaxe"] = {
          name: "Broken Pickaxe",
          duration: -1,
          modifiers: [{ stat: "str", type: "statModifier", modifier: -2 }],
          removalConditions: { items: { "Iron Ingots": 1 }, time: 1 },
          status: "Active",
        };
        log(gs, `<i>${npc.fName}'s</i> pickaxe broke`, ["Event"]);
      }
    };
    this.resolved = () => true;
  }
}
class Event_BurningBuilding extends Event {
  constructor(id: string) {
    super(id);
    this.target = "Building";
    this.action = ({ gs }) => {
      if (!gs) return;
      const buildings = gs.areas
        .map((i) => i.buildings.filter((j) => j.status !== "Ruined"))
        .flat();
      console.log(buildings);
      if (buildings.length == 0) return;
      const building = pick(buildings);
      ruinBuilding(gs, building);
      log(gs, `<i>${building.type}</i> burned down`, ["Event"]);
    };
    this.resolved = () => true;
  }
}
class Event_ShrinkingForest extends Event {
  constructor(id: string) {
    super(id);
    this.target = "Area";
    this.action = ({ gs }) => {
      if (!gs) return;
      const lumberjacks = gs.npcs.filter((i) => i.job.title == "Lumberjack");
      if (lumberjacks.length == 0) return;
      for (const area of gs.areas) {
        if (area.type == "Forest" && area.yieldEff.Lumber) {
          area.yieldEff.Lumber -= lumberjacks.length / 100;
          if (area.yieldEff.Lumber < 0) area.yieldEff.Lumber = 0;
          map.update((m) => {
            for (const tile of m) {
              if (tile.q == area.loc.q && tile.s == area.loc.s) {
                tile.forested = (area.yieldEff.Lumber ?? 0) * 100;
                log(gs, "Forest is shrinking to " + tile.forested.toFixed(0), [
                  "Event",
                ]);
                break;
              }
            }
            return m;
          });
        }
      }
    };
    this.resolved = () => true;
  }
}
export const genericEvents = [
  {
    id: "Broken Pickaxe",
    condition: { type: "Time", mtth: 3 },
    event: Event_BrokenPickaxe,
    multiple: false,
  },
  {
    id: "Burning Building",
    condition: { type: "Time", mtth: 100 },
    event: Event_BurningBuilding,
    multiple: false,
  },
  {
    id: "Shrinking Forest",
    condition: {
      type: "Time",
      mtth: 10,
    },
    event: Event_ShrinkingForest,
    multiple: false,
  },
] as const satisfies EventContainer[];
