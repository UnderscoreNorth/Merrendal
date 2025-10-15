import type { GameState } from "$lib/stores";
import type { Building } from "./buildings";
import type { ItemRecord, ItemName } from "./items";
import type { Stat, Villager } from "./living";

export type Recipe = {
  input: ItemRecord;
  output: ItemName;
  amount: number;
  periodsLeft: number;
};

export const recipes = {
  Bread: {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      let { quality, amount } = getQualityAndAmount(
        50,
        workers[0],
        "Baker",
        ["DEX"],
        building.buildingType == "Burgage" ? "quality" : "amount",
      );
      return {
        input: { Grain: 0.5 },
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  Ale: {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      let { quality, amount } = getQualityAndAmount(
        30,
        workers[0],
        "Brewer",
        ["WIS"],
        building.buildingType == "Burgage" ? "quality" : "amount",
      );
      return {
        input: { Grain: 0.5, Firewood: 15 },
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  Spears: {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      const amount = 2;
      let { quality, numPeriods } = getQualityAndTime(
        1,
        workers[0],
        "Blacksmith",
        ["STR", "DEX"],
        building.buildingType == "Burgage" ? "quality" : "amount",
      );
      return {
        input: { "Iron Ingot": 2, Charcoal: 20, Lumber: 20 },
        amount,
        numPeriods,
        quality,
      };
    },
  },
} as const satisfies Partial<
  Record<
    ItemName,
    {
      numWorkers: number;
      constructor: (data: {
        workers: Villager[];
        building: Building;
        gs: GameState;
      }) => {
        input: ItemRecord;
        amount: number;
        numPeriods: number;
        quality: number;
      };
    }
  >
>;
/*export const recipess: Recipe[] = [
  {
    input: { "Iron Ingot": 5, Leather: 2, Charcoal: 240 },
    output: { Swords: 1 },
    numPeriods: 12,
  },
  {
    input: { "Iron Ingot": 0.4, Charcoal: 20, Lumber: 20 },
    output: { Arrows: 40 },
  },
  {
    input: { Charcoal: 400, "Iron Ore": 150 },
    output: { "Iron Ingot": 30 },
    workersRequired: 5,
  },
  {
    input: { Lumber: 5000 },
    output: { Charcoal: 1000 },
    numPeriods: 10,
  },
  {
    input: { Leather: 10 },
    output: { Boots: 1 },
    numPeriods: 2,
  },
  {
    input: { "Animal Hides": 50 },
    output: { Leather: 50 },
  },
  {
    input: { Lumber: 1500, "Iron Ingot": 75 },
    output: { Carts: 1 },
    numPeriods: 60,
  },
  {
    input: { "Raw Wool": 0.25 },
    output: { "Wool Fabric": 2 },
  },
  {
    input: { "Wool Fabric": 25 },
    output: { "Wool Clothes": 1 },
  },
  {
    input: { "Linen Fabric": 25 },
    output: { "Linen Clothes": 1 },
  },
  {
    input: { Flax: 1 },
    output: { "Linen Fabric": 25 },
    numPeriods: 10,
  },
];*/

function getQualityAndAmount(
  amount: number,
  worker: Villager,
  skill: string,
  stats: Stat[],
  bonus: "quality" | "amount",
) {
  let quality = 0;
  amount *= getStatMultiplier(stats, worker);
  if (bonus == "quality") {
    quality = getQuality(worker.skills[skill] ?? 0);
  } else {
    amount *= getSkillMultiplier(skill, worker);
  }
  return { amount, quality };
}
function getQualityAndTime(
  numPeriods: number,
  worker: Villager,
  skill: string,
  stats: Stat[],
  bonus: "quality" | "amount",
) {
  let quality = 0;
  if (bonus == "quality") {
    quality = getQuality(worker.skills[skill] ?? 0);
  } else {
    numPeriods /= getSkillMultiplier(skill, worker);
  }
  return { numPeriods, quality };
}

function getQuality(skill: number) {
  return Math.round(skill * 2.5 + (Math.random() - (1 - skill)));
}
function getStatMultiplier(stats: Stat[], villager: Villager) {
  let total = 0;
  for (const stat of stats) {
    total += villager.stats[stat];
  }
  return 1 + (total - stats.length * 5) / (20 * stats.length);
}
function getSkillMultiplier(skill: string, villager: Villager) {
  return 1 + (villager.skills[skill] ?? 0) / 2;
}
