import * as PIXI from "pixi.js";
import type { TerrainTile } from "$lib/map/generation";
import { rotateCubeCoordinates } from "$lib/util/terrainHelpers";
import { type Area } from "$lib/data/areas";

export interface TileSpriteData {
  container: PIXI.Container;
  tile: PIXI.Sprite;
  trees: PIXI.Sprite[];
  riverRoad?: PIXI.Graphics;
}

/**
 * Get the appropriate texture for a terrain tile based on its properties
 */
export function getTileTexture(
  cell: Area,
  tilesheet: Record<string, PIXI.Texture>,
): PIXI.Texture | null {
  if (!tilesheet || Object.keys(tilesheet).length === 0) return null;

  let tileName: string = cell.terrain.topography;

  if (cell.terrain.elevation > 18) {
    tileName = "mountain peak";
  } else if (cell.terrain.elevation > 13) {
    tileName = "Mountain";
  } else if (cell.terrain.elevation >= 10) {
    tileName = "Hill";
  }
  if (cell.buildings.some((i) => i.buildingType == "Farm Field"))
    tileName = "Farm";
  if (!tileName || !tilesheet[tileName]) {
    console.warn(`No texture found for terrain type: ${tileName}`);
    return null;
  }

  return tilesheet[tileName];
}

/**
 * Calculate tile position based on hex coordinates and rotation
 */
export function calculateTilePosition(
  cell: Area,
  u: number,
  rotation: number,
  relief: number,
): { x: number; y: number; layer: number } {
  let elevation = cell.terrain.elevation;
  if (elevation < 0) {
    elevation = 0;
  } else {
    elevation += 0.5;
  }
  if (cell.terrain.topography === "Mountain") elevation -= 0.5;

  // Apply rotation to coordinates
  const rotations = rotation / 60; // Convert degrees to number of 60° rotations
  const rotatedLoc = rotateCubeCoordinates(cell.loc, rotations);

  const x = u * ((3 * rotatedLoc.q) / 2);
  const y =
    u *
    ((Math.sqrt(3) * rotatedLoc.q) / 2 +
      Math.sqrt(3) * rotatedLoc.r -
      elevation * (relief / 10)) *
    0.75;
  const layer = (Math.sqrt(3) * rotatedLoc.q) / 2 + Math.sqrt(3) * rotatedLoc.r;

  return { x, y, layer };
}

/**
 * Calculate tile scale and flip
 */
export function calculateTileScale(
  cell: Area,
  u: number,
): { xScale: number; yScale: number } {
  const seed = (cell.loc.q * 73856093) ^ (cell.loc.r * 19349663);
  const shouldFlip = seed % 2 === 0;
  const xScale = ((shouldFlip ? 1 : -1) * (u * 2)) / 240;
  const yScale = (u * 2) / 310;
  return { xScale, yScale };
}

/**
 * Calculate brightness tint for a tile
 */
export function calculateTileBrightness(cell: Area): number {
  let brightness = 1;

  if (cell.terrain.topography === "Water") {
    brightness = 0.4 + ((cell.terrain.elevation + 3) / 3) * 0.6;
  } else if (cell.terrain.topography === "Plains") {
    brightness = 0.7 + cell.terrain.elevation * 0.03;
  } else if (cell.terrain.topography === "Mountain") {
    brightness = 0.8 + (cell.terrain.elevation - 10) * 0.02;
  }

  const tintValue = Math.floor(brightness * 255);
  return (tintValue << 16) | (tintValue << 8) | tintValue;
}

/**
 * Create hexagonal hit area for tile interaction
 */
export function createHexHitArea(u: number): PIXI.Polygon {
  const points = [];
  for (let i = 0; i < 6; i++) {
    points.push(Math.cos((i * 2 * Math.PI) / 6) * u);
    points.push(Math.sin((i * 2 * Math.PI) / 6) * u * 0.75);
  }
  return new PIXI.Polygon(points);
}
