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

export function fromCube(c: Cube | TerrainTile) {
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
