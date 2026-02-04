export type EncyclopediaPage = {
  id: string;
  title: string;
  category: string;
  sections: EncyclopediaSection[];
};

export type EncyclopediaSection = {
  title?: string;
  content: string;
  list?: string[];
};

export const encyclopediaPages: Record<string, EncyclopediaPage> = {
  // Main index page
  index: {
    id: "index",
    title: "Encyclopedia",
    category: "Main",
    sections: [
      {
        content:
          "Welcome to the Merrendal Encyclopedia. Browse through the following topics to learn more about your village and its management.",
      },
      {
        title: "Core Concepts",
        list: [
          "{village} - Understanding your village",
          "{buildings} - Structures and their purposes",
          "{population} - Managing your villagers",
          "{resources} - Materials and goods",
        ],
      },
      {
        title: "Economy & Production",
        list: [
          "{farming} - Agriculture and food production",
          "{industry} - Crafting and manufacturing",
          "{trade} - Commerce and exchange",
        ],
      },
      {
        title: "Detailed References",
        list: [
          "{building-list} - Complete list of all buildings",
          "{item-list} - Complete list of all items",
          "{animal-list} - Complete list of all animals",
        ],
      },
    ],
  },

  // Core concept pages
  village: {
    id: "village",
    title: "Village Management",
    category: "Core Concepts",
    sections: [
      {
        content:
          "Your village is the heart of your domain. It consists of {buildings}, {population}, and {resources} that must be carefully managed to ensure prosperity and growth.",
      },
      {
        title: "Key Aspects",
        list: [
          "Building placement and expansion",
          "Population assignment and happiness",
          "Resource production and consumption",
          "Seasonal planning and preparation",
        ],
      },
      {
        content:
          "Success requires balancing the needs of your {population} with available {resources}, while planning for future growth through strategic {buildings} placement.",
      },
    ],
  },

  buildings: {
    id: "buildings",
    title: "Buildings",
    category: "Core Concepts",
    sections: [
      {
        content:
          "Buildings are the foundation of your village's infrastructure. Each building serves a specific purpose, from housing your {population} to producing {resources}.",
      },
      {
        title: "Building Categories",
        list: [
          "Extraction - Gather raw materials from the land",
          "Industry - Process raw materials into goods",
          "Infrastructure - Support village operations",
          "Food - Produce sustenance for your people",
          "Manor - Noble residences and administration",
        ],
      },
      {
        title: "Construction",
        content:
          "Buildings require specific {resources} to construct and may have ongoing maintenance costs. Plan your construction carefully to ensure you have the necessary materials.",
      },
      {
        title: "Upgrades",
        content:
          "Many buildings can be upgraded to improve their capacity or unlock new capabilities. See the {building-list} for specific upgrade options.",
      },
    ],
  },

  population: {
    id: "population",
    title: "Population",
    category: "Core Concepts",
    sections: [
      {
        content:
          "Your villagers are your most valuable asset. They work in {buildings}, consume {resources}, and grow your community over time.",
      },
      {
        title: "Worker Assignment",
        content:
          "Assign villagers to work in {buildings} to produce goods and gather resources. Each building has a maximum worker capacity.",
      },
      {
        title: "Population Needs",
        content:
          "Villagers need food, shelter, and other basic necessities. Meeting these needs keeps your population happy and productive. Monitor your {resources} to ensure adequate supplies.",
      },
      {
        title: "Growth",
        content:
          "Your population grows naturally over time when conditions are favorable. Ensure adequate housing and food supplies to support population growth.",
      },
    ],
  },

  resources: {
    id: "resources",
    title: "Resources",
    category: "Core Concepts",
    sections: [
      {
        content:
          "Resources are the materials, goods, and consumables that drive your village economy. They are produced by {buildings} and consumed by your {population}.",
      },
      {
        title: "Resource Categories",
        list: [
          "Crops - Agricultural products from {farming}",
          "Food - Prepared sustenance for your people",
          "Raw Goods - Materials for {industry}",
          "Goods - Manufactured items",
          "Equipment - Tools and implements",
        ],
      },
      {
        content:
          "See the {item-list} for a complete reference of all available resources and their properties.",
      },
    ],
  },

  farming: {
    id: "farming",
    title: "Farming",
    category: "Economy & Production",
    sections: [
      {
        content:
          "Farming is essential for feeding your {population}. Farm fields produce crops that can be consumed directly or processed into other {resources}.",
      },
      {
        title: "Field Rotation",
        content:
          "Fields can use different rotation systems to maintain soil fertility. The 2-field and 3-field rotation systems help maximize yields over time.",
      },
      {
        title: "Crops",
        content:
          "Different crops serve different purposes. Grain provides {Grain}, vegetables provide {Vegetables}, and legumes provide {Legumes}. Each crop type has different nutritional values.",
      },
      {
        title: "Seasonal Cycles",
        content:
          "Plan your planting and harvesting around the seasons. Some crops grow better in certain seasons, and you'll need to store enough food for winter.",
      },
    ],
  },

  industry: {
    id: "industry",
    title: "Industry",
    category: "Economy & Production",
    sections: [
      {
        content:
          "Industrial {buildings} transform raw materials into finished goods. This includes everything from milling {Grain} into {Flour} to crafting {Tools} and {Clothing}.",
      },
      {
        title: "Production Chains",
        content:
          "Many goods require multiple processing steps. For example, {Flax} becomes {Linen Thread}, which then becomes {Cloth}, which can finally be made into {Clothing}.",
      },
      {
        title: "Recipes",
        content:
          "Each industrial building has specific recipes it can produce. Assign workers to buildings and they will automatically produce goods based on available materials.",
      },
    ],
  },

  trade: {
    id: "trade",
    title: "Trade",
    category: "Economy & Production",
    sections: [
      {
        content:
          "Trade allows you to exchange {resources} with other settlements, acquiring goods you cannot produce locally.",
      },
      {
        content:
          "Use trade to obtain luxury items, specialized goods, or to sell surplus production. Managing trade routes can significantly boost your village's prosperity.",
      },
    ],
  },

  // List pages (to be populated dynamically)
  "building-list": {
    id: "building-list",
    title: "Building Reference",
    category: "Reference",
    sections: [
      {
        content:
          "This page lists all available buildings. Click on any building name to learn more about its requirements, production capabilities, and upgrades.",
      },
    ],
  },

  "item-list": {
    id: "item-list",
    title: "Item Reference",
    category: "Reference",
    sections: [
      {
        content:
          "This page lists all items and resources in the game, organized by category.",
      },
    ],
  },

  "animal-list": {
    id: "animal-list",
    title: "Animal Reference",
    category: "Reference",
    sections: [
      {
        content:
          "This page lists all animals that can be raised in your village, including their requirements and yields.",
      },
    ],
  },
};
