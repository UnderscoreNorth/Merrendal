import * as PIXI from "pixi.js";
import { OutlineFilter } from "pixi-filters";
import { rollRange } from "$lib/util/rolls";
import type { TerrainTile } from "$lib/map/generation";
import { fromCube } from "$lib/util/terrainHelpers";
import { type Area } from "$lib/data/areas";

/**
 * Draw rivers and roads on a tile
 */
export function drawRiverRoad(
  cell: Area,
  u: number,
  xScale: number,
  yScale: number,
  rotation: number,
): PIXI.Graphics | undefined {
  if (fromCube(cell.loc) == "-23,-14,37") console.log(cell);
  if (!cell.terrain.river && !cell.terrain.road) {
    return undefined;
  }

  const river = new PIXI.Graphics();
  river.moveTo(0, 0);
  const angleOffset = rotation / 60;

  const riverDirs = cell.terrain.river.split("").map((i) => Number(i));
  const roadDirs = cell.terrain.road.split("").map((i) => Number(i));
  // Draw roads first (so they appear under rivers)
  for (let i of roadDirs) {
    drawRoad(river, i, u, angleOffset, riverDirs.length > 0);
  }

  // Draw rivers on top
  for (let i of riverDirs) {
    drawRiver(river, i, u, angleOffset);
  }

  river.moveTo(0, 0);
  river.filters = [new OutlineFilter(0.5, 0x000000)];
  river.position.set(0, 0);
  river.scale.set(Math.abs(xScale), yScale);

  return river;
}

/**
 * Draw a single road segment
 */
function drawRoad(
  graphics: PIXI.Graphics,
  direction: number,
  u: number,
  angleOffset: number,
  crossesRiver: boolean,
): void {
  const angle = ((direction - 1.5 + angleOffset) * Math.PI) / 3;
  const endX = Math.cos(angle) * u * 7;
  const endY = Math.sin(angle) * u * 7;

  // Create squiggly line with small zigzag segments
  const segments = rollRange(1, 6);
  const perpAngle = angle + Math.PI / 2;

  graphics.moveTo(endX, endY);
  for (let seg = segments; seg >= 0; seg--) {
    const t = seg / segments;
    // Stop before center if crossing a river
    //if (crossesRiver && t < 0.3) break;

    const baseX = endX * t;
    const baseY = endY * t;

    const zigzag = (seg % 2 === 0 ? 1 : -1) * u * 0.5;
    const offsetX = baseX + Math.cos(perpAngle) * zigzag;
    const offsetY = baseY + Math.sin(perpAngle) * zigzag;

    graphics.lineTo(offsetX, offsetY);
  }

  graphics.stroke({
    width: 40,
    color: 0x967d56, // Brown road color
    cap: "round",
    join: "round",
  });
  graphics.moveTo(0, 0);
}

/**
 * Draw a single river segment
 */
function drawRiver(
  graphics: PIXI.Graphics,
  direction: number,
  u: number,
  angleOffset: number,
): void {
  const angle = ((direction - 1.5 + angleOffset) * Math.PI) / 3;
  const endX = Math.cos(angle) * u * 7.5;
  const endY = Math.sin(angle) * u * 7.5;

  // Create squiggly line with small zigzag segments
  const segments = rollRange(1, 6);
  const perpAngle = angle + Math.PI / 2;

  for (let seg = 0; seg <= segments; seg++) {
    const t = seg / segments;
    const baseX = endX * t;
    const baseY = endY * t;

    // Alternate offset direction for zigzag effect
    const zigzag = (seg % 2 === 0 ? 1 : -1) * u * 0.5;
    const offsetX = baseX + Math.cos(perpAngle) * zigzag;
    const offsetY = baseY + Math.sin(perpAngle) * zigzag;

    graphics.lineTo(offsetX, offsetY);
  }

  graphics.stroke({
    width: 20,
    color: 0x425f73, // Blue river color
    cap: "round",
    join: "round",
  });
  graphics.moveTo(0, 0);
}
