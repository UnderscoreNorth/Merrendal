import type { ItemRecord } from "./items";
import type { Time } from "./time";

export type Building = {
  id: string;
  type: "building";
  buildingType: BuildingType;
  maxPops: number;
  liveIn?: boolean;
  workers: Set<number>;
  occupationTitle?: string;
  stuck?: boolean;
  status: "built" | "ruined" | "demolishing";
  maintenanceCost: ItemRecord;
  upgrades: Record<
    string,
    {
      status: "built" | "ruined" | "demolishing";
      maintenanceCost: ItemRecord;
    }
  >;
  built: Time;
};
export type BuildingTemplate = {
  occupationTitle?: string;
  stuck?: boolean;
  requirements: ItemRecord;
  liveIn?: boolean;
  maxPops: number;
  upgrades: Record<string, Upgrade>;
  maintenance?: {
    yearlyLoss: number;
    cost: ItemRecord;
  };
};
export type Upgrade = {
  groupKey?: string;
  requirements: ItemRecord;
  maintenance?: {
    yearlyLoss: number;
    cost: ItemRecord;
  };
};
export type BuildingType = keyof typeof buildingTypes;
export type UpgradeType = {
  [K in keyof typeof buildingTypes]: keyof (typeof buildingTypes)[K]["upgrades"];
}[keyof typeof buildingTypes];
export const buildingTypes = {
  Forge: {
    requirements: { Lumber: 3500, Stone: 60000 },
    maxPops: 3,
    occupationTitle: "Blacksmith",
    upgrades: {
      Bellows: {
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
    requirements: { Lumber: 5000, Stone: 100000 },
    maxPops: 10,
    occupationTitle: "Bloomery Worker",
    upgrades: {},
  },
  Bakehouse: {
    requirements: { Lumber: 3000, Stone: 8000 },
    maxPops: 3,
    occupationTitle: "Baker",
    upgrades: {
      "Stone Foundation": {
        requirements: {
          Stone: 25,
        },
      },
    },
  },
  "Wood Wall": {
    requirements: { Lumber: 700000 },
    maxPops: 0,
    upgrades: {
      Palisades: {
        requirements: { Lumber: 300000 },
      },
    },
  },
  "Iron Mine": {
    requirements: { Lumber: 1000 },
    maxPops: 10,
    occupationTitle: "Miner",
    upgrades: {
      Shoring: {
        requirements: {
          Lumber: 100000,
          Stone: 10000,
        },
        maintenance: {
          yearlyLoss: 1,
          cost: { Lumber: 50000 },
        },
      },
      Ventilation: {
        requirements: {
          Lumber: 10000,
          Stone: 4000,
        },
      },
      Dewatering: {
        requirements: {
          Lumber: 60000,
          Stone: 40000,
        },
      },
      Carts: {
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
    requirements: { Lumber: 1000 },
    maxPops: 5,
    occupationTitle: "Quarryman",
    upgrades: {
      Carts: {
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
    occupationTitle: "Lumberjack",
    upgrades: {
      Carts: {
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
    requirements: { Lumber: 1000 },
    maxPops: 10,
    occupationTitle: "Hunter",
    upgrades: {},
  },
  Workshop: {
    requirements: { Lumber: 3000 },
    maxPops: 4,
    occupationTitle: "Artison",
    upgrades: {},
  },
  Tailor: {
    requirements: { Lumber: 3000 },
    maxPops: 2,
    occupationTitle: "Artison",
    upgrades: {},
  },
  Garrison: {
    requirements: { Lumber: 5000 },
    maxPops: 4,
    occupationTitle: "Militia",
    upgrades: {},
  },
  "Wooden Bridge": {
    requirements: { Lumber: 35000 },
    maxPops: 0,
    upgrades: {},
  },
  "Stone Bridge": {
    requirements: { Lumber: 20000, Stone: 100000 },
    maxPops: 0,
    upgrades: {},
    maintenance: { yearlyLoss: 0.1, cost: { Stone: 1000 } },
  },
  Burgage: {
    requirements: { Lumber: 5000 },
    maxPops: 1,
    upgrades: {
      "Stone Walls": {
        requirements: {
          Stone: 20000,
        },
      },
      "Bread Oven": {
        groupKey: "Specialization",
        requirements: {
          Stone: 4000,
        },
      },
      Forge: {
        groupKey: "Specialization",
        requirements: {
          Stone: 8000,
          "Iron Ingot": 5,
        },
      },
      Brewery: {
        groupKey: "Specizaliation",
        requirements: {
          Lumber: 6000,
        },
      },
    },
  },
  // Manor buildings
  Archive: {
    requirements: { Lumber: 60000, Stone: 20000 },
    maxPops: 1,
    occupationTitle: "Archivist",
    stuck: true,
    upgrades: {},
  },
} as const satisfies Record<string, BuildingTemplate>;
