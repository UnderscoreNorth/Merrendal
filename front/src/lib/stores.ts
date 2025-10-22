import { writable } from "svelte/store";
import { type Area } from "./data/areas";
import { type ItemName } from "./data/items";
import { Map, TerrainTile } from "./map/generation";
import type { Villager, Animal } from "./data/living";

export type TimePeriod = "Morning" | "Afternoon" | "Evening";

export type GameState = {
  seed: string;
  npcs: Villager[];
  deadNpcs: Villager[];
  animals: Animal[];
  areas: Area[];
  inventory: Partial<Record<ItemName, number>>;
  priorInventory: Partial<Record<ItemName, number>>;
  currentDay: number;
  currentYear: number;
  currentPeriod: TimePeriod;
  dailyWorkerActivity: Set<string>; // Track which workers have worked today
  areaActionTaken: boolean; // Track if lord has taken an area action this period
  log: Array<{ year: number; day: number; msg: string; tags: string[] }>;
  season: "Summer" | "Spring" | "Winter" | "Autumn";
  mapSize: number;
  map?: Map;
  needs: Record<string, any>;
  pause: boolean;
  pending: boolean;
  activeEvents: Event[];
  village: {
    trust: number;
    authority: number;
  };
  render: boolean;
};
export const game = writable<GameState>({
  seed: "",
  npcs: [],
  deadNpcs: [],
  animals: [],
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
  activeEvents: [],
  village: {
    trust: 0,
    authority: 0,
  },
  render: false,
});
export const map = writable<TerrainTile[]>([]);
export type View = {
  renderSize: number;
  zoom: number;
  x: number;
  y: number;
  xDiff: number;
  yDiff: number;
  rotation: number;
  relief: number;
  treeOpacity: number;
};
export const view = writable<View>({
  zoom: 1,
  x: 600,
  y: 600,
  xDiff: 0,
  yDiff: 0,
  renderSize: 1000,
  rotation: 0,
  relief: 2,
  treeOpacity: 100,
});
export const openModals = writable<Record<string, any>>({});
export const mouseCood = writable<{ x: number; y: number }>({ x: 0, y: 0 });
export const autoPlay = writable<boolean>(false);
