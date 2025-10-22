import type { ItemName, ItemRecord } from "./items";
import type { Recipe } from "./recipes";
import type { Time } from "./time";

export type Building = {
  id: string;
  type: "building";
  buildingType: BuildingType;
  maxPops: number;
  liveIn?: boolean;
  workers: Set<string>;
  occupationTitle?: string;
  stuck?: boolean;
  status: "built" | "ruined" | "demolishing";
  maintenanceCost: ItemRecord;
  nextMaintenance?: { year: number; day: number }; // When next maintenance is due
  upgrades: Record<
    string,
    {
      status: "built" | "ruined" | "demolishing";
      maintenanceCost: ItemRecord;
      nextMaintenance?: { year: number; day: number }; // When next maintenance is due
    }
  >;
  currentProjects: Recipe[];
  built: Time;
  allowedRecipes: ItemName[];
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
  allowedRecipes: ItemName[];
  category: "Extraction" | "Industry" | "Infrastructure" | "Food" | "Manor";
  icon: {
    x: number;
    y: number;
  };
  size: number;
  maxAllowed?: number;
};
export type Upgrade = {
  groupKey?: string;
  repeatable?: boolean; // If true, can be done multiple times
  requirements: ItemRecord;
  maintenance?: {
    yearlyLoss: number;
    cost: ItemRecord;
  };
  allowedRecipes?: ItemName[];
  size?: number;
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
    allowedRecipes: ["Spears", "Swords", "Arrows", "Chainmail", "Shields"],
    category: "Industry",
    icon: {
      x: 0,
      y: 0,
    },
    size: 0.1,
  },
  "Iron Bloomery": {
    requirements: { Lumber: 5000, Stone: 100000 },
    maxPops: 10,
    occupationTitle: "Smelter",
    upgrades: {},
    allowedRecipes: ["Iron Ingot"],
    category: "Industry",
    icon: {
      x: 1,
      y: 0,
    },
    size: 0.1,
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
    allowedRecipes: ["Bread"],
    category: "Food",
    icon: {
      x: 0,
      y: 1,
    },
    size: 0.1,
  },
  "Wood Wall": {
    requirements: { Lumber: 700000 },
    maxPops: 0,
    upgrades: {
      Palisades: {
        requirements: { Lumber: 300000 },
      },
    },
    allowedRecipes: [],
    category: "Infrastructure",

    icon: {
      x: 1,
      y: 1,
    },
    size: 5,
  },
  "Iron Mine": {
    requirements: { Lumber: 1000 },
    maxPops: 10,
    occupationTitle: "Miner",
    allowedRecipes: ["Iron Ore"],
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
    category: "Extraction",
    icon: {
      x: 2,
      y: 2,
    },
    size: 4,
  },
  "Gold Mine": {
    requirements: { Lumber: 1000 },
    maxPops: 10,
    occupationTitle: "Miner",
    allowedRecipes: ["Gold Ore"],
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
    category: "Extraction",
    icon: {
      x: 7,
      y: 1,
    },
    size: 4,
  },
  "Silver Mine": {
    requirements: { Lumber: 1000 },
    maxPops: 10,
    occupationTitle: "Miner",
    allowedRecipes: ["Silver Ore"],
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
    category: "Extraction",
    icon: {
      x: 6,
      y: 1,
    },
    size: 4,
  },
  "Stone Quarry": {
    requirements: { Lumber: 1000 },
    maxPops: 5,
    occupationTitle: "Quarryman",
    allowedRecipes: ["Stone"],
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
    category: "Extraction",

    icon: {
      x: 4,
      y: 3,
    },
    size: 4,
  },
  "Clay Pit": {
    requirements: { Lumber: 1000 },
    maxPops: 5,
    occupationTitle: "Miner",
    allowedRecipes: ["Clay"],
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
    category: "Extraction",

    icon: {
      x: 5,
      y: 3,
    },
    size: 4,
  },
  "Lumber Yard": {
    requirements: {},
    maxPops: 5,
    occupationTitle: "Lumberjack",
    allowedRecipes: ["Lumber"],
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
    category: "Extraction",
    icon: {
      x: 0,
      y: 3,
    },
    size: 1,
  },
  "Foraging Hut": {
    requirements: { Lumber: 500 },
    maxPops: 10,
    occupationTitle: "Forager",
    upgrades: {},
    allowedRecipes: ["Berries", "Herbs"],
    category: "Extraction",
    icon: {
      x: 1,
      y: 3,
    },
    size: 0.1,
  },
  "Hunter's Hut": {
    requirements: { Lumber: 500 },
    maxPops: 10,
    occupationTitle: "Hunter",
    upgrades: {},
    allowedRecipes: ["Meat"],
    category: "Extraction",
    icon: {
      x: 2,
      y: 3,
    },
    size: 0.1,
  },
  Workshop: {
    requirements: { Lumber: 3000 },
    maxPops: 4,
    occupationTitle: "Craftsman",
    upgrades: {},
    allowedRecipes: ["Carts", "Tooling", "Arrows", "Bows"],
    category: "Industry",

    icon: {
      x: 2,
      y: 1,
    },
    size: 0.1,
  },
  Tailor: {
    requirements: { Lumber: 3000 },
    maxPops: 2,
    occupationTitle: "Tailor",
    upgrades: {},
    allowedRecipes: ["Wool Clothes", "Linen Clothes"],
    category: "Industry",
    icon: {
      x: 3,
      y: 0,
    },
    size: 0.1,
  },
  Weaver: {
    requirements: { Lumber: 3000 },
    maxPops: 2,
    occupationTitle: "Weaver",
    upgrades: {},
    allowedRecipes: ["Wool Fabric", "Linen Fabric"],
    category: "Industry",
    icon: {
      x: 3,
      y: 0,
    },
    size: 0.1,
  },
  Garrison: {
    requirements: { Lumber: 5000 },
    maxPops: 4,
    occupationTitle: "Militia",
    upgrades: {},
    allowedRecipes: [],
    category: "Infrastructure",
    icon: {
      x: 3,
      y: 1,
    },
    size: 0.25,
  },
  "Wooden Bridge": {
    requirements: { Lumber: 35000 },
    maxPops: 0,
    upgrades: {},
    allowedRecipes: [],
    category: "Infrastructure",
    icon: {
      x: 4,
      y: 2,
    },
    size: 0,
  },
  "Stone Bridge": {
    requirements: { Lumber: 20000, Stone: 3000000 },
    maxPops: 0,
    upgrades: {},
    maintenance: { yearlyLoss: 0.1, cost: { Stone: 1000 } },
    allowedRecipes: [],
    category: "Infrastructure",
    icon: {
      x: 0,
      y: 2,
    },
    size: 0,
  },
  "Village Square": {
    requirements: {},
    maxPops: 0,
    upgrades: {},
    category: "Infrastructure",
    icon: {
      x: 7,
      y: 2,
    },
    size: 1,
    allowedRecipes: [],
  },
  Burgage: {
    requirements: { Lumber: 5000 },
    maxPops: 2,
    allowedRecipes: ["Vegetables", "Porridge", "Cheese"],
    liveIn: true,
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
        allowedRecipes: ["Bread"],
      },
      Forge: {
        groupKey: "Specialization",
        requirements: {
          Stone: 8000,
          "Iron Ingot": 5,
        },
        allowedRecipes: ["Arrows", "Spears", "Swords"],
      },
      Brewery: {
        groupKey: "Specizaliation",
        requirements: {
          Lumber: 6000,
        },
        allowedRecipes: ["Ale"],
      },
    },
    category: "Infrastructure",

    icon: {
      x: 1,
      y: 2,
    },
    size: 0.25,
  },
  // Manor buildings
  Archive: {
    requirements: { Lumber: 60000, Stone: 20000 },
    maxPops: 1,
    occupationTitle: "Archivist",
    stuck: true,
    upgrades: {},
    allowedRecipes: [],
    category: "Manor",

    icon: {
      x: 3,
      y: 3,
    },
    size: 0.1,
  },
  "Cupellation Furnace": {
    requirements: {
      Stone: 10200,
      "Fired Clay": 100,
      Leather: 15,
      Lumber: 5000,
    },
    maxPops: 3,
    occupationTitle: "Smelter",
    upgrades: {},
    category: "Industry",
    allowedRecipes: ["Gold Ingot", "Silver Ingot"],
    icon: {
      x: 0,
      y: 6,
    },
    size: 0.1,
  },
  Watermill: {
    requirements: {
      Stone: 50000,
      Lumber: 25000,
      "Iron Ingot": 750,
    },
    maxPops: 1,
    liveIn: true,
    occupationTitle: "Miller",
    upgrades: {},
    category: "Food",
    allowedRecipes: ["Flour"],
    icon: {
      x: 4,
      y: 1,
    },
    size: 0.1,
  },
  Tannery: {
    maxPops: 5,
    requirements: {
      Lumber: 5000,
    },
    upgrades: {},
    allowedRecipes: ["Leather"],
    icon: {
      x: 0,
      y: 4,
    },
    occupationTitle: "Tanner",
    category: "Industry",
    size: 0.25,
  },
  Kiln: {
    maxPops: 3,
    requirements: {
      Lumber: 2000,
      Stone: 2000,
    },
    upgrades: {},
    allowedRecipes: ["Fired Clay", "Charcoal"],
    category: "Industry",
    icon: { x: 0, y: 5 },
    size: 0.1,
  },
  Brewery: {
    maxPops: 3,
    requirements: {
      Stone: 40000,
      Lumber: 25000,
    },
    occupationTitle: "Brewer",
    category: "Food",
    icon: { x: 5, y: 1 },
    upgrades: {},
    allowedRecipes: ["Ale"],
    size: 0.1,
  },
  "Dirt Road": {
    maxPops: 0,
    requirements: {},
    upgrades: {},
    category: "Infrastructure",
    allowedRecipes: [],
    size: 0,
    icon: { x: 5, y: 2 },
    maxAllowed: 1,
  },
  "Farm Field": {
    maxPops: 0,
    requirements: {},
    upgrades: {
      "Convert to Arable Land": {
        repeatable: true,
        requirements: {},
      },
    },
    category: "Food",
    allowedRecipes: [],
    size: 0,
    icon: { x: 6, y: 2 },
  },
  Pasture: {
    maxPops: 1,
    requirements: { Lumber: 2000 },
    upgrades: {
      "Expand Pasture": {
        repeatable: true,
        requirements: { Lumber: 2000 },
        size: 1,
      },
    },
    occupationTitle: "Rancher",
    category: "Food",
    allowedRecipes: [],
    size: 1,
    icon: { x: 6, y: 2 },
  },
} as const satisfies Record<string, BuildingTemplate>;
