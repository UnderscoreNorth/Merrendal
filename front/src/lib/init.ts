import { type Area } from "./data/areas";
import { generateFName, type Villager, type Animal } from "./data/living";
import { Map } from "./map/generation";
import { startConstruction } from "./simulation/buildings";
import { rollStats } from "./simulation/living";
import { game } from "./stores";
import { rollRange } from "./util/rolls";
import { v4 as uuidv4 } from "uuid";
export function init() {
  let num = 10;
  const npcs: Villager[] = [];
  const animals: Animal[] = [];
  let bread = 0;
  const mapSize = 50;
  const mapData = new Map(mapSize, []);
  const startArea = mapData.start;

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
      hunger: "Comfortable",
      skills: {},
      status: [],
      equipement: ["Wool Clothes", "Linen Clothes", "Boots"],
      home: "",
      children: [],
      parents: [], // Initial NPCs have no parents
      apprentices: [],
      type: "Villager",
      health: "Healthy",
      warmth: "Comfortable",
      comfort: 50,
    };
    npcs.push(npc);
    if (i % 2 == 1) {
      npc.spouse = npcs[i - 1].id;
      npcs[i - 1].spouse = npc.id;
    }
  }

  // Initialize starting animals: 2 cattle
  for (let i = 0; i < 2; i++) {
    const cattle: Animal = {
      id: uuidv4(),
      type: "Animal",
      animalType: "Cattle",
      age: 4, // Start at maturity
      birthday: rollRange(1, 365),
      status: [],
      pasture: "", // Not assigned to any pasture initially
    };
    animals.push(cattle);
  }

  game.update((gs) => {
    gs = {
      seed: uuidv4(),
      npcs,
      deadNpcs: [],
      animals,
      areas: mapData.tiles,
      inventory: {
        Bread: bread,
      },
      priorInventory: {},
      currentDay: 1,
      currentYear: 100,
      currentPeriod: "Morning",
      dailyWorkerActivity: new Set(),
      areaActionTaken: false,
      log: [],
      season: "Spring",
      mapSize,
      needs: {},
      map: mapData,
      pause: false,
      pending: false,
      activeEvents: [],
      village: {
        trust: 700,
        authority: 0,
        stability: 100,
      },
      render: true,
    };
    startConstruction(gs, "Village Square", startArea, true);
    return gs;
  });
}
