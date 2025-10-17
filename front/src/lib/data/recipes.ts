import type { GameState } from "$lib/stores";
import { rollRange } from "$lib/util/rolls";
import type { Building } from "./buildings";
import type { ItemRecord, ItemName } from "./items";
import type { Stat, Villager } from "./living";

export type Recipe = {
  type: "recipe";
  input: ItemRecord;
  output: ItemName;
  amount: number;
  periodsLeft: number;
  numWorkers: number;
};

export const recipes = {
  Lumber: {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      let { quality, amount } = getQualityAndAmount(
        1000,
        workers[0],
        "Lumberjack",
        ["STR", "CON"],
        "amount",
      );
      return {
        input: {},
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  "Iron Ore": {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      let { quality, amount } = getQualityAndAmount(
        450,
        workers[0],
        "Miner",
        ["STR", "CON"],
        "amount",
      );
      return {
        input: {},
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  "Silver Ore": {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      let { quality, amount } = getQualityAndAmount(
        450,
        workers[0],
        "Miner",
        ["STR", "CON"],
        "amount",
      );
      return {
        input: {},
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  "Gold Ore": {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      let { quality, amount } = getQualityAndAmount(
        450,
        workers[0],
        "Miner",
        ["STR", "CON"],
        "amount",
      );
      return {
        input: {},
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  Meat: {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      let { quality, amount } = getQualityAndAmount(
        rollRange(0, 3),
        workers[0],
        "Hunter",
        ["DEX", "WIS"],
        "amount",
      );
      return {
        input: {},
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  Berries: {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      let baseAmount = 0;
      if (gs.season == "Spring") baseAmount = 1;
      if (gs.season == "Summer") baseAmount = 4;
      if (gs.season == "Autumn") baseAmount = 3;
      let { quality, amount } = getQualityAndAmount(
        baseAmount,
        workers[0],
        "Forager",
        ["WIS"],
        "amount",
      );
      return {
        input: {},
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  Herbs: {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      let baseAmount = 0;
      if (gs.season == "Spring") baseAmount = 1;
      if (gs.season == "Summer") baseAmount = 4;
      if (gs.season == "Autumn") baseAmount = 3;
      let { quality, amount } = getQualityAndAmount(
        baseAmount,
        workers[0],
        "Forager",
        ["WIS"],
        "amount",
      );
      return {
        input: {},
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  Stone: {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      let { quality, amount } = getQualityAndAmount(
        3000,
        workers[0],
        "Miner",
        ["STR", "CON"],
        "amount",
      );
      return {
        input: {},
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
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
  Porridge: {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      return {
        input: { Grain: 0.1 },
        amount: 20,
        numPeriods: 1,
        quality: 0,
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
  Grain: {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  "Planted Grain": {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  Flax: {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  Vegetables: {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  Fruit: {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  Legumes: {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  Wine: {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  Charcoal: {
    numWorkers: 6,
    constructor: ({ workers, building, gs }) => {
      let { quality, amount } = getQualityAndAmount(
        2500,
        workers[0],
        "Coiler",
        ["WIS"],
        "amount",
      );
      return {
        input: { Lumber: 15000 },
        amount,
        numPeriods: 20,
        quality,
      };
    },
  },
  Cheese: {
    numWorkers: 1,
    constructor: ({}) => {
      return {
        input: { Milk: 50 },
        amount: 5,
        numPeriods: 1,
        quality: 0,
      };
    },
  },
  Eggs: {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  Clay: {
    numWorkers: 1,
    constructor: ({ workers, building, gs }) => {
      let { quality, amount } = getQualityAndAmount(
        6000,
        workers[0],
        "Miner",
        ["STR", "CON"],
        "amount",
      );
      return {
        input: {},
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  "Raw Wool": {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  Swords: {
    numWorkers: 1,
    constructor: ({ workers, building }) => {
      let { quality, numPeriods } = getQualityAndTime(
        12,
        workers[0],
        "Blacksmith",
        ["DEX", "INT"],
        building.buildingType == "Burgage" ? "quality" : "amount",
      );
      return {
        input: { "Iron Ingot": 5, Leather: 2, Charcoal: 240 },
        quality,
        numPeriods,
        amount: 1,
      };
    },
  },
  "Animal Hides": {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  Flour: {
    numWorkers: 1,
    constructor: ({ workers, building }) => {
      let input =
        building.buildingType == "Burgage" ? { Grain: 1 } : { Grain: 16 };
      let amount = building.buildingType == "Burgage" ? 48 : 768;
      return {
        input,
        amount,
        quality: 0,
        numPeriods: 1,
      };
    },
  },
  "Iron Ingot": {
    numWorkers: 5,
    constructor: ({ workers, building }) => {
      let { quality, amount } = getQualityAndAmount(
        30,
        workers[0],
        "Smelter",
        ["INT", "WIS"],
        "amount",
      );
      return {
        input: { Charcoal: 400, "Iron Ore": 150 },
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  "Silver Ingot": {
    numWorkers: 3,
    constructor: ({ workers, building }) => {
      let { quality, amount } = getQualityAndAmount(
        2,
        workers[0],
        "Smelter",
        ["INT", "WIS"],
        "amount",
      );
      return {
        input: { Charcoal: 150, "Silver Ore": 50 },
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  "Gold Ingot": {
    numWorkers: 3,
    constructor: ({ workers, building }) => {
      let { quality, amount } = getQualityAndAmount(
        2,
        workers[0],
        "Smelter",
        ["INT", "WIS"],
        "amount",
      );
      return {
        input: { Charcoal: 150, "Gold Ore": 50 },
        amount,
        numPeriods: 1,
        quality,
      };
    },
  },
  Milk: {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  Gems: {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  Boots: {
    numWorkers: 1,
    constructor: ({ building, workers }) => {
      let { quality, numPeriods } = getQualityAndTime(
        2,
        workers[0],
        "Leatherworker",
        ["DEX"],
        building.buildingType == "Burgage" ? "quality" : "amount",
      );
      return {
        amount: 1,
        quality,
        numPeriods,
        input: { Leather: 10 },
      };
    },
  },
  Leather: {
    numWorkers: 1,
    constructor: () => {
      return {
        amount: 50,
        quality: 0,
        numPeriods: 1,
        input: { "Animal Hides": 50 },
      };
    },
  },
  Carts: {
    numWorkers: 1,
    constructor: ({ workers }) => {
      let { quality, numPeriods } = getQualityAndTime(
        60,
        workers[0],
        "Craftsman",
        ["DEX"],
        "amount",
      );
      return {
        input: { Lumber: 1500, "Iron Ingot": 75 },
        quality,
        numPeriods,
        amount: 1,
      };
    },
  },
  "Wool Fabric": {
    numWorkers: 1,
    constructor: ({ workers }) => {
      let { quality, amount } = getQualityAndAmount(
        2,
        workers[0],
        "Weaver",
        ["DEX"],
        "quality",
      );
      return {
        input: { "Raw Wool": 0.25 },
        amount,
        quality,
        numPeriods: 1,
      };
    },
  },
  "Wool Clothes": {
    numWorkers: 1,
    constructor: ({ workers }) => {
      let { quality, amount } = getQualityAndAmount(
        1,
        workers[0],
        "Tailor",
        ["DEX"],
        "quality",
      );
      return {
        input: { "Wool Fabric": 25 },
        amount,
        quality,
        numPeriods: 1,
      };
    },
  },
  "Linen Clothes": {
    numWorkers: 1,
    constructor: ({ workers }) => {
      let { quality, amount } = getQualityAndAmount(
        1,
        workers[0],
        "Tailor",
        ["DEX"],
        "quality",
      );
      return {
        input: { "Linen Fabric": 25 },
        amount,
        quality,
        numPeriods: 1,
      };
    },
  },
  "Linen Fabric": {
    numWorkers: 1,
    constructor: ({ workers }) => {
      let { quality, amount } = getQualityAndAmount(
        25,
        workers[0],
        "Weaver",
        ["DEX"],
        "quality",
      );
      return {
        quality,
        amount,
        input: { Flax: 1 },
        numPeriods: 10,
      };
    },
  },
  Fur: {
    numWorkers: -1,
    constructor: () => {
      return { input: {}, amount: 0, numPeriods: -1, quality: 0 };
    },
  },
  Coins: {
    numWorkers: 1,
    constructor: () => {
      return {
        input: { "Silver Ingot": 1 },
        amount: 1,
        numPeriods: 1,
        quality: 0,
      };
    },
  },
  Tooling: {
    numWorkers: 1,
    constructor: ({ workers }) => {
      let { quality, amount } = getQualityAndAmount(
        10,
        workers[0],
        "Craftsman",
        ["DEX"],
        "amount",
      );
      return { quality, amount, input: { "Iron Ingot": 3 }, numPeriods: 1 };
    },
  },
  Firewood: {
    numWorkers: 1,
    constructor: ({ workers }) => {
      let { quality, amount } = getQualityAndAmount(
        1000,
        workers[0],
        "Lumberjack",
        ["STR", "CON"],
        "amount",
      );
      return { quality, amount, input: { Lumber: 1500 }, numPeriods: 1 };
    },
  },
  Bows: {
    numWorkers: 1,
    constructor: ({ workers }) => {
      let { quality, numPeriods } = getQualityAndTime(
        10,
        workers[0],
        "Bowmaker",
        ["DEX"],
        "amount",
      );
      return { quality, numPeriods, input: { Lumber: 5 }, amount: 1 };
    },
  },
  Arrows: {
    numWorkers: 1,
    constructor: ({ workers }) => {
      let { quality, amount } = getQualityAndAmount(
        40,
        workers[0],
        "Blacksmith",
        ["STR", "DEX"],
        "amount",
      );
      return {
        quality,
        amount,
        input: { "Iron Ingot": 0.4, Charcoal: 20, Lumber: 20 },
        numPeriods: 1,
      };
    },
  },
  Shields: {
    numWorkers: 1,
    constructor: ({ workers }) => {
      let { quality, numPeriods } = getQualityAndTime(
        3,
        workers[0],
        "Blacksmith",
        ["STR", "DEX"],
        "quality",
      );
      return {
        quality,
        numPeriods,
        amount: 1,
        input: { Lumber: 5, Leather: 4, "Iron Ingot": 2 },
      };
    },
  },
  Chainmail: {
    numWorkers: 1,
    constructor: ({ workers }) => {
      let { quality, numPeriods } = getQualityAndTime(
        80,
        workers[0],
        "Blacksmith",
        ["STR", "DEX"],
        "amount",
      );
      return { quality, numPeriods, amount: 1, input: { "Iron Ingot": 30 } };
    },
  },
  Books: {
    numWorkers: 1,
    constructor: ({ workers }) => {
      let { quality, amount } = getQualityAndAmount(
        1,
        workers[0],
        "Craftsman",
        ["DEX"],
        "quality",
      );
      return {
        quality,
        amount,
        numPeriods: 30,
        input: { Leather: 3, "Animal Hides": 25, Lumber: 4 },
      };
    },
  },
  "Fired Clay": {
    numWorkers: 3,
    constructor: ({ workers }) => {
      let { quality, amount } = getQualityAndAmount(
        350,
        workers[0],
        "Potter",
        ["WIS"],
        "amount",
      );
      return {
        quality,
        amount,
        input: { Lumber: 6000, Clay: 500 },
        numPeriods: 1,
      };
    },
  },
} as const satisfies Record<
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
>;

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
