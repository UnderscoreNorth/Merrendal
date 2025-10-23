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
  areas: Record<string, Area>;
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
    stability: number;
  };
  render: boolean;
};
export const game = writable<GameState>({
  seed: "",
  npcs: [],
  deadNpcs: [],
  animals: [],
  areas: {},
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
    stability: 100,
  },
  render: false,
});
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
export const changedAreas = writable<{ tiles: string[]; render: boolean }>({
  tiles: [],
  render: true,
});

// Tile selection state for building expansions
export type TileSelectionState = {
  active: boolean;
  sourceAreaId: string; // The area with the building being upgraded
  buildingId: string; // The building being upgraded
  upgradeName: string; // The upgrade being applied
  eligibleTiles: Set<string>; // Set of area IDs that are eligible
  onSelect: (areaId: string) => void; // Callback when a tile is selected
  onCancel: () => void; // Callback when selection is cancelled
} | null;

export const tileSelection = writable<TileSelectionState>(null);
