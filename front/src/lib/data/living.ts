import type { Time } from "../data/time";
import type { ItemName } from "./items";

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
  hunger: number;
  health: number;
};

export type Villager = Human & {
  type: "Villager";
  job?: {
    title: string;
    stuck: boolean;
    attached?: string;
    recipe?: ItemName;
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

export type SkillTitles = "Master" | "Expert" | "Journeyman" | "Apprentice";
export const firstNames = [
  "Aaron",
  "Aclehar",
  "Adalger",
  "Adalwald",
  "Adrian",
  "Aicfrida",
  "Alaric",
  "Alden",
  "Alfwald",
  "Alvaro",
  "Amaro",
  "Angharad",
  "Antelm",
  "Arnold-William",
  "Aurelius",
  "Baldwina",
  "Belisarius",
  "Bergamo",
  "Bertfrid",
  "Betto",
  "Bonagiunta",
  "Branislav",
  "Cadwallon",
  "Caspera",
  "Christina",
  "Conrade",
  "Cunimund",
  "Damiana",
  "Doctrama",
  "Druda",
  "Edmer",
  "Eloise",
  "Erchambert",
  "Ermengar",
  "Eudemia",
  "Everold",
  "Felicio",
  "Floridas",
  "Fredegar",
  "Fruga",
  "Gaucelm",
  "Geralde",
  "Germund",
  "Íosa",
  "Godbalda",
  "Gordian",
  "Grossa",
  "Gunnora",
  "Hadena",
  "Hartger",
  "Helmburg",
  "Hermanmar",
  "Hildegaud",
  "Hippola",
  "Hugh",
  "Ido",
  "Ingimund",
  "Ivo",
  "Jodocus",
  "Josaphat",
  "Ketill",
  "Lantberga",
  "Lefwin",
  "Liutgaud",
  "Lombard",
  "Macarius",
  "Magner",
  "Maol",
  "Marquart",
  "Mauro",
  "Melior",
  "Milo",
  "Nantelma",
  "Noah",
  "Odelhilde",
  "Ortgis",
  "Otnand",
  "Pask",
  "Petronilla",
  "Prospero",
  "Radhold",
  "Raven",
  "Reinelm",
  "Rhyshoiarn",
  "Robert",
  "Rothmund",
  "Salvodeus",
  "Saxger",
  "Serich",
  "Sigbod",
  "Soave",
  "Supplicia",
  "Thaddeus",
  "Theodenanda",
  "Thorfinn",
  "Unica",
  "Vermilius",
  "Volkiva",
  "Waldefrid",
  "Waneger",
  "Wendelbert",
  "Wilenc",
  "Winegis",
  "Wojslav",
  "Wulviva",
];

export function generateFName() {
  return firstNames[Math.floor(Math.random() * firstNames.length)];
}
