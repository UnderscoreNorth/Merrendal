import type { Area, ProjectType } from "$lib/data/areas";
import type { Building } from "$lib/data/buildings";
import type { ItemRecord } from "$lib/data/items";
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
export type TerrainType = Area["terrain"]["topography"];
export class TerrainTile implements Area {
  public areaID: string;
  public acres: number;
  public buildings: Building[];
  public yieldEff: ItemRecord;
  public arableLand: number;
  public currentProjects: ProjectType[];
  public loc: Cube;
  public buildingLand: number;
  public terrain: {
    elevation: number;
    forested: number;
    topography: "Plains" | "Hill" | "Water" | "Mountain" | "Desert";
    river: string;
  };
  yields: ItemRecord;
  public groupID: string;
  public yield: number;
  constructor(
    elevation: number,
    q: number,
    s: number,
    r: number,
    type: TerrainType,
  ) {
    this.loc = {
      q,
      r,
      s,
    };
    this.terrain = {
      elevation,
      topography: type,
      forested: 0,
      river: "",
    };
    ((this.yields = {}), (this.currentProjects = []));
    this.arableLand = 0;
    this.buildingLand = 0;
    this.yieldEff = {};
    this.buildings = [];
    this.groupID = "";
    this.yield = 0;
    this.areaID = fromCube(this.loc);
    this.acres = 4;
    if (q + s + r !== 0) {
      console.trace("yeah");
      throw `${q} ${s} ${r} is not a valid coord`;
    }
  }
  changeElevation(x: number) {
    if (this.terrain.elevation < 20) this.terrain.elevation += x * 1;
  }
}
export class Map {
  tiles: Record<string, TerrainTile>;
  land: Array<Cube>;
  Water: Array<Cube>;
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
  constructor(diameter: number, islandNames: string[]) {
    this.tiles = {};
    this.diameter = diameter;
    this.land = [];
    this.Water = [];
    this.islands = {};
    this.lakes = {};
    this.ranges = {};
    this.ocean = [];
    this.center = { q: 0, s: 0, r: 0 };

    //Init gen - optimized to reduce fromCube calls
    for (let q = -diameter; q <= diameter; q++) {
      for (let s = -diameter; s <= diameter; s++) {
        if (q + s > diameter || q + s < -diameter) continue;
        const r = -q - s;
        const key = fromCube({ q, s, r });
        this.tiles[key] = new TerrainTile(-3, q, s, r, "Water");
      }
    }
    //First land
    let numLand = 0;
    let attempt = 0;
    let minLand = 2; // + Math.random() * 0.5;
    let MountainChance = 0;
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
      for (let i = -2; i < 8; i++) {
        this.lifted = [];
        this.raiseGround(cood, startingLimit, 0.95, -1, i);
      }
      //Mountains
      let mountain = false;
      if (Math.random() > MountainChance) {
        mountain = true;
        MountainChance += 0.2;
        let rangeLength = rollRange(6, Math.floor(this.diameter * 1.75));
        console.log({ rangeLength });
        if (rangeLength <= 5) {
          let MountainHeight = rollRange(16, 20);
          this.lifted = [];
          this.tiles[fromCube(cood)].terrain.elevation = MountainHeight;
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
            let MountainHeight = rollRange(16, 20);
            this.tiles[fromCube(cood)].terrain.elevation = MountainHeight - 1;
            this.raiseGround(cood, 1, rollRange(0, 4) / 10, -1, MountainHeight);
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
      //Cleaning up some of the lonely Water tiles
      const tileKeys = Object.keys(this.tiles);
      for (let i = 0; i < tileKeys.length; i++) {
        const qsr = tileKeys[i];
        const tile = this.tiles[qsr];
        const ring = this.getRing(tile.loc.q, tile.loc.s, tile.loc.r, 1);
        if (tile.terrain.elevation >= 0) continue;
        let nearbyLand = 0;
        for (let j = 0; j < ring.length; j++) {
          if (ring[j].terrain.elevation >= 0) nearbyLand++;
        }
        if (nearbyLand === 6) {
          tile.terrain.elevation++;
        }
      }

      this.land = [];
      this.Water = [];
      for (let i = 0; i < tileKeys.length; i++) {
        const qsr = tileKeys[i];
        const tile = this.tiles[qsr];
        const elevation = tile.terrain.elevation;
        if (elevation >= 0) {
          const topography = elevation <= 15 ? "Plains" : "Mountain";
          this.tiles[qsr] = new TerrainTile(
            elevation,
            tile.loc.q,
            tile.loc.s,
            tile.loc.r,
            topography,
          );
          this.land.push(tile.loc);
          numLand++;
        } else {
          this.Water.push(tile.loc);
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
      attempt < 50
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
      if (ne.terrain.topography !== "Water") sides.ne.push(ne);
      const e = this.tiles[fromCube(makeCube({ q: this.diameter, s: -i }))];
      if (e.terrain.topography !== "Water") sides.e.push(e);
      const se = this.tiles[fromCube(makeCube({ s: -this.diameter, r: i }))];
      if (se.terrain.topography !== "Water") sides.se.push(se);
      const sw = this.tiles[fromCube(makeCube({ r: this.diameter, q: -i }))];
      if (sw.terrain.topography !== "Water") sides.sw.push(sw);
      const w = this.tiles[fromCube(makeCube({ q: -this.diameter, r: i }))];
      if (w.terrain.topography !== "Water") sides.w.push(w);
      const nw = this.tiles[fromCube(makeCube({ s: this.diameter, r: -i }))];
      if (nw.terrain.topography !== "Water") sides.nw.push(nw);
    }
    const sortedSides = recordLoop(sides).sort(
      (a, b) => b[1].length - a[1].length,
    );
    this.lifted = [];
    for (const tile of sortedSides[0][1]) {
      const MountainHeight = rollRange(14, 20);
      tile.terrain.elevation = MountainHeight;
      tile.terrain.topography = "Mountain";
      this.raiseNearby(tile.loc, MountainHeight);
    }
    for (let i = 1; i <= 5; i++) {
      for (const tile of sortedSides[i][1]) {
        tile.terrain.elevation = -1;
        tile.terrain.topography = "Water";
        for (let j = 1; j < rollRange(3, 5); j++) {
          for (const oTile of this.getRing(
            tile.loc.q,
            tile.loc.s,
            tile.loc.r,
            j,
          )) {
            if (oTile !== undefined) {
              if (oTile.terrain.elevation >= 0) {
                oTile.terrain.elevation = -1;
                oTile.terrain.topography = "Water";
              }
            }
          }
        }
      }
    }

    //Smoothing of cliffs
    for (const tile of Object.values(this.tiles)) {
      let elevation = tile.terrain.elevation;
      if (elevation < 3) continue;
      if (Math.random() > 0.7) continue;
      let lowerTiles: Array<{ dir: number; oTile: TerrainTile }> = [];
      const oTiles = this.getRing(tile.loc.q, tile.loc.s, tile.loc.r, 1);
      for (let i in oTiles) {
        const oTile = oTiles[i];
        if (elevation - oTile.terrain.elevation >= 4) {
          lowerTiles.push({ dir: Number(i), oTile });
        }
      }
      shuffle(lowerTiles);
      for (let i = 0; i < lowerTiles.length; i++) {
        const oTile = lowerTiles[i].oTile;
        oTile.terrain.elevation = elevation - (i == 0 ? 2 : 4);
      }
    }
    const tileKeys = Object.keys(this.tiles);
    this.land = [];
    this.Water = [];
    let numPlains = 0;
    let mountains: TerrainTile[] = [];
    for (let i = 0; i < tileKeys.length; i++) {
      const qsr = tileKeys[i];
      const tile = this.tiles[qsr];
      const elevation = tile.terrain.elevation;
      if (elevation >= 0) {
        const topography = elevation <= 10 ? "Plains" : "Mountain";
        if (topography == "Plains") {
          numPlains++;
        } else if (elevation > 15) {
          mountains.push(tile);
        }
        this.tiles[qsr].terrain.topography = topography;
        this.land.push(tile.loc);
        numLand++;
      } else {
        this.Water.push(tile.loc);
      }
    }
    //River generation
    shuffle(this.land);
    let riverTiles: TerrainTile[] = [];
    for (let i = 0; i < 20; i++) {
      let tile = this.tiles[fromCube(this.land[i])];
      let foundWater = false;
      let attempts = 0;
      this.lifted = [];
      do {
        riverTiles.push(tile);
        this.lifted.push(fromCube(tile.loc));
        tile.terrain.river = "init";
        const oTiles = this.getRing(
          tile.loc.q,
          tile.loc.s,
          tile.loc.r,
          1,
        ).filter(
          (i) =>
            !this.lifted.includes(fromCube(i.loc)) &&
            this.getRing(i.loc.q, i.loc.s, i.loc.r, 1).filter((j) =>
              this.lifted.includes(fromCube(j.loc)),
            ).length == 1,
        );
        foundWater = oTiles.some(
          (i) => i.terrain.topography == "Water" || i.terrain.river == "init",
        );
        if (oTiles.length == 0 || foundWater) break;
        shuffle(oTiles);
        if (
          oTiles.filter((o) => o.terrain.elevation < tile.terrain.elevation)
            .length == 0
        ) {
          let newTile = pick(oTiles);
          newTile.terrain.elevation = tile.terrain.elevation;
          newTile.terrain.topography =
            newTile.terrain.elevation <= 10 ? "Plains" : "Mountain";
          tile = newTile;
        } else {
          tile = oTiles.filter(
            (o) => o.terrain.elevation < tile.terrain.elevation,
          )[0];
        }
        for (const oTile of this.getRing(
          tile.loc.q,
          tile.loc.s,
          tile.loc.r,
          1,
        )) {
          if (oTile.terrain.elevation - tile.terrain.elevation > 5) {
            oTile.terrain.elevation = rollRange(
              tile.terrain.elevation,
              oTile.terrain.elevation,
            );
            oTile.terrain.topography =
              oTile.terrain.elevation <= 10 ? "Plains" : "Mountain";
          }
        }
        if (tile.terrain.river == "init") foundWater = true;
        attempts++;
      } while (!foundWater);
    }
    console.log("River length:", riverTiles.length);
    for (const n in riverTiles) {
      const tile = riverTiles[n];
      //tile.terrain.elevation = Math.round((Number(n) * 2) / riverTiles.length);
      tile.terrain.river = "";
      let hasWater = false;
      for (let i = 0; i < 6; i++) {
        let coords = direction(toCube(fromCube(tile.loc)), i);
        const oTile = this.tiles[fromCube(coords)];
        if (oTile == undefined) continue;
        if (
          oTile.terrain.river !== "" ||
          (oTile.terrain.topography == "Water" && !hasWater)
        ) {
          tile.terrain.river += i.toString();
          if (oTile.terrain.topography == "Water") hasWater = true;
        }
      }
    }
    //Determining Islands - optimized with Set for faster lookups
    console.log("Num of land tiles ", this.land.length);
    console.log("Num of plains ", numPlains);
    const ungroupedSet = new Set<string>();
    for (let i = 0; i < this.land.length; i++) {
      ungroupedSet.add(fromCube(this.land[i]));
    }
    const ungroupedArray = Array.from(ungroupedSet);
    shuffle(ungroupedArray);

    while (ungroupedArray.length > 0) {
      const qrs = ungroupedArray[0];
      const tile = this.tiles[qrs];
      tile.groupID = qrs;
      ungroupedSet.delete(qrs);
      ungroupedArray.shift();

      let d = 1;
      let found = false;
      do {
        found = false;
        const ringTiles = this.getRing(tile.loc.q, tile.loc.s, tile.loc.r, d);
        for (let i = 0; i < ringTiles.length; i++) {
          const neighbor = ringTiles[i];
          if (neighbor.terrain.elevation < 0 || neighbor.groupID !== "")
            continue;

          const innerRing = this.getRing(
            neighbor.loc.q,
            neighbor.loc.s,
            neighbor.loc.r,
            1,
          );
          let neighborGroup = 0;
          for (let j = 0; j < innerRing.length; j++) {
            if (innerRing[j].groupID === qrs) neighborGroup++;
          }

          if (neighborGroup > 0) {
            neighbor.groupID = qrs;
            found = true;
            const neighborKey = fromCube(neighbor.loc);
            ungroupedSet.delete(neighborKey);
            const idx = ungroupedArray.indexOf(neighborKey);
            if (idx !== -1) ungroupedArray.splice(idx, 1);
          }
        }
        d++;
      } while (found);

      do {
        found = false;
        for (let ringDist = 1; ringDist < d; ringDist++) {
          const ringTiles = this.getRing(
            tile.loc.q,
            tile.loc.s,
            tile.loc.r,
            ringDist,
          );
          for (let i = 0; i < ringTiles.length; i++) {
            const neighbor = ringTiles[i];
            if (neighbor.terrain.elevation < 0 || neighbor.groupID) continue;

            const innerRing = this.getRing(
              neighbor.loc.q,
              neighbor.loc.s,
              neighbor.loc.r,
              1,
            );
            let neighborGroup = 0;
            for (let j = 0; j < innerRing.length; j++) {
              if (innerRing[j].groupID === qrs) neighborGroup++;
            }

            if (neighborGroup > 0) {
              found = true;
              neighbor.groupID = qrs;
              const neighborKey = fromCube(neighbor.loc);
              ungroupedSet.delete(neighborKey);
              const idx = ungroupedArray.indexOf(neighborKey);
              if (idx !== -1) ungroupedArray.splice(idx, 1);
            }
          }
        }
      } while (found);
    }
    for (let qsr in this.tiles) {
      const tile = this.tiles[qsr];
      if (tile.groupID && tile.terrain.elevation >= 0) {
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
    const tileValues = Object.values(this.tiles);
    for (let i = 0; i < tileValues.length; i++) {
      const tile = tileValues[i];
      if (tile.terrain.topography !== "Water") continue;
      let neighborID = "";
      const ring = this.getRing(tile.loc.q, tile.loc.s, tile.loc.r, 1);
      for (let j = 0; j < ring.length; j++) {
        const neighbor = ring[j];
        if (
          neighbor.terrain.topography === "Water" &&
          neighbor.groupID !== ""
        ) {
          neighborID = neighbor.groupID;
          break;
        }
      }
      tile.groupID = neighborID || fromCube(tile.loc);
    }

    let change: boolean = false;
    let attempts = 0;
    do {
      change = false;
      for (let i = 0; i < tileValues.length; i++) {
        const tile = tileValues[i];
        if (tile.terrain.topography !== "Water") continue;
        let neighborID = "";
        const ring = this.getRing(tile.loc.q, tile.loc.s, tile.loc.r, 1);
        for (let j = 0; j < ring.length; j++) {
          const neighbor = ring[j];
          if (
            neighbor.terrain.topography === "Water" &&
            neighbor.groupID !== tile.groupID
          ) {
            neighborID = neighbor.groupID;
            break;
          }
        }
        if (neighborID) {
          const oldGroupID = tile.groupID;
          for (let k = 0; k < tileValues.length; k++) {
            if (tileValues[k].groupID === oldGroupID) {
              tileValues[k].groupID = neighborID;
            }
          }
          change = true;
        }
      }
      attempts++;
    } while (change === true && attempts < 100);
    for (let qsr in this.tiles) {
      const tile = this.tiles[qsr];
      if (tile.terrain.topography == "Water") {
        if (this.lakes[tile.groupID] == undefined)
          this.lakes[tile.groupID] = [];
        this.lakes[tile.groupID].push(qsr);
      }
    }

    this.ocean = Object.values(this.lakes).sort(
      (a, b) => b.length - a.length,
    )[0];
    console.log("Ocean size:", Object.keys(this.ocean).length);
    let found = false;
    let d = 0;
    do {
      const tiles = this.getRing(0, 0, 0, d);
      for (const tile of tiles) {
        if (tile.terrain.elevation >= 0) {
          found = true;
          this.center = { q: tile.loc.q, s: tile.loc.s, r: tile.loc.r };
        }
      }
      d++;
    } while (!found);
    //Beaches
    let numBeaches = 0; //rollRange(1, 3);
    this.lifted = [];
    shuffle(this.land);
    const oceanSet = new Set(this.ocean);
    for (let i = 0; i < this.land.length && numBeaches > 0; i++) {
      const cood = this.land[i];
      const tileKey = fromCube(cood);
      const tile = this.tiles[tileKey];
      if (tile.terrain.elevation !== 0) continue;

      const ring = this.getRing(cood.q, cood.s, cood.r, 1);
      let nearOcean = 0;
      for (let j = 0; j < ring.length; j++) {
        if (oceanSet.has(fromCube(ring[j].loc))) nearOcean++;
      }

      if (nearOcean > 0) {
        numBeaches--;
        this.spreadBeach(tile.loc, 0.99, "beach");
      }
    }

    numBeaches = rollRange(35, 50);
    this.lifted = [];
    shuffle(this.land);
    for (let i = 0; i < this.land.length && numBeaches > 0; i++) {
      const cood = this.land[i];
      const tileKey = fromCube(cood);
      const tile = this.tiles[tileKey];
      if (tile.terrain.elevation !== 0) continue;

      const ring = this.getRing(cood.q, cood.s, cood.r, 1);
      let nearOcean = 0;
      for (let j = 0; j < ring.length; j++) {
        if (oceanSet.has(fromCube(ring[j].loc))) nearOcean++;
      }

      if (nearOcean > 0) {
        numBeaches--;
        this.spreadBeach(tile.loc, 0.99, "land");
      }
    }
    console.log("Beaches generated");
    for (let cood of this.land) {
      const tile = this.tiles[fromCube(cood)];
      if (tile.terrain.elevation == 0) {
        tile.terrain.elevation = 0.5;
      } else if (tile.terrain.elevation == 0.5) {
        tile.terrain.elevation = 0;
      }
    }
    //Forests
    attempt = 0;
    this.lifted = [];
    do {
      attempt++;
      //console.log("Forest " + attempt);
      let cood = this.getRandomLandPoint("Plains");
      this.spreadTree(cood, 1, -1);
    } while (this.lifted.length < numPlains * 0.75);
    //console.log("Forests generated");

    const tilesToEvaluate = Object.keys(this.tiles);
    for (let idx = 0; idx < tilesToEvaluate.length; idx++) {
      this.tiles[tilesToEvaluate[idx]].yield = Math.random();
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
    const thisTile = this.tiles[fromCube(cood)];
    if (thisTile.terrain.elevation >= limit) return;
    thisTile.terrain.elevation = rollRange(
      Math.max(thisTile.terrain.elevation, limit - 4),
      limit,
    );
    this.lifted.push(fromCube(cood));
    const tiles = this.getRing(cood.q, cood.s, cood.r, 1, true);
    for (let i in tiles) {
      const tile = tiles[i];
      let chance = Math.random();
      if (parseInt(i) == direction) chance += 0.2;
      if (
        spread > chance &&
        !this.lifted.includes(fromCube(tile.loc)) &&
        tile.terrain.elevation < limit
      ) {
        spread *= Math.random() * decay + 0.7;
        if (spread > 1) spread = 1;
        this.raiseGround(
          tile.loc,
          spread,
          decay,
          parseInt(i),
          thisTile.terrain.elevation,
        );
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
      if (oTile.terrain.elevation < tile.terrain.elevation) {
        oTile.terrain.elevation = rollRange(
          oTile.terrain.elevation + 1,
          tile.terrain.elevation,
        );
        if (oTile.terrain.elevation >= 0) oTile.terrain.topography = "Plains";
        this.raiseNearby(oTile.loc, limit);
      }
    }
  }
  spreadBeach(cood: Cube, spread: number, type: "beach" | "land") {
    if (this.tiles[fromCube(cood)].terrain.elevation !== 0) return;
    let group = this.tiles[fromCube(cood)].groupID;
    this.tiles[fromCube(cood)] =
      type == "beach"
        ? new TerrainTile(0.5, cood.q, cood.s, cood.r, "Desert")
        : new TerrainTile(0.5, cood.q, cood.s, cood.r, "Plains");
    this.tiles[fromCube(cood)].groupID = group;
    this.lifted.push(fromCube(cood));
    for (let tile of this.getRing(cood.q, cood.s, cood.r, 1)) {
      let chance = Math.random();
      let nearByOcean = this.getRing(
        tile.loc.q,
        tile.loc.s,
        tile.loc.r,
        1,
      ).filter((oTile) => {
        if (this.ocean.includes(fromCube(oTile.loc))) return true;
        return false;
      }).length;
      //chance += 0.1 * nearByOcean;
      spread += 0.2 * nearByOcean;
      if (spread > chance && !this.lifted.includes(fromCube(tile.loc))) {
        spread -= 0.33;
        if (spread > 1) spread = 1;
        this.spreadBeach(tile.loc, spread, type);
      } else {
      }
    }
  }
  spreadTree(cood: Cube, spread: number, direction: number) {
    let tile = this.tiles[fromCube(cood)];
    if (!["Plains", "Mountain"].includes(tile.terrain.topography)) return;
    if (tile.terrain.topography == "Mountain")
      spread /= tile.terrain.elevation - 2;
    let group = this.tiles[fromCube(cood)].groupID;
    this.tiles[fromCube(cood)].terrain.forested = Math.pow(spread, 0.5) * 100;
    this.tiles[fromCube(cood)].groupID = group;
    this.lifted.push(fromCube(cood));
    const tiles = this.getRing(cood.q, cood.s, cood.r, 1);
    for (let i in tiles) {
      const tile = tiles[i];
      let chance = Math.random();
      if (parseInt(i) == direction) chance += 0.2;
      if (spread > chance && !this.lifted.includes(fromCube(tile.loc))) {
        spread *= Math.random() * 0.5 + 0.7;
        if (spread > 1) spread = 1;
        this.spreadTree(tile.loc, spread, parseInt(i));
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
        this.tiles[fromCube(tile)].terrain.topography == type || type == ""
          ? true
          : false;
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
      if (this.getDistance({ q: 0, r: 0, s: 0 }, arr[i].loc) > this.diameter) {
        delete this.tiles[fromCube(arr[i].loc)];
        arr.splice(i, 1);
      }
    }
    return arr;
  }
  addTile(q: number, s: number, r: number) {
    if (this.tiles[fromCube({ q, s, r })] == undefined)
      this.tiles[fromCube({ q, s, r })] = new TerrainTile(-3, q, s, r, "Water");
    return this.tiles[fromCube({ q, s, r })];
  }
}
