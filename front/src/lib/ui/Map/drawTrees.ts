import { type Area } from "$lib/data/areas";
import { type TerrainTile } from "$lib/map/generation";
import { fromCube, shuffle } from "$lib/util/terrainHelpers";
import * as PIXI from "pixi.js";
export type TreeCoord = { x: number; y: number; var: number; curr: string };
export function drawTrees(
  treeSprites: Record<string, TreeCoord[]>,
  mapSprites: Record<
    string,
    { container: PIXI.Container; tile: PIXI.Sprite; trees: PIXI.Sprite[] }
  >,
  area: Area | undefined,
  buildingSheet: Record<string, PIXI.Texture>,
  fullTrees: PIXI.Texture[],
  cell: TerrainTile,
  u: number,
  tileX: number,
  tileY: number,
) {
  const key = fromCube(cell.loc);
  const availablePositions = treeSprites[key];
  const maxTrees = availablePositions.length;
  const desiredTrees = Math.floor(cell.terrain.forested / 4);
  const treeCount = Math.min(desiredTrees, maxTrees);
  const numBuildings = area !== undefined ? area.buildings.length : 0;
  const treePositions = availablePositions
    .slice(0, treeCount + numBuildings)
    .sort((a, b) => a.y - b.y);
  availablePositions.slice(treeCount + numBuildings).forEach((_, index) => {
    const data = mapSprites[fromCube(cell.loc)];
    const sprite = data.trees[index]; //actualTreeSprites.get(spriteKey);
    if (sprite) {
      if (numBuildings > 0) console.log({ index });
      //data.container.removeChild(sprite);
      //sprite.destroy();
    }
  });
  if (area !== undefined) {
    for (let i = treeCount; i < treeCount + numBuildings; i++) {
      treePositions[i].curr = area.buildings[i].buildingType;
    }
  }
  treePositions.forEach((pos, index) => {
    const data = mapSprites[fromCube(cell.loc)];
    if (!data.trees[index]) {
      const texture =
        index < treeCount ? fullTrees[pos.var] : buildingSheet[pos.curr];
      if (pos.curr) console.log(texture);
      const treeSprite = new PIXI.Sprite(texture);
      treeSprite.anchor.set(0.5, 0.8); // Anchor at bottom center of tree

      // Position relative to tile center
      const hexRadius = u * 0.8; // Approximate hex radius for positioning
      treeSprite.position.set(
        tileX + pos.x * hexRadius,
        tileY + pos.y * hexRadius * 0.7, // Slightly compress Y to fit hex better
      );

      // Scale trees appropriately
      const treeScale = index < treeCount ? u / 160 : u / 500; // Adjust scale as needed
      treeSprite.scale.set(treeScale, treeScale);

      // Add some random brightness variation
      const brightness = 0.9 + (pos.var % 10) * 0.01;
      const tintValue = Math.floor(brightness * 255);
      treeSprite.tint = (tintValue << 16) | (tintValue << 8) | tintValue;
      data.container.addChild(treeSprite);
      data.trees[index] = treeSprite;
    }
  });

  //console.log(currentCount++);
}
export function getTreePositions(
  fullTrees: PIXI.Texture[],
  cell: TerrainTile,
): TreeCoord[] {
  const positions: TreeCoord[] = [];

  // Use tile coordinates as seed for deterministic randomness
  let seed = (cell.loc.q * 73856093) ^ (cell.loc.r * 19349663);

  // Simple LCG for deterministic pseudo-random numbers
  function seededRandom() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  // Create evenly distributed positions using a grid pattern with slight jitter
  // We'll use an 8x8 grid (64 cells) and take 50 of them
  const gridSize = 8; // Number of rows/columns

  // Calculate spacing between grid points
  const spacing = 2.0 / (gridSize + 1); // Spread across -1 to 1 range with padding

  // Generate grid positions
  const gridPositions: TreeCoord[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Base position on grid
      const baseX = -1 + spacing + col * spacing;
      const baseY = -1 + spacing + row * spacing;

      // Add small random jitter for natural look (max 30% of spacing)
      const jitterAmount = spacing * 0.3;
      const jitterX = (seededRandom() - 0.5) * jitterAmount;
      const jitterY = (seededRandom() - 0.5) * jitterAmount;

      const x = baseX + jitterX;
      const y = baseY + jitterY;

      // Check if position is within hexagon bounds (approximate)
      const distance = Math.sqrt(x * x + y * y);
      if (distance <= 2.0) {
        gridPositions.push({
          x: x,
          y: y,
          var: gridPositions.length % fullTrees.length,
          curr: "",
        });
      }
    }
  }

  // Shuffle and take first 50
  shuffle(gridPositions);
  for (let i = 0; i < Math.min(50, gridPositions.length); i++) {
    positions.push(gridPositions[i]);
  }

  // If we don't have enough positions within the hex, fill remaining with fallback
  while (positions.length < 50) {
    const angle = seededRandom() * Math.PI * 2;
    const distance = Math.sqrt(seededRandom()) * 1; // Keep within hex bounds
    positions.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      var: positions.length % fullTrees.length,
      curr: "",
    });
  }

  return positions;
}
