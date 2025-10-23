import { type Area } from "$lib/data/areas";
import { type TerrainTile } from "$lib/map/generation";
import { rollRange } from "$lib/util/rolls";
import { fromCube, shuffle } from "$lib/util/terrainHelpers";
import * as PIXI from "pixi.js";
export type TreeCoord = {
  x: number;
  y: number;
  var: number | string;
  curr: string;
};
export function drawTrees(
  treeSprites: Record<string, TreeCoord[]>,
  mapSprites: Record<
    string,
    { container: PIXI.Container; tile: PIXI.Sprite; trees: PIXI.Sprite[] }
  >,
  buildingSheet: Record<string, PIXI.Texture>,
  fullTrees: PIXI.Texture[],
  cell: Area,
  u: number,
  treeOpacity: number,
) {
  const key = fromCube(cell.loc);
  const availablePositions = treeSprites[key];
  const maxTrees = availablePositions.length;
  const desiredTrees = Math.floor(cell.terrain.forested / 5);
  const treeCount = Math.min(desiredTrees, maxTrees);
  const numBuildings = cell.buildings.length;

  let currentTrees = availablePositions.filter((i) => i.curr == "tree").length;
  const data = mapSprites[fromCube(cell.loc)];
  if (currentTrees < treeCount) {
    for (let i = 0; i < maxTrees; i++) {
      if (availablePositions[i].curr == "") {
        availablePositions[i].curr = "tree";
        currentTrees++;
        if (currentTrees == treeCount) break;
      }
    }
  } else if (currentTrees > treeCount) {
    for (let i = 0; i < maxTrees; i++) {
      if (availablePositions[i].curr == "tree") {
        availablePositions[i].curr = "";
        currentTrees--;
        const sprite = data.trees[i];
        if (sprite !== undefined) {
          data.container.removeChild(sprite);
          sprite.destroy();
        }
        if (currentTrees == treeCount) break;
      }
    }
  }
  for (let i = 0; i < numBuildings; i++) {
    const building = cell.buildings[i];
    let index = availablePositions.findIndex((j) => j.curr == building.id);
    if (index >= 0) continue;
    for (let j = 0; j < maxTrees; j++) {
      if (availablePositions[j].curr == "") {
        availablePositions[j].curr = cell.buildings[i].id;
        availablePositions[j].var = cell.buildings[i].buildingType;
        break;
      }
    }
  }
  for (let i = 0; i < maxTrees; i++) {
    const buildingID = availablePositions[i].curr;
    if (buildingID == "tree" || buildingID == "") continue;
    if (cell.buildings.filter((j) => j.id == buildingID).length == 0) {
      availablePositions[i].var = 0;
      const sprite = data.trees[i];
      data.container.removeChild(sprite);
      sprite.destroy();
    }
  }

  availablePositions.forEach((pos, index) => {
    if (pos.curr == "") return;
    if (pos.var == "Dirt Road") return;
    const data = mapSprites[fromCube(cell.loc)];
    if (!data.trees[index]) {
      const texture =
        typeof pos.var == "number"
          ? fullTrees[pos.var]
          : buildingSheet[pos.var];
      const treeSprite = new PIXI.Sprite(texture);
      treeSprite.anchor.set(0.5, 0.8); // Anchor at bottom center of tree

      // Position relative to tile center
      const hexRadius = u; // Approximate hex radius for positioning
      treeSprite.position.set(
        pos.x * hexRadius,
        pos.y * hexRadius * 0.65, // Slightly compress Y to fit hex better
      );
      // Scale trees appropriately
      const treeScale = typeof pos.var == "number" ? u / 120 : u / 500; // Adjust scale as needed
      treeSprite.scale.set(treeScale, treeScale);

      if (typeof pos.var == "string" && pos.var.includes("Bridge")) {
        treeSprite.position.set(0, 1);
        treeSprite.scale.set(u / 400, u / 400);
      }
      if (pos.curr == "tree") treeSprite.alpha = treeOpacity / 100;
      // Add some random brightness variation
      let brightness = 1;
      if (typeof pos.var == "number") brightness = 0.9 + (pos.var % 10) * 0.01;
      const tintValue = Math.floor(brightness * 255);
      treeSprite.tint = (tintValue << 16) | (tintValue << 8) | tintValue;
      data.container.addChild(treeSprite);
      data.trees[index] = treeSprite;
      treeSprite.zIndex = pos.y + 10;
    } else if (pos.curr == "tree") {
      data.trees[index].alpha = treeOpacity / 100;
    }
  });

  //console.log(currentCount++);
}
export function getTreePositions(
  fullTrees: PIXI.Texture[],
  cell: Area,
): TreeCoord[] {
  // Use tile coordinates as seed for deterministic randomness
  let seed = (cell.loc.q * 73856093) ^ (cell.loc.r * 19349663);

  // Simple LCG for deterministic pseudo-random numbers
  function seededRandom() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }
  const points: TreeCoord[] = [];

  // Calculate vertical spacing
  const verticalSpacing = Math.sqrt(3) / 6;
  const horizontalSpacing = 1 / 3;

  // Row configurations: [number of points, y-offset multiplier]
  const rows = [
    { count: 3, yMultiplier: 3 },
    { count: 4, yMultiplier: 2 },
    { count: 5, yMultiplier: 1 },
    { count: 6, yMultiplier: 0 },
    { count: 5, yMultiplier: -1 },
    { count: 4, yMultiplier: -2 },
    { count: 3, yMultiplier: -3 },
  ];

  for (const row of rows) {
    const y = row.yMultiplier * verticalSpacing;
    const xOffset = -((row.count - 1) * horizontalSpacing) / 2;

    for (let i = 0; i < row.count; i++) {
      const x = xOffset + i * horizontalSpacing;
      pushPoint(x, y);
    }
  }
  function pushPoint(x: number, y: number) {
    points.push({
      x,
      y,
      curr: "",
      var: rollRange(0, fullTrees.length - 1),
    });
  }
  for (let i in points) {
    //points[i].x += (Math.random() - 0.5) / 4;
    //points[i].y += (Math.random() - 0.5) / 4;
  }
  shuffle(points);
  return points;
}
