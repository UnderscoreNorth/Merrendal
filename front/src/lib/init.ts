import { type Area } from "./data/areas";
import { generateFName, type Villager } from "./data/living";
import { Map } from "./map/generation";
import { rollStats } from "./simulation/living";
import { game, map } from "./stores";
import { rollRange } from "./util/rolls";
import { v4 as uuidv4 } from "uuid";
export function init() {
  let num = 10;
  const npcs: Villager[] = [];
  let bread = 0;
  const mapSize = 40;
  const mapData = new Map(mapSize, []);
  const areas: Area[] = [];

  // Create village
  let villageId = "";
  for (let i in mapData.villages) {
    const villageTile = mapData.villages[i];
    areas.push(villageTile);
    villageId = villageTile.areaID;
  }

  // Initialize NPCs after areas are created so we can assign home areas
  for (let i = 0; i < num; i++) {
    const age = Math.ceil(Math.random() * 40) + 20;
    bread += age > 16 ? 2 * 365 : 1.5 * 365;
    const npc: Villager = {
      id: uuidv4(),
      fName: generateFName(),
      age,
      job: {
        title: "",
        stuck: false,
      },
      birthday: rollRange(1, 365),
      stats: rollStats(),
      hunger: 0,
      skills: {},
      status: [],
      equipement: [],
      home: "",
      children: [],
      apprentices: [],
      type: "Villager",
      health: 100,
    };
    npcs.push(npc);
    if (i % 2 == 1) {
      npc.spouse = npcs[i - 1].id;
      npcs[i - 1].spouse = npc.id;
    }
  }
  game.set({
    npcs,
    deadNpcs: [],
    areas,
    inventory: {
      Bread: bread,
    },
    priorInventory: {},
    currentDay: 1,
    currentYear: 0,
    currentPeriod: "Morning",
    dailyWorkerActivity: new Set(),
    areaActionTaken: false,
    log: [],
    season: "Spring",
    mapSize,
    needs: {},
    map: mapData,
    pause: true,
    pending: false,
    activeEvents: [],
    village: {
      trust: 700,
      authority: 700,
    },
  });

  map.set(
    Object.values(mapData.tiles).sort((a, b) => {
      return a.loc.r - b.loc.r;
    }),
  );
}
