import { type Area } from "./data/areas";
import { generateFName, type Villager } from "./data/living";
import { Map } from "./map/generation";
import { rollStats } from "./simulation/living";
import { game, map } from "./stores";
import { rollRange } from "./util/rolls";
import { v4 as uuidv4 } from "uuid";
export function init() {
  let num = 20;
  const npcs: Villager[] = [];
  let bread = 0;
  const mapSize = 15;
  const mapData = new Map(mapSize, []);
  const areas: Area[] = [];

  for (let i in mapData.farms) {
    const farmTile = mapData.farms[i];
    const farm: Area = {
      areaID: "Farm" + i.toString(),
      buildings: [],
      acres: Math.ceil((1 - farmTile.forested / 100) * 50),
      type: "Farm",
      currentProjects: [],
      yieldEff: { Grain: farmTile.yield },
      loc: { q: farmTile.q, s: farmTile.s, r: farmTile.r },
      arableLand: 100,
      yields: {},
    };
    areas.push(farm);
  }
  for (let i in mapData.lumberYards) {
    const forestTile = mapData.lumberYards[i];
    const forest: Area = {
      areaID: "Forest" + i.toString(),
      type: "Forest",
      acres: rollRange(800, 2000),
      buildings: [],
      currentProjects: [],
      yieldEff: {
        Lumber: forestTile.forested / 100,
        Meat: forestTile.yield,
      },
      loc: { q: forestTile.q, s: forestTile.s, r: forestTile.r },
      yields: {},
      arableLand: 0,
    };
    areas.push(forest);
  }

  // Create village
  let villageId = "";
  for (let i in mapData.villages) {
    const villageTile = mapData.villages[i];
    const village: Area = {
      areaID: "Village" + i,
      type: "Village",
      acres: rollRange(5, 10),
      buildings: [],
      yieldEff: {},
      currentProjects: [],
      loc: { q: villageTile.q, s: villageTile.s, r: villageTile.r },
      yields: {},
      arableLand: 0,
    };
    areas.push(village);
    villageId = village.areaID;
  }

  // Create Manor
  const manorTile = mapData.villages[0]; // Place near first village
  const manor: Area = {
    areaID: "Manor",
    type: "Manor",
    acres: rollRange(10, 20),
    buildings: [],
    yieldEff: {},
    currentProjects: [],
    loc: { q: manorTile.q + 1, s: manorTile.s, r: manorTile.r - 1 },
    arableLand: 0,
    yields: {},
  };
  areas.push(manor);

  // Initialize NPCs after areas are created so we can assign home areas
  for (let i = 0; i <= num; i++) {
    const age = Math.ceil(Math.random() * 40) + 20;
    bread += age > 16 ? 2 * 365 : 1.5 * 365;
    const npc: Villager = {
      id: uuidv4(),
      fName: generateFName(),
      age,
      job: {
        title: "None",
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
    };
    npcs.push(npc);
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
    pending: true,
    activeEvents: [],
    village: {
      trust: 700,
      authority: 700,
    },
  });

  map.set(
    Object.values(mapData.tiles).sort((a, b) => {
      return a.r - b.r;
    }),
  );
}
