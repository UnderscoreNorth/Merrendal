import type { TerrainTile } from "./map/generation";
import { getAllBuildings } from "./simulation/buildings";
import type { GameState } from "./stores";
import { game } from "./stores";
import { get } from "svelte/store";

const SAVE_KEY = "merrendal_save";

/**
 * Save the current game state to localStorage
 */
export function saveGame(): void {
  try {
    const gameState = get(game);
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
    } = JSON.parse(savedData);
    saveData.game.dailyWorkerActivity = new Set();
    // Restore the game state
    game.set(saveData.game);

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
