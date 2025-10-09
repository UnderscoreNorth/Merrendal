import { type Area } from "./data/areas";
import { buildingTypes } from "./data/buildings";
import { type NPC, rollNewSTR, rollNewDEX } from "./data/npcs";
import { firstNames } from "./data/person";
import { Map } from "./map/generation";
import { spawnBuilding } from "./simulation/buildings";
import { getNeedKey, type Need } from "./simulation/needs";
import { game, map } from "./stores";
import { rollRange } from "./util/rolls";

export function init() {
  let num = Math.ceil(Math.random() * 30) + 20;
  const npcs: NPC[] = [];
  let bread = 0;
  for (let i = 0; i <= num; i++) {
    const age = Math.ceil(Math.random() * 60);
    bread += age > 16 ? 2 * 365 : 1.5 * 365;
    const npc: NPC = {
      id: i.toString(),
      fName: firstNames[i],
      nameKnown: false,
      relations: {},
      age,
      job: {
        title: "None",
        priority: 0,
        stuck: false,
      },
      birthday: rollRange(1, 365),
      stats: {
        str: 0,
        dex: 0,
      },
      statuses: {},
      hunger: 0,
    };
    npc.stats.str = rollNewSTR(npc);
    npc.stats.dex = rollNewDEX(npc);
    npcs.push(npc);
  }
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
      currentProjects: {},
      yieldEff: { Wheat: farmTile.yield },
      loc: { q: farmTile.q, s: farmTile.s, r: farmTile.r },
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
      currentProjects: {},
      yieldEff: {
        Lumber: forestTile.forested / 100,
        Meat: forestTile.yield,
      },
      loc: { q: forestTile.q, s: forestTile.s, r: forestTile.r },
    };
    spawnBuilding(forest, "Lumberyard", buildingTypes.Lumberyard);
    areas.push(forest);
  }

  // Create village
  for (let i in mapData.villages) {
    const villageTile = mapData.villages[i];
    const village: Area = {
      areaID: "Village" + i,
      type: "Village",
      acres: rollRange(5, 10),
      buildings: [],
      yieldEff: {},
      currentProjects: {},
      loc: { q: villageTile.q, s: villageTile.s, r: villageTile.r },
    };
    areas.push(village);
  }
  const needs: Record<string, Need> = {};
  const hunterHutNeed: Need = {
    type: "building",
    building: "Hunter's Hut",
    primary: true,
    repeating: false,
    priority: 2,
  };
  needs[getNeedKey(hunterHutNeed)] = hunterHutNeed;
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
    dailyWorkerActivity: new Set(),
    log: [],
    season: "Spring",
    mapSize,
    needs,
    map: mapData,
    pause: true,
    pending: true,
    choiceEvents: [],
    pastLords: [],
    activeEvents: [],
  });

  map.set(
    Object.values(mapData.tiles).sort((a, b) => {
      return a.r - b.r;
    }),
  );
}
