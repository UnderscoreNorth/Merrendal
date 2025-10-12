import { recordLoop } from "$lib/util/recordLoop";
import { pick, roll, rollRange } from "$lib/util/rolls";
import {
  changeDirection,
  direction,
  fromCube,
  makeCube,
  shuffle,
  toCube,
} from "../util/terrainHelpers";

export type Cube = {
  q: number;
  s: number;
  r: number;
};
export type TerrainType =
  | "plain"
  | "hill"
  | "mountain"
  | "sand"
  | "water"
  | "village"
  | "farmland";
export class TerrainTile {
  public type: TerrainType;
  public elevation: number;
  public groupID: string;
  public yield: number;
  public forested: number;
  public q: number;
  public s: number;
  public r: number;
  public river: string;
  constructor(
    elevation: number,
    q: number,
    s: number,
    r: number,
    type: TerrainType,
  ) {
    this.elevation = elevation;
    this.q = q;
    this.s = s;
    this.r = r;
    this.type = type;
    this.groupID = "";
    this.yield = 0;
    this.forested = 0;
    this.river = "";
    if (q + s + r !== 0) {
      console.trace("yeah");
      throw `${q} ${s} ${r} is not a valid coord`;
    }
  }
  changeElevation(x: number) {
    if (this.elevation < 7) this.elevation += x * 1;
  }
}
export class Map {
  tiles: Record<string, TerrainTile>;
  land: Array<Cube>;
  water: Array<Cube>;
  lifted: Array<string>;
  diameter: number;
  center: {
    q: number;
    s: number;
    r: number;
  };
  islands: Record<string, Array<string>>;
  lakes: Record<string, Array<string>>;
  ranges: Record<string, Array<string>>;
  ocean: Array<string>;
  villages: Array<TerrainTile>;
  farms: Array<TerrainTile>;
  lumberYards: Array<TerrainTile>;
  constructor(diameter: number, islandNames: string[]) {
    this.tiles = {};
    this.diameter = diameter;
    this.land = [];
    this.water = [];
    this.islands = {};
    this.lakes = {};
    this.ranges = {};
    this.ocean = [];
    this.villages = [];
    this.farms = [];
    this.lumberYards = [];
    this.center = { q: 0, s: 0, r: 0 };
    //Init gen
    for (let q = -diameter; q <= diameter; q++) {
      for (let s = -diameter; s <= diameter; s++) {
        if (q + s > diameter || q + s < -diameter) continue;
        this.tiles[fromCube({ q, s, r: -q - s })] = new TerrainTile(
          -3,
          q,
          s,
          -q - s,
          "water",
        );
      }
    }
    //First land
    let numLand = 0;
    let attempt = 0;
    let minLand = 2; // + Math.random() * 0.5;
    let mountainChance = 0;
    do {
      //console.log(`Terrain Generation Island: ${attempt}`);
      attempt++;
      numLand = 0;
      let q = rollRange(-diameter + 2, diameter - 2);
      let s = rollRange(
        -(Math.abs(diameter) - Math.abs(q)),
        Math.abs(diameter) - Math.abs(q),
      );
      let r = -q - s;
      let cood = { q, s, r };
      let startingLimit = rollRange(5, 10) / 10;
      //Land Lift
      for (let i = -3; i < 3; i++) {
        this.lifted = [];

        this.raiseGround(
          cood,
          startingLimit - Math.pow(i * 0.05, 2),
          0.5,
          -1,
          2,
        );
      }
      //Mountains
      if (Math.random() > mountainChance) {
        //mountainChance += 0.1;
        let rangeLength = rollRange(6, Math.floor(this.diameter * 1.75));
        console.log({ rangeLength });
        if (rangeLength <= 5) {
          let mountainHeight = rollRange(5, 7);
          this.lifted = [];
          this.tiles[fromCube(cood)].elevation = mountainHeight;
          this.raiseNearby(cood, 5);
        } else {
          let dir = rollRange(0, 5);
          let j = 0;
          do {
            this.lifted = [];
            j++;
            cood = direction(cood, dir);
            let edgeDistance = this.getDistance(cood, this.center);
            if (edgeDistance > this.diameter) break;
            let mountainHeight = rollRange(4, 5);
            this.tiles[fromCube(cood)].elevation = mountainHeight - 1;
            this.raiseGround(cood, 1, rollRange(0, 4) / 10, -1, mountainHeight);
            dir = changeDirection(
              dir,
              roll([
                [-1, 1],
                [0, 3],
                [1, 1],
              ]),
            );
          } while (j < rangeLength);
        }
      }
      //Cleaning up some of the lonely water tiles
      for (let qsr in this.tiles) {
        const tile = this.tiles[qsr];
        let nearbyLand = this.getRing(tile.q, tile.s, tile.r, 1).filter(
          (i) => i.elevation - 1 == tile.elevation,
        ).length;
        if (nearbyLand == 6 && Math.random() > 0.1) {
          this.tiles[qsr].elevation++;
        }
      }
      this.land = [];
      this.water = [];
      for (let qsr in this.tiles) {
        const tile = this.tiles[qsr];
        if (tile.elevation >= 0) {
          if (tile.elevation <= 2) {
            this.tiles[qsr] = new TerrainTile(
              tile.elevation,
              tile.q,
              tile.s,
              tile.r,
              "plain",
            );
          } else {
            this.tiles[qsr] = new TerrainTile(
              tile.elevation,
              tile.q,
              tile.s,
              tile.r,
              "mountain",
            );
          }
          this.land.push(toCube(qsr));
          numLand++;
        } else {
          this.water.push(toCube(qsr));
        }
      }
      console.log(
        "Land %: " +
          Math.round(
            (numLand /
              ((3 * Math.pow(this.diameter, 2) - 3 * this.diameter + 1) /
                minLand)) *
              100,
          ),
      );
    } while (
      numLand <
        (3 * Math.pow(this.diameter, 2) - 3 * this.diameter + 1) / minLand &&
      attempt < 2
    );
    //Cut off land except for one side
    let sides: Record<"ne" | "e" | "se" | "w" | "nw" | "sw", TerrainTile[]> = {
      ne: [],
      e: [],
      se: [],
      sw: [],
      w: [],
      nw: [],
    };
    for (let i = 0; i <= this.diameter; i++) {
      const ne = this.tiles[fromCube(makeCube({ r: -this.diameter, q: i }))];
      if (ne.type !== "water") sides.ne.push(ne);
      const e = this.tiles[fromCube(makeCube({ q: this.diameter, s: -i }))];
      if (e.type !== "water") sides.e.push(e);
      const se = this.tiles[fromCube(makeCube({ s: -this.diameter, r: i }))];
      if (se.type !== "water") sides.se.push(se);
      const sw = this.tiles[fromCube(makeCube({ r: this.diameter, q: -i }))];
      if (sw.type !== "water") sides.sw.push(sw);
      const w = this.tiles[fromCube(makeCube({ q: -this.diameter, r: i }))];
      if (w.type !== "water") sides.w.push(w);
      const nw = this.tiles[fromCube(makeCube({ s: this.diameter, r: -i }))];
      if (nw.type !== "water") sides.nw.push(nw);
    }
    const sortedSides = recordLoop(sides).sort(
      (a, b) => b[1].length - a[1].length,
    );
    this.lifted = [];
    for (const tile of sortedSides[0][1]) {
      const mountainHeight = rollRange(3, 5);
      tile.elevation = mountainHeight;
      tile.type = "mountain";
      this.raiseNearby(tile, mountainHeight);
    }
    for (let i = 1; i <= 5; i++) {
      for (const tile of sortedSides[i][1]) {
        tile.elevation = -1;
        tile.type = "water";
        if (Math.random() > 0.7) {
          for (const oTile of this.getRing(tile.q, tile.s, tile.r, 1)) {
            if (oTile !== undefined) {
              if (oTile.elevation >= 0) {
                oTile.elevation = -1;
                oTile.type = "water";
              }
            }
          }
        }
      }
    }
    //Valley creation
    let tile = this.getRandomLandPoint("mountain");
    let start = toCube(fromCube(tile));
    this.lifted = [];
    let dir = rollRange(0, 5);
    let initDir = dir;
    let riverTiles: TerrainTile[] = [];
    do {
      this.tiles[fromCube(tile)].type = "plain";
      this.tiles[fromCube(tile)].elevation = rollRange(1, 2);
      this.tiles[fromCube(tile)].river = "init";
      riverTiles.push(this.tiles[fromCube(tile)]);
      this.lifted.push(fromCube(tile));
      tile = direction(tile, dir);
      dir = changeDirection(
        dir,
        roll([
          [-1, 3],
          [0, 5],
          [1, 3],
        ]),
      );
    } while (this.tiles[fromCube(tile)]?.type == "mountain");
    dir = (initDir + 3) % 6;
    tile = start;
    do {
      this.tiles[fromCube(tile)].type = "plain";
      this.tiles[fromCube(tile)].elevation = rollRange(1, 2);
      this.tiles[fromCube(tile)].river = "init";
      riverTiles.unshift(this.tiles[fromCube(tile)]);
      this.lifted.push(fromCube(tile));
      tile = direction(tile, dir);
      dir = changeDirection(
        dir,
        roll([
          [-1, 3],
          [0, 5],
          [1, 3],
        ]),
      );
    } while (
      this.tiles[fromCube(tile)]?.type !== "water" &&
      this.tiles[fromCube(tile)] !== undefined
    );

    //Determining rivers
    for (const n in riverTiles) {
      const tile = riverTiles[n];
      tile.elevation = Math.round((Number(n) * 2) / riverTiles.length);
      tile.river = "";
      for (let i = 0; i < 6; i++) {
        let coords = direction(toCube(fromCube(tile)), i);
        const oTile = this.tiles[fromCube(coords)];
        if (oTile == undefined) continue;
        if (oTile.river !== "" || oTile.type == "water") {
          tile.river += i.toString();
        }
      }
    }
    //Determining Islands
    console.log("Num of land tiles ", Object.values(this.land).length);
    let ungrouped = [...this.land].map((i) => fromCube(i));
    shuffle(ungrouped);
    do {
      let qrs = ungrouped[0];
      const tile = this.tiles[qrs];
      tile.groupID = qrs;
      ungrouped.splice(ungrouped.indexOf(qrs), 1);
      let d = 1;
      let found = false;
      do {
        found = false;
        for (const neighbor of this.getRing(tile.q, tile.s, tile.r, d)) {
          const neighborGroup = this.getRing(
            neighbor.q,
            neighbor.s,
            neighbor.r,
            1,
          ).filter((i) => i.groupID == qrs).length;
          if (
            neighbor.elevation >= 0 &&
            neighbor.groupID == "" &&
            neighborGroup > 0
          ) {
            neighbor.groupID = qrs;
            found = true;
            ungrouped.splice(ungrouped.indexOf(fromCube(neighbor)), 1);
          }
        }
        d++;
      } while (found);
      do {
        found = false;
        for (let i = 1; i < d; i++) {
          for (const neighbor of this.getRing(tile.q, tile.s, tile.r, i)) {
            const neighborGroup = this.getRing(
              neighbor.q,
              neighbor.s,
              neighbor.r,
              1,
            ).filter((i) => i.groupID == qrs).length;
            if (
              neighbor.elevation >= 0 &&
              neighbor.groupID == undefined &&
              neighborGroup > 0
            ) {
              found = true;
              neighbor.groupID = qrs;
              ungrouped.splice(ungrouped.indexOf(fromCube(neighbor)), 1);
            }
          }
        }
      } while (found);
    } while (ungrouped.length);
    for (let qsr in this.tiles) {
      const tile = this.tiles[qsr];
      if (tile.groupID && tile.elevation >= 0) {
        if (this.islands[tile.groupID] == undefined)
          this.islands[tile.groupID] = [];
        this.islands[tile.groupID].push(qsr);
      }
    }
    shuffle(islandNames);
    let islands: Array<{ s: number; name: string }> = [];
    for (let name in this.islands) {
      let tiles = this.islands[name];
      islands.push({ s: tiles.length, name });
    }
    islands.sort((a, b) => {
      return b.s - a.s;
    });
    for (let i = 0; i < islands.length; i++) {
      let island = islands[i];
      let newName = "";
      if (islandNames.length && island.s >= 50) {
        newName = islandNames.splice(0, 1)[0];
      } else {
        newName = "--" + island.name;
      }
      this.islands[newName] = this.islands[island.name];
      for (const qsr of this.islands[newName]) {
        this.tiles[qsr].groupID = newName;
      }
      delete this.islands[island.name];
    }
    console.log(
      "Number of islands: " + Object.values(this.islands).map((i) => i.length),
    );
    //Determining Lakes
    ungrouped = [...this.water].map((i) => fromCube(i));

    /*do {
      let qrs = ungrouped[0];
      const tile = this.tiles[qrs];
      tile.groupID = qrs;
      ungrouped.splice(ungrouped.indexOf(qrs), 1);
      let d = 1;
      let found = false;
      do {
        found = false;
        for (const neighbor of this.getRing(tile.q, tile.s, tile.r, d)) {
          const neighborGroup = this.getRing(
            neighbor.q,
            neighbor.s,
            neighbor.r,
            1,
          ).filter((i) => i.groupID == qrs).length;
          if (
            neighbor.elevation < 0 &&
            neighbor.groupID == "" &&
            neighborGroup
          ) {
            neighbor.groupID = qrs;
            found = true;
            ungrouped.splice(ungrouped.indexOf(fromCube(neighbor)), 1);
          }
        }
        d++;
      } while (found);
    } while (ungrouped.length);*/
    for (const tile of Object.values(this.tiles)) {
      if (tile.type !== "water") continue;
      let neighborID = "";
      for (const neighbor of this.getRing(tile.q, tile.s, tile.r, 1)) {
        if (neighbor.type == "water" && neighbor.groupID !== "")
          neighborID = neighbor.groupID;
      }
      if (neighborID) {
        tile.groupID = neighborID;
      } else {
        tile.groupID = fromCube(tile);
      }
    }
    let change: boolean = false;
    let attempts = 0;
    do {
      change = false;
      for (const tile of Object.values(this.tiles)) {
        if (tile.type !== "water") continue;
        let neighborID = "";
        for (const neighbor of this.getRing(tile.q, tile.s, tile.r, 1)) {
          if (neighbor.type == "water" && neighbor.groupID !== tile.groupID) {
            neighborID = neighbor.groupID;
          }
        }
        if (neighborID) {
          for (const tile2 of Object.values(this.tiles)) {
            if (tile2.groupID == tile.groupID) tile2.groupID = neighborID;
          }
          change = true;
        }
      }
      attempts++;
    } while (change == true && attempts < 100);
    for (let qsr in this.tiles) {
      const tile = this.tiles[qsr];
      if (tile.type == "water") {
        if (this.lakes[tile.groupID] == undefined)
          this.lakes[tile.groupID] = [];
        this.lakes[tile.groupID].push(qsr);
      }
    }

    this.ocean = Object.values(this.lakes).sort(
      (a, b) => b.length - a.length,
    )[0];
    console.log("Ocean size:", Object.keys(this.ocean).length);
    console.log("# Lakes:", Object.keys(this.lakes));
    for (let i = 1; i < Object.values(this.lakes).length; i++) {
      const lakeTile = Object.values(this.lakes)[i][0];
      console.log(lakeTile);
    }
    let found = false;
    let d = 0;
    do {
      const tiles = this.getRing(0, 0, 0, d);
      for (const tile of tiles) {
        if (tile.elevation >= 0) {
          found = true;
          this.center = { q: tile.q, s: tile.s, r: tile.r };
        }
      }
      d++;
    } while (!found);
    //Beaches
    let numBeaches = 0; //rollRange(1, 3);
    this.lifted = [];
    shuffle(this.land);
    for (let cood of this.land) {
      if (numBeaches == 0) break;
      let tile = this.tiles[fromCube(cood)];
      let nearOcean = this.getRing(cood.q, cood.s, cood.r, 1).filter((i) =>
        this.ocean.includes(fromCube(i)),
      ).length;
      if (nearOcean && tile.elevation == 0) {
        numBeaches--;
        this.spreadBeach(tile, 0.99, "beach");
        if (numBeaches == 0) break;
      }
    }
    numBeaches = rollRange(35, 50);
    this.lifted = [];
    shuffle(this.land);
    for (let cood of this.land) {
      let tile = this.tiles[fromCube(cood)];
      let nearOcean = this.getRing(cood.q, cood.s, cood.r, 1).filter((i) =>
        this.ocean.includes(fromCube(i)),
      ).length;
      if (nearOcean && tile.elevation == 0) {
        numBeaches--;
        this.spreadBeach(tile, 0.99, "land");
        if (numBeaches == 0) break;
      }
    }
    console.log("Beaches generated");
    for (let cood of this.land) {
      const tile = this.tiles[fromCube(cood)];
      if (tile.elevation == 0) {
        tile.elevation = 0.5;
      } else if (tile.elevation == 0.5) {
        tile.elevation = 0;
      }
    }
    //Forests
    let minForests = rollRange(10, 15);
    attempt = 0;
    this.lifted = [];
    do {
      attempt++;
      //console.log("Forest " + attempt);
      let cood = this.getRandomLandPoint("plain");
      this.spreadTree(cood, 1, -1);
    } while (attempt < minForests);
    //console.log("Forests generated");

    for (let j in this.tiles) {
      let i = this.tiles[j];
      i.yield = Math.random();
    }
    let values: Record<string, number> = {};
    for (let j in this.tiles) {
      let i = this.tiles[j];
      if (i.type == "mountain" || i.type == "water") continue;
      values[j] = 0;
      let farmland = 0;
      let forests = 0;
      let hills = 0;
      let nearbyPlains = 0;
      for (let n = 1; n <= 5; n++) {
        for (let otherTile of this.getRing(i.q, i.s, i.r, n)) {
          const value = Math.pow(6 - n, 0.5);
          if (
            otherTile.forested < 30 &&
            otherTile.type == "plain" &&
            n == 1 &&
            otherTile.yield > 0.7
          )
            nearbyPlains++;
          if (
            otherTile.type == "plain" &&
            otherTile.forested < 30 &&
            otherTile.yield > 0.7
          )
            farmland += value;
          if (otherTile.forested > 70) forests += value;
          if (Math.round(otherTile.elevation) > 2 && otherTile.yield > 0.7)
            hills += value;
        }
      }
      if (farmland && forests && hills && nearbyPlains >= 2)
        values[j] =
          Math.pow(farmland, 1.25) +
          Math.pow(forests, 1.1) +
          Math.pow(hills, 1);
    }
    let tileValuesSorted = Object.entries(values).sort((a, b) => b[1] - a[1]);
    let bestTile = this.tiles[tileValuesSorted[0][0]];
    bestTile.type = "village";
    bestTile.forested = 0;
    this.villages.push(bestTile);
    let numFarms = rollRange(1, 1);
    let numLumberyards = rollRange(1, 1);
    for (let n = 1; n <= 5; n++) {
      for (let otherTile of this.getRing(
        bestTile.q,
        bestTile.s,
        bestTile.r,
        n,
      )) {
        if (
          otherTile.type == "plain" &&
          otherTile.forested < 30 &&
          otherTile.yield > 0.7 &&
          numFarms > 0
        ) {
          otherTile.type = "farmland";
          this.farms.push(otherTile);
          numFarms--;
        }
        if (
          otherTile.type == "plain" &&
          otherTile.forested > 70 &&
          numLumberyards > 0
        ) {
          this.lumberYards.push(otherTile);
          numLumberyards--;
        }
      }
    }
  }
  getEdgeDistance(x: number, y: number) {
    return (
      this.diameter / 2 -
      Math.max(Math.abs(this.diameter / 2 - x), Math.abs(this.diameter / 2 - y))
    );
  }

