import { writable } from "svelte/store";
import type { NPC } from "./data/npcs";
import type { Area } from "./data/areas";
import type { ItemName } from "./data/items";
import type { Lord } from "./data/lords";
import { Map, TerrainTile } from "./map/generation";
import type { Need } from "./simulation/needs";
import type { ChoiceEvent } from "./data/choices";
import type { Event } from "./data/events";

export type TimePeriod = "Morning" | "Afternoon" | "Evening";

export type GameState = {
  npcs: NPC[];
  deadNpcs: NPC[];
  areas: Area[];
  inventory: Partial<Record<ItemName, number>>;
  priorInventory: Partial<Record<ItemName, number>>;
  currentDay: number;
  currentYear: number;
  currentPeriod: TimePeriod;
  dailyWorkerActivity: Set<string>; // Track which workers have worked today
  areaActionTaken: boolean; // Track if lord has taken an area action this period
  log: Array<{ year: number; day: number; msg: string; tags: string[] }>;
  lord?: Lord;
  season: "Summer" | "Spring" | "Winter" | "Autumn";
  mapSize: number;
  map?: Map;
  needs: Record<string, Need>;
  pause: boolean;
  pending: boolean;
  choiceEvents: ChoiceEvent[];
  pastLords: Lord[];
  events: Event[]; // Renamed from activeEvents for V2 compatibility
  village: {
    trust: number;
    authority: number;
  };
};
export const game = writable<GameState>({
  npcs: [],
  deadNpcs: [],
  areas: [],
  inventory: {},
  priorInventory: {},
  currentDay: 1,
  currentYear: 0,
  currentPeriod: "Morning",
  dailyWorkerActivity: new Set(),
  areaActionTaken: false,
  log: [],
  season: "Spring",
  mapSize: 20,
  needs: {},
  pause: true,
  pending: true,
  choiceEvents: [],
  pastLords: [],
  events: [],
  village: {
    trust: 0,
    authority: 0,
  },
});
export const map = writable<TerrainTile[]>([]);
export type View = {
  renderSize: number;
  zoom: number;
  x: number;
  y: number;
  xDiff: number;
  yDiff: number;
};
export const view = writable<View>({
  zoom: 1,
  x: 0,
  y: 0,
  xDiff: 0,
  yDiff: 0,
  renderSize: 1000,
});
export const openModals = writable<Record<string, any>>({});
export const mouseCood = writable<{ x: number; y: number }>({ x: 0, y: 0 });
export const autoPlay = writable<boolean>(false);
