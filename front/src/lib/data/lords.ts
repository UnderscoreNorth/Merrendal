import { recordLoop } from "$lib/util/recordLoop";
import { pick, roll, rollRange } from "$lib/util/rolls";
import { goals, type Goal } from "./goals";
import type { ItemRecord, type ItemName } from "./items";
import { generateFName, type Person } from "./person";
import type { Status } from "./status";
export type Trait = "Patient" | "Inpatient" | "Kind" | "Cruel" | "Alchemy" | "Fighter";

export class Lord implements Person {
  id: string;
  fName: string;
  lName?: string;
  title?: string;
  age: number;
  birthday: number;
  stats: {
    str: number;
    dex: number;
  };
  statuses: Record<string, Status>;
  hunger: number;
  causeOfDeath?: string;
  background: LordBackground;
  goal: Goal;
  traits: Set<Trait>;
  reign: number;
  date: {
    year: number;
    day: number;
  };
  reignStats: {
    born: number;
    died: number;
  };
  logs: Array<{ year: number; day: number; msg: string; tags: string[] }>; // Archived logs recorded by archivist

  constructor(
    id: string,
    fName: string,
    age: number,
    birthday: number,
    stats: { str: number; dex: number },
    background: LordBackground,
    goal: Goal,
    traits: Set<Trait> = new Set(),
    reign: number = 0,
    date: { year: number; day: number } = { year: 0, day: 1 },
  ) {
    this.id = id;
    this.fName = fName;
    this.age = age;
    this.birthday = birthday;
    this.stats = stats;
    this.statuses = {};
    this.hunger = 0;
    this.background = background;
    this.goal = goal;
    this.traits = traits;
    this.reign = reign;
    this.date = date;
    this.reignStats = { born: 0, died: 0 };
    this.logs = [];
  }
}
export type LordBackground = keyof typeof lordBackgrounds;
const lordBackgrounds = {
  Adventurer: {
    appearanceWeight: 4,
    age: { min: 21, max: 30 },
    goals: Object.values(goals),
  },
  Noble: {
    appearanceWeight: 20,
    age: { min: 18, max: 50 },
    goals: Object.values(goals),
  },
  Merchant: {
    appearanceWeight: 4,
    age: { min: 18, max: 50 },
    goals: Object.values(goals),
  },
  Govenor: {
    appearanceWeight: 4,
    age: { min: 30, max: 50 },
    goals: Object.values(goals),
  },
  "Mercenary Leader": {
    appearanceWeight: 4,
    age: { min: 25, max: 50 },
    goals: Object.values(goals),
  },
  Villager: {
    appearanceWeight: 1,
    age: { min: 18, max: 50 },
    goals: Object.values(goals),
  },
  General: {
    appearanceWeight: 4,
    age: { min: 30, max: 50 },
    goals: Object.values(goals),
  },
  Sorceror: {
    appearanceWeight: 2,
    age: { min: 18, max: 60 },
    goals: Object.values(goals),
  },
} as const;

export function generateLords() {
  let lords: Array<{ lord: Lord; bonuses: ItemRecord }> = [];
  for (let i = 0; i < 3; i++) {
    const background = roll(
      recordLoop(lordBackgrounds).map(([i, j]) => [i, j.appearanceWeight]),
    );

    // Determine traits based on background
    const traits = new Set<Trait>();
    if (
      background === "Adventurer" ||
      background === "General" ||
      background === "Mercenary Leader"
    ) {
      traits.add("Fighter");
    }

    const lord = new Lord(
      "Lord" + Math.random().toFixed(2),
      generateFName(),
      rollRange(
        lordBackgrounds[background].age.min,
        lordBackgrounds[background].age.max,
      ),
      rollRange(1, 365),
      {
        dex: rollRange(3, 7),
        str: rollRange(3, 7),
      },
      background,
      pick(lordBackgrounds[background].goals),
      traits,
      0,
      { year: 0, day: 1 },
    );

    lords.push({
      lord,
      bonuses: { Bread: rollRange(500, 1500) },
    });
  }
  return lords;
}
