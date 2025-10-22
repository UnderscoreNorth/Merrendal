import type { TerrainTile } from "./map/generation";
import { getAllBuildings } from "./simulation/buildings";
import type { GameState } from "./stores";
import { game, map } from "./stores";
import { get } from "svelte/store";

const SAVE_KEY = "merrendal_save";

/**
 * Save the current game state to localStorage
 */
export function saveGame(): void {
  try {
    const gameState = get(game);
    const mapState = get(map);
    const workers: Record<string, string[]> = {};
    for (const building of getAllBuildings(gameState)) {
      workers[building.id] = Array.from(building.workers);
    }
    // Create a serializable version of the game state
    const saveData = {
      game: {
        ...gameState,
        dailyWorkerActivity: Array.from(gameState.dailyWorkerActivity),

        map: gameState.map
          ? {
              start: gameState.map.start,
              tiles: gameState.map.tiles,
            }
          : undefined,
      },
      workers,
      map: mapState,
      timestamp: Date.now(),
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    console.log("Game saved successfully");
  } catch (error) {
    console.error("Failed to save game:", error);
  }
}

/**
 * Load the game state from localStorage
 * Returns true if a save was loaded, false otherwise
 */
export function loadGame(): boolean {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);

    if (!savedData) {
      console.log("No save data found");
      return false;
    }

    const saveData: {
      game: GameState;
      map: TerrainTile[];
      workers: Record<string, string[]>;
    } = JSON.parse(savedData);
    saveData.game.dailyWorkerActivity = new Set();
    for (const building of getAllBuildings(saveData.game)) {
      if (saveData.workers[building.id]) {
        building.workers = new Set(saveData.workers[building.id]);
      }
    }
    // Restore the game state
    game.set(saveData.game);

    // Restore the map state
    if (saveData.map) {
      map.set(saveData.map);
    }

    console.log("Game loaded successfully");
    return true;
  } catch (error) {
    console.error("Failed to load game:", error);
    return false;
  }
}

/**
 * Clear the saved game from localStorage
 */
export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
    console.log("Save data cleared");
  } catch (error) {
    console.error("Failed to clear save data:", error);
  }
}
