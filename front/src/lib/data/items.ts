export type ItemName = keyof typeof items;
export const unitTypes = [
  "Bushels",
  "KCalories",
  "Units",
  "Lbs",
  "Tons",
] as const;
export const itemCategories = [
  "Food",
  "Crops",
  "Raw Goods",
  "Fuel",
  "Materials",
  "Weapons",
] as const;
export type ItemRecord = Partial<Record<ItemName, number>>;
export const items = {
  Wheat: {
    unitType: "Bushels",
    category: "Food",
    farmable: true,
    stockpile: true,
  },
  Bread: {
    unitType: "KCalories",
    category: "Food",
    stockpile: true,
  },
  Vegetables: {
    unitType: "KCalories",
    category: "Food",
    farmable: true,
  },
  Meat: {
    unitType: "KCalories",
    category: "Food",
    stockpile: true,
  },
  Lumber: {
    unitType: "Tons",
    category: "Raw Goods",
  },
  "Iron Ore": {
    unitType: "Lbs",
    category: "Raw Goods",
    mineable: true,
  },
  /* "Gold Ore": {
    unitType: "Lbs",
    category: "Raw Goods",
    mineable: true,
    stockpile: true,
  },*/
  Charcoal: {
    unitType: "Lbs",
    category: "Fuel",
  },
  "Iron Ingots": {
    unitType: "Lbs",
    category: "Materials",
  },
  Spears: {
    unitType: "Units",
    category: "Weapons",
  },
  Stone: {
    unitType: "Tons",
    category: "Materials",
    //mineable: true,
  },
} as const satisfies Record<
  string,
  {
    unitType: (typeof unitTypes)[number];
    category: (typeof itemCategories)[number];
    farmable?: boolean;
    mineable?: boolean;
    stockpile?: boolean;
  }
>;
