export type ItemUnit = "Ton" | "KCal" | "Lb" | "Unit" | "Bushel";
export type ItemCategory =
  | "Crops"
  | "Food"
  | "Drink"
  | "Raw Good"
  | "Good"
  | "Consumable"
  | "Equipment"
  | "Clothing"
  | "Luxuries"
  | "Carbs"
  | "Vitamins"
  | "Protein";
export type ItemType = {
  unit: ItemUnit;
  category: ItemCategory[];
};
export type ItemName = keyof typeof items;
export type ItemRecord = Partial<Record<ItemName, number>>;
export const items = {
  Grain: {
    unit: "Bushel",
    category: ["Crops"],
  },
  Vegetables: {
    unit: "Lb",
    category: ["Crops", "Food", "Vitamins"],
  },
  Fruit: {
    unit: "Lb",
    category: ["Crops", "Food", "Vitamins"],
  },
  Flax: {
    unit: "Bushel",
    category: ["Crops"],
  },
  Herbs: {
    unit: "Lb",
    category: ["Raw Good"],
  },
  Legumes: {
    unit: "Lb",
    category: ["Crops", "Protein", "Food"],
  },
  Ale: {
    unit: "Unit",
    category: ["Drink", "Food"],
  },
  Wine: {
    unit: "Unit",
    category: ["Drink", "Food"],
  },
  Bread: {
    unit: "Lb",
    category: ["Food", "Carbs"],
  },
  Porridge: {
    unit: "Lb",
    category: ["Food", "Carbs"],
  },
  Berries: {
    unit: "Lb",
    category: ["Food", "Vitamins"],
  },
  Meat: {
    unit: "Lb",
    category: ["Food", "Protein"],
  },
  Eggs: {
    unit: "Lb",
    category: ["Food", "Protein"],
  },
  Cheese: {
    unit: "Lb",
    category: ["Food", "Protein"],
  },
  Lumber: {
    unit: "Ton",
    category: ["Raw Good"],
  },
  Stone: {
    unit: "Ton",
    category: ["Raw Good"],
  },
  "Iron Ore": {
    unit: "Ton",
    category: ["Raw Good"],
  },
  "Gold Ore": {
    unit: "Ton",
    category: ["Raw Good"],
  },
  "Silver Ore": {
    unit: "Ton",
    category: ["Raw Good"],
  },
  Clay: {
    unit: "Lb",
    category: ["Raw Good"],
  },
  "Raw Wool": {
    unit: "Lb",
    category: ["Raw Good"],
  },
  "Animal Hides": {
    unit: "Lb",
    category: ["Raw Good"],
  },
  Flour: {
    unit: "Lb",
    category: ["Raw Good"],
  },
  Milk: {
    unit: "Lb",
    category: ["Raw Good"],
  },
  "Iron Ingot": {
    unit: "Lb",
    category: ["Good"],
  },
  "Gold Ingot": {
    unit: "Lb",
    category: ["Good"],
  },
  "Silver Ingot": {
    unit: "Lb",
    category: ["Good"],
  },
  Gems: {
    unit: "Unit",
    category: ["Good"],
  },
  "Wool Fabric": {
    unit: "Lb",
    category: ["Good"],
  },
  Leather: {
    unit: "Lb",
    category: ["Good"],
  },
  "Linen Fabric": {
    unit: "Lb",
    category: ["Good"],
  },
  Fur: {
    unit: "Lb",
    category: ["Good"],
  },
  Coins: {
    unit: "Unit",
    category: ["Good"],
  },
  Tooling: {
    unit: "Unit",
    category: ["Consumable"],
  },
  Charcoal: {
    unit: "Lb",
    category: ["Consumable"],
  },
  Firewood: {
    unit: "Lb",
    category: ["Consumable"],
  },
  Carts: {
    unit: "Unit",
    category: ["Consumable"],
  },
  Swords: {
    unit: "Unit",
    category: ["Equipment"],
  },
  Spears: {
    unit: "Unit",
    category: ["Equipment"],
  },
  Bows: {
    unit: "Unit",
    category: ["Equipment"],
  },
  Arrows: {
    unit: "Unit",
    category: ["Equipment"],
  },
  Shields: {
    unit: "Unit",
    category: ["Equipment"],
  },
  Pickaxes: {
    unit: "Unit",
    category: ["Equipment"],
  },
  Woodaxes: {
    unit: "Unit",
    category: ["Equipment"],
  },
  Books: {
    unit: "Unit",
    category: ["Equipment"],
  },
  "Linen Clothes": {
    unit: "Unit",
    category: ["Clothing"],
  },
  "Wool Clothes": {
    unit: "Unit",
    category: ["Clothing"],
  },
  Chainmail: {
    unit: "Unit",
    category: ["Clothing"],
  },
  Boots: {
    unit: "Unit",
    category: ["Clothing"],
  },
  Pottery: {
    unit: "Unit",
    category: ["Luxuries"],
  },
  Dinnerware: {
    unit: "Unit",
    category: ["Luxuries"],
  },
  Jewelry: {
    unit: "Unit",
    category: ["Luxuries"],
  },
} as const satisfies Record<string, ItemType>;
export type Item = {
  type: "item";
  num: number;
  itemType: ItemName;
  quality: number;
};