  raiseGround(
    cood: Cube,
    spread: number,
    decay: number,
    direction: number,
    limit: number,
  ) {
    if (this.tiles[fromCube(cood)].elevation >= limit) return;
    let edgeDistance = this.getDistance(cood, this.center);
    this.tiles[fromCube(cood)].changeElevation(1);
    this.lifted.push(fromCube(cood));
    const tiles = this.getRing(cood.q, cood.s, cood.r, 1, true);
    for (let i in tiles) {
      const tile = tiles[i];
      let chance = Math.random();
      if (parseInt(i) == direction) chance += 0.2;
      if (
        spread > chance &&
        !this.lifted.includes(fromCube(tile)) &&
        tile.elevation < limit
      ) {
        spread *= Math.random() * decay + 0.7;
        if (edgeDistance > this.diameter) {
          spread *= (edgeDistance - this.diameter) / 3;
        }
        if (spread > 1) spread = 1;
        this.raiseGround(tile, spread, decay, parseInt(i), limit);
      }
    }
  }
  raiseNearby(cood: Cube, limit: number) {
    limit--;
    if (limit == 0) return;
    if (this.lifted.includes(fromCube(cood))) return;
    this.lifted.push(fromCube(cood));
    let tile = this.tiles[fromCube(cood)];
    for (const oTile of this.getRing(cood.q, cood.s, cood.r, 1)) {
      if (oTile.elevation < tile.elevation) {
        oTile.elevation = rollRange(tile.elevation - 1, tile.elevation);
        if (oTile.elevation >= 0)
          oTile.type = oTile.elevation >= 3 ? "mountain" : "plain";
        this.raiseNearby(oTile, limit);
      }
    }
  }
  spreadBeach(cood: Cube, spread: number, type: "beach" | "land") {
    if (this.tiles[fromCube(cood)].elevation !== 0) return;
    let group = this.tiles[fromCube(cood)].groupID;
    this.tiles[fromCube(cood)] =
      type == "beach"
        ? new TerrainTile(0.5, cood.q, cood.s, cood.r, "sand")
        : new TerrainTile(0.5, cood.q, cood.s, cood.r, "plain");
    this.tiles[fromCube(cood)].groupID = group;
    this.lifted.push(fromCube(cood));
    for (let tile of this.getRing(cood.q, cood.s, cood.r, 1)) {
      let chance = Math.random();
      let nearByOcean = this.getRing(tile.q, tile.s, tile.r, 1).filter(
        (oTile) => {
          if (this.ocean.includes(fromCube(oTile))) return true;
          return false;
        },
      ).length;
      //chance += 0.1 * nearByOcean;
      spread += 0.2 * nearByOcean;
      if (spread > chance && !this.lifted.includes(fromCube(tile))) {
        spread -= 0.33;
        if (spread > 1) spread = 1;
        this.spreadBeach(tile, spread, type);
      } else {
      }
    }
  }
  spreadTree(cood: Cube, spread: number, direction: number) {
    let tile = this.tiles[fromCube(cood)];
    if (!["plain", "mountain"].includes(tile.type)) return;
    if (tile.type == "mountain") spread /= tile.elevation - 2;
    let group = this.tiles[fromCube(cood)].groupID;
    this.tiles[fromCube(cood)].forested = Math.pow(spread, 0.5) * 100;
    this.tiles[fromCube(cood)].groupID = group;
    this.lifted.push(fromCube(cood));
    const tiles = this.getRing(cood.q, cood.s, cood.r, 1);
    for (let i in tiles) {
      const tile = tiles[i];
      let chance = Math.random();
      if (parseInt(i) == direction) chance += 0.2;
      if (spread > chance && !this.lifted.includes(fromCube(tile))) {
        spread *= Math.random() * 0.5 + 0.7;
        if (spread > 1) spread = 1;
        this.spreadTree(tile, spread, parseInt(i));
      } else {
      }
    }
  }

