import { type BuildingType, buildingTypes } from "$lib/data/buildings";
import { recordLoop } from "$lib/util/recordLoop";
import * as PIXI from "pixi.js";
export async function loadTilesheet() {
  async function loadAsset(fn: string) {
    return new PIXI.Texture({
      source: await PIXI.Assets.load(`/sprites/${fn}.png`),
    });
  }
  const tilesheet = {
    Plains: await loadAsset("Plain"),
    Water: await loadAsset("Water"),
    Mountain: await loadAsset("Mountain"),
    "mountain peak": await loadAsset("Mountain Peak"),
    Hill: await loadAsset("Hill"),
    farmland: await loadAsset("Hex - Urban - Farmland (lush) 1"),
    "wooded plain": await loadAsset("Hex - Sparse Trees (lush) 1"),
    "forested plain": await loadAsset("Hex - Forest, deciduous (lush)"),
    "mountain medium": await loadAsset("Hex - Mountains, medium (lush)"),
    sand: await loadAsset("Hex - Plains (desert) 5"),
  };
  const baseBuildings = await PIXI.Assets.load(
    `/icons/buildings/buildings.png`,
  );
  const buildingSheet: Record<string, PIXI.Texture> = {};
  for (const [building, data] of recordLoop(buildingTypes)) {
    buildingSheet[building] = new PIXI.Texture({
      source: baseBuildings.source,
      frame: new PIXI.Rectangle(data.icon.x * 256, data.icon.y * 256, 256, 256),
    });
  }
  const fullTrees = [];
  for (const fn of [
    "Extras/Foliage - Tree, deciduous 1 (lush)",
    "Extras/Foliage - Tree, deciduous 2 (lush)",
    "Extras/Foliage - Tree, deciduous 3 (lush)",
    "Extras/Foliage - Tree, deciduous 4 (lush)",
    "Extras/Foliage - Tree, deciduous 5 (lush)",
    "Extras/Foliage - Tree, deciduous 6 (lush)",
  ]) {
    fullTrees.push(await loadAsset(fn));
  }
  const halfTrees = [];
  for (const fn of [
    "Extras/Foliage - Bush 1 (lush)",
    "Extras/Foliage - Bush 2 (lush)",
    "Extras/Foliage - Bush 3 (lush)",
    "Extras/Foliage - Bush 4 (lush)",
    "Extras/Foliage - Bush 5 (lush)",
  ]) {
    halfTrees.push(await loadAsset(fn));
  }
  const riverTextures: Record<string, PIXI.Texture> = {};
  for (const [index, fn] of Object.entries({
    "0": "Hex - River 10 N",
    "1": "Hex - River 1 NE",
    "2": "Hex - River 1 SE",
    "3": "Hex - River 10 S",
    "03": "Hex - River 2 N",
    "14": "Hex - River 2 NE",
    "034": "Hex - River 3 N",
    "145": "Hex - River 3 NE",
    "125": "River 125 - 0",
    "04": "Hex - River 4 N",
    "15": "Hex - River 4 NE",
    "35": "Hex - River 4 S",
    "24": "Hex - River 4 SE",
    "12": "Hex - River 5 E",
    "01": "Hex - River 5 NE",
    "23": "Hex - River 5 SE",
    "023": "Hex - River 7 N",
    "013": "Hex - River 7 S",
    "025": "Hex - River 7 SE",
    "45": "River 45 - 0",
    "25": "River 25 - 0",
    "05": "River 05 - 0",
    "5": "Hex - River 10 NW",
    "124": "River 124 - 0",
    "02": "River 02 - 0",
    "4": "Hex - River 10 SW",
    "13": "River 13 - 0",
    "1345": "Hex - River 13 NE",
    "0245": "Hex - River 13 SE",
    "014": "River 014 - 0",
    "0124": "River 0124 - 0",
    "035": "River 035 - 0",
    "015": "Hex - River 11 N",
    "0234": "Hex - River 13 N",
    "245": "River 245 - 0",
    "0135": "Hex - River 13 S",
    "0134": "River 0134 - 0",
    "1245": "Hex - River 12 E",
    "235": "River 235 - 0",
  })) {
    riverTextures[index] = await loadAsset(fn);
  }
  return { tilesheet, riverTextures, halfTrees, fullTrees, buildingSheet };
}
