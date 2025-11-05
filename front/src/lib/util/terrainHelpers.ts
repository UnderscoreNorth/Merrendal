import { type Cube, type TerrainTile } from "$lib/map/generation";

export const directions = [
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 1],
  [-1, 0],
  [-1, 1],
];
export function changeDirection(dir: number, angle: number) {
  dir = dir + angle;
  if (dir > 5) dir -= 6;
  if (dir < 0) dir += 6;
  return dir;
}

export function shuffle(array: Array<any>) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

export function fromCube(c: Cube) {
  return `${c.q},${c.s},${c.r}`;
}
export function toCube(qsr: string): Cube {
  let split = qsr.split(",").map((i) => parseInt(i));
  let sum = split.reduce((a, b) => a + b, 0);
  if (sum !== 0) throw `${qsr} needs to sum to zero`;
  if (split.length !== 3) throw `${qsr} must be 3 components`;
  return {
    q: split[0],
    s: split[1],
    r: split[2],
  };
}
export function makeCube({
  q,
  s,
  r,
}: {
  q?: number;
  s?: number;
  r?: number;
}): Cube {
  let cube: Cube = { q: 0, s: 0, r: 0 };
  if (r == undefined && q !== undefined && s !== undefined)
    cube = {
      q,
      s,
      r: -q - s,
    };
  if (r !== undefined && q == undefined && s !== undefined)
    cube = {
      s,
      r,
      q: -s - r,
    };
  if (r !== undefined && q !== undefined && s == undefined)
    cube = {
      q,
      r,
      s: -q - r,
    };
  return cube;
}
export function direction(cood: Cube, dir: number) {
  if (dir == 0) {
    cood.s++;
    cood.r--;
  } else if (dir == 1) {
    cood.q++;
    cood.r--;
  } else if (dir == 2) {
    cood.q++;
    cood.s--;
  } else if (dir == 3) {
    cood.r++;
    cood.s--;
  } else if (dir == 4) {
    cood.q--;
    cood.r++;
  } else {
    cood.q--;
    cood.s++;
  }
  return cood;
}

export function getNeighboringCubes(cube: Cube): Cube[] {
  const neighbors: Cube[] = [];
  // Get all 6 neighboring hexagonal tiles
  for (let dir = 0; dir < 6; dir++) {
    const neighbor = direction({ ...cube }, dir);
    neighbors.push(neighbor);
  }
  return neighbors;
}

export function rotateCubeCoordinates(cube: Cube, rotations: number): Cube {
  // Rotate cube coordinates by 60 degrees clockwise (rotations times)
  // For hexagonal grids, rotating 60° clockwise: (q, r, s) -> (-s, -q, -r)
  let result = { ...cube };

  for (let i = 0; i < rotations; i++) {
    const temp = result;
    result = {
      q: -temp.r,
      r: -temp.s,
      s: -temp.q,
    };
  }

  return result;
}

/**
 * Calculate the distance between two cube coordinates
 */
function cubeDistance(a: Cube, b: Cube): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
}

/**
 * Get the effective height of a tile including terrain elevation and forest coverage
 */
function getEffectiveHeight(tile: TerrainTile): number {
  if (tile.terrain.elevation < 0) return -1;
  return tile.terrain.elevation + tile.terrain.forested * 0.05;
}

/**
 * Interpolate between two cubes to get all tiles along a line
 */
function lineCubes(start: Cube, end: Cube): Cube[] {
  const distance = cubeDistance(start, end);
  const results: Cube[] = [];
  const ends = [fromCube(start), fromCube(end)];
  for (let i = 0; i <= distance; i++) {
    const t = distance === 0 ? 0 : i / distance;
    const q = start.q + (end.q - start.q) * t;
    const r = start.r + (end.r - start.r) * t;
    const s = start.s + (end.s - start.s) * t;

    // Round to nearest hex
    let cube = roundCube({ q, r, s });
    if (!ends.includes(fromCube(cube))) results.push(cube);
  }

  return results;
}

/**
 * Round fractional cube coordinates to the nearest hex
 */