  getRandomLandPoint(type: "" | TerrainType = ""): Cube {
    let attempts = 0;
    let islandSize = 0;
    let cood = this.center;
    let rightType = false;
    do {
      let tile = this.land.sort(() => Math.random() - 0.5)[0];
      rightType =
        this.tiles[fromCube(tile)].type == type || type == "" ? true : false;
      cood = {
        q: tile.q,
        r: tile.r,
        s: tile.s,
      };
      islandSize =
        this.islands[this.tiles[fromCube(cood)].groupID]?.length ?? 0;
      attempts++;
    } while (
      islandSize < 50 &&
      attempts < 100 &&
      this.getDistance(cood, this.center) <= this.diameter &&
      !rightType
    );
    return cood;
    //if (islandSize > 50) return cood;
    //return this.center;
  }

  getDistance(
    from: { q: number; s: number; r: number },
    to: { q: number; s: number; r: number },
  ) {
    return (
      (Math.abs(from.q - to.q) +
        Math.abs(from.s - to.s) +
        Math.abs(from.r - to.r)) /
      2
    );
  }
  getTilesBetween(
    from: { q: number; s: number; r: number },
    to: { q: number; s: number; r: number },
  ) {
    let qDiff = from.q - to.q;
    let sDiff = from.s - to.s;
    let rDiff = from.r - to.r;
    let tiles: Array<TerrainTile> = [];
    let d = this.getDistance(from, to);
    for (let i = 1; i <= d; i += 0.1) {
      let q = Math.round(from.q - (qDiff * i) / d);
      let s = Math.round(from.s - (sDiff * i) / d);
      let r = -q - s;
      let tile = this.addTile(q, s, r);
      if (!tiles.includes(tile)) tiles.push(tile);
    }
    return tiles;
  }
  getRing(
    q: number,
    s: number,
    r: number,
    distance: number,
    ignoreLimit = false,
  ): TerrainTile[] {
    let arr: TerrainTile[] = [];
    for (let d of [distance, distance * -1]) {
      for (let i = 0; Math.abs(i) <= Math.abs(d); i += d / Math.abs(d)) {
        let tile = this.addTile(q + d, s - i, r + i - d);
        if (!arr.includes(tile)) arr.push(tile);
        tile = this.addTile(q + d - i, s + i, r - d);
        if (!arr.includes(tile)) arr.push(tile);
        tile = this.addTile(q - i, s + d, r - d + i);
        if (!arr.includes(tile)) arr.push(tile);
      }
    }
    for (let i = arr.length - 1; i >= 0; i--) {
      if (this.getDistance({ q: 0, r: 0, s: 0 }, arr[i]) > this.diameter) {
        delete this.tiles[fromCube(arr[i])];
        arr.splice(i, 1);
      }
    }
    return arr;
  }
  addTile(q: number, s: number, r: number) {
    if (this.tiles[fromCube({ q, s, r })] == undefined)
      this.tiles[fromCube({ q, s, r })] = new TerrainTile(-3, q, s, r, "water");
    return this.tiles[fromCube({ q, s, r })];
  }
}
