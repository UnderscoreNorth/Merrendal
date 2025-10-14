import { AnimalType } from "./living";

export const animalType = {
  Cattle: {
    acresPer: 2.5,
    initialMeat: 200,
    adultMeat: 700,
    initialHide: 48,
    adultHide: 168,
    maturity: 4,
    birthRate: 1,
  },
  Chicken: {
    acresPer: 0.1,
    initialMeat: 0,
    initialHide: 0,
    adultHide: 0,
    adultMeat: 2,
    maturity: 3,
    birthRate: 10,
  },
  Sheep: {
    initialMeat: 30,
    adultMeat: 50,
    acresPer: 0.4,
    initialHide: 0,
    adultHide: 2,
    birthRate: 1,
    maturity: 3,
  },
} as const satisfies Record<
  AnimalType,
  {
    acresPer: number;
    initialMeat: number;
    adultMeat: number;
    initialHide: number;
    adultHide: number;
    maturity: number;
    birthRate: number;
  }
>;
