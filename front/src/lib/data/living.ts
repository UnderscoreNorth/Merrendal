import type { Time } from "../data/time";

export type Stat = "STR" | "DEX" | "INT" | "WIS" | "CON" | "CHA";
export type Trait = "Alchemy" | "Cruel";
export type Stats = {
  STR: number;
  DEX: number;
  INT: number;
  WIS: number;
  CON: number;
  CHA: number;
};
export type Being = {
  id: string;

  status: [];
  age: number;
  birthday: number;
  death?: {
    cause: string;
    time: Time;
  };
};

export type Human = Being & {
  fName: string;
  stats: Stats;
  equipement: [];
};

export type Villager = Human & {
  type: "Villager";
  job: {
    title: string;
    stuck: boolean;
    priority: number;
    attached?: string;
  };
  home: string;
  spouse?: string;
  children: string[];
  skills: Record<string, number>;
  apprentices: string[];
};

export type Lord = Human & {
  goal: string;
  background: string;
  reign: {
    start: Time;
  };
};

export type AnimalType = "Cattle" | "Chicken" | "Sheep";
export type Animal = Being & {
  type: "Animal";
  animalType: AnimalType;
};