function roundCube(cube: { q: number; r: number; s: number }): Cube {
  let q = Math.round(cube.q);
  let r = Math.round(cube.r);
  let s = Math.round(cube.s);

  const qDiff = Math.abs(q - cube.q);
  const rDiff = Math.abs(r - cube.r);
  const sDiff = Math.abs(s - cube.s);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  } else {
    s = -q - r;
  }

  return { q, r, s };
}

/**
 * Check if a tile is visible from a given coordinate, accounting for terrain curvature,
 * elevation changes, and forest coverage
 *
 * @param fromTile The tile we're viewing from
 * @param toTile The tile we're checking visibility for
 * @param tiles Record of all tiles in the map
 * @returns true if the tile is visible, false otherwise
 */
export function isVisibleFrom(
  fromTile: TerrainTile,
  toTile: TerrainTile,
  tiles: Record<string, TerrainTile>,
): boolean {
  const distance = cubeDistance(fromTile.loc, toTile.loc);

  // Can't see yourself
  if (distance === 0) return false;

  let fromHeight = fromTile.terrain.elevation;
  const toHeight = getEffectiveHeight(toTile);
  const lineTiles = lineCubes(fromTile.loc, toTile.loc);
  if (fromHeight >= toHeight) {
    fromHeight = Math.floor(fromHeight) + 1;
    let filteredTiles = lineTiles.filter((x, i) => {
      const oTile = tiles[fromCube(x)];
      let e = getEffectiveHeight(oTile);
      if (e < 0) e = -1;
      e += i * (0.2 / (fromHeight - oTile.terrain.elevation));
      if (e > fromHeight || e > toHeight + 1) return true;
      return false;
    });
    return !filteredTiles.length && distance <= (fromHeight - toHeight) * 5;
  } else {
    for (let i = 0; i < lineTiles.length; i++) {
      const oTile = tiles[fromCube(lineTiles[i])];
      let e = getEffectiveHeight(oTile);
      if (e >= toHeight) return false;
    }
    return distance / (Math.abs(fromHeight - toHeight) + 1) <= 3;
  }
}

/**
 * Get all tiles visible from a given coordinate, using a lazy cache
 *
 * @param fromTile The tile to check visibility from
 * @param tiles Record of all tiles in the map
 * @param viewMap Lazy cache for visibility results (populated on-demand)
 * @returns Array of visible tiles
 */
export function getVisibleTiles(
  fromTile: TerrainTile,
  tiles: Record<string, TerrainTile>,
  viewMap: Record<string, Record<string, boolean>>,
): TerrainTile[] {
  const fromKey = fromCube(fromTile.loc);

  // Initialize cache entry for this tile if it doesn't exist
  if (viewMap[fromKey] === undefined) {
    viewMap[fromKey] = {};
  }

  const visibleTiles: TerrainTile[] = [];

  // Calculate viewing distance for this specific tile
  const fromHeight = fromTile.terrain.elevation + fromTile.terrain.forested * 0.05;
  const maxDistance = Math.floor(3 + Math.sqrt(Math.max(0, fromHeight)) * 0.5) * 5;

  // Check all tiles, using cache when available
  for (const tileKey in tiles) {
    if (tileKey === fromKey) continue;

    // Check if we already have a cached result
    if (viewMap[fromKey][tileKey] !== undefined) {
      if (viewMap[fromKey][tileKey]) {
        visibleTiles.push(tiles[tileKey]);
      }
      continue;
    }

    const toTile = tiles[tileKey];

    // Quick distance check to skip distant tiles
    const dq = Math.abs(fromTile.loc.q - toTile.loc.q);
    const dr = Math.abs(fromTile.loc.r - toTile.loc.r);
    const ds = Math.abs(fromTile.loc.s - toTile.loc.s);

    // Early rejection if bounding box is too large
    if (dq > maxDistance || dr > maxDistance || ds > maxDistance) {
      viewMap[fromKey][tileKey] = false;
      continue;
    }

    const distance = (dq + dr + ds) / 2;
    if (distance > maxDistance) {
      viewMap[fromKey][tileKey] = false;
      continue;
    }

    // Perform the actual visibility check and cache the result
    const isVisible = isVisibleFrom(fromTile, toTile, tiles);
    viewMap[fromKey][tileKey] = isVisible;

    if (isVisible) {
      visibleTiles.push(toTile);
    }
  }

  return visibleTiles;
}
