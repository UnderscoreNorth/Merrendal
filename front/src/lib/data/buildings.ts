import { ItemRecord } from "./items";

export type Building = {
  id: string;
  type: "building";
  buildingType: BuildingType;
  maxPops: number;
  workers: Set<number>;
  occupationTitle?: string;
  stuck?: boolean;
  status: "built" | "ruined";
  maintenanceCost: ItemRecord;
  upgrades: Record<
    string,
    {
      status: "built" | "ruined";
      maintenanceCost: ItemRecord;
    }
  >;
};
export type BuildingTemplate = {
  occupationTitle?: string;
  stuck?: boolean;
  requirements: ItemRecord;
  daysToComplete: number;
  liveIn?: boolean;
  maxPops?: number;
  upgrades: Record<
    string,
    {
      groupKey?: string;
      daysToComplete: number;
      requirements: ItemRecord;
      maintenance?: {
        yearlyLoss: number;
        cost: ItemRecord;
      };
    }
  >;
  maintenance?: {
    yearlyLoss: number;
    cost: ItemRecord;
  };
};

export type BuildingType = keyof typeof buildingTypes;

export const buildingTypes = {
  Forge: {
    requirements: { Lumber: 10, Stone: 30 },
    maxPops: 3,
    daysToComplete: 7,
    occupationTitle: "Blacksmith",
    upgrades: {
      Bellows: {
        daysToComplete: 1,
        requirements: {
          Leather: 1,
        },
        maintenance: {
          yearlyLoss: 1,
          cost: { Leather: 1 },
        },
      },
    },
  },
  "Iron Bloomery": {
    requirements: { Lumber: 10, Stone: 50 },
    maxPops: 10,
    daysToComplete: 7,
    occupationTitle: "Bloomery Worker",
    upgrades: {},
  },
  Bakehouse: {
    requirements: { Lumber: 7, Stone: 4 },
    maxPops: 3,
    daysToComplete: 7,
    occupationTitle: "Baker",
    upgrades: {
      "Stone Foundation": {
        daysToComplete: 7,
        requirements: {
          Stone: 25,
        },
      },
    },
  },
  "Wood Wall": {
    requirements: { Lumber: 20 },
    maxPops: 0,
    daysToComplete: 1,
    upgrades: {},
  },
  "Iron Mine": {
    requirements: { Lumber: 1 },
    maxPops: 10,
    daysToComplete: 1,
    occupationTitle: "Miner",
    upgrades: {
      Shoring: {
        daysToComplete: 14,
        requirements: {
          Lumber: 50,
          Stone: 5,
        },
        maintenance: {
          yearlyLoss: 1,
          cost: { Lumber: 25 },
        },
      },
      Ventilation: {
        daysToComplete: 3,
        requirements: {
          Lumber: 5,
          Stone: 2,
        },
      },
      Dewatering: {
        daysToComplete: 14,
        requirements: {
          Lumber: 30,
          Stone: 20,
        },
      },
      Carts: {
        daysToComplete: 0,
        requirements: {
          Carts: 1,
        },
        maintenance: {
          yearlyLoss: 1,
          cost: { Carts: 1 },
        },
      },
    },
  },
  "Stone Quarry": {
    requirements: { Lumber: 1 },
    maxPops: 5,
    daysToComplete: 7,
    occupationTitle: "Quarryman",
    upgrades: {
      Carts: {
        daysToComplete: 0,
        requirements: {
          Carts: 1,
        },
        maintenance: {
          yearlyLoss: 1,
          cost: { Carts: 1 },
        },
      },
    },
  },
  Lumberyard: {
    requirements: {},
    maxPops: 5,
    daysToComplete: 1,
    occupationTitle: "Lumberjack",
    upgrades: {
      Carts: {
        daysToComplete: 0,
        requirements: {
          Carts: 1,
        },
        maintenance: {
          yearlyLoss: 1,
          cost: { Carts: 1 },
        },
      },
    },
  },
  "Hunter's Hut": {
    requirements: { Lumber: 3 },
    maxPops: 10,
    daysToComplete: 1,
    occupationTitle: "Hunter",
    upgrades: {},
  },
  Workshop: {
    requirements: { Lumber: 20 },
    maxPops: 4,
    daysToComplete: 7,
    occupationTitle: "Artison",
    upgrades: {},
  },
  Tailor: {
    requirements: { Lumber: 20 },
    maxPops: 2,
    daysToComplete: 7,
    occupationTitle: "Artison",
    upgrades: {},
  },
  Garrison: {
    requirements: { Lumber: 20 },
    maxPops: 4,
    daysToComplete: 7,
    occupationTitle: "Militia",
    upgrades: {},
  },
  Burgage: {
    requirements: { Lumber: 15 },
    maxPops: 1,
    daysToComplete: 7,
    upgrades: {
      "Stone Walls": {
        daysToComplete: 14,
        requirements: {
          Stone: 70,
        },
      },
      "Bread Oven": {
        groupKey: "Specialization",
        daysToComplete: 2,
        requirements: {
          Stone: 2,
        },
      },
      Forge: {
        groupKey: "Specialization",
        daysToComplete: 2,
        requirements: {
          Stone: 4,
          "Iron Ingot": 5,
        },
      },
      Brewery: {
        groupKey: "Specizaliation",
        daysToComplete: 2,
        requirements: {
          Lumber: 3,
        },
      },
    },
  },
  // Manor buildings
  Archive: {
    requirements: { Lumber: 30, Stone: 10 },
    maxPops: 1,
    daysToComplete: 14,
    occupationTitle: "Archivist",
    stuck: true,
    upgrades: {},
  },
} as const satisfies Record<string, BuildingTemplate>;
