import { type BuildingType, buildingTypes } from "$lib/data/buildings";
import { recordLoop } from "$lib/util/recordLoop";
import * as PIXI from "pixi.js";
export async function loadTilesheet() {
  async function loadAsset(fn: string) {
    return new PIXI.Texture({
      source: await PIXI.Assets.load(`sprites/${fn}.png`),
    });
  }
  const tilesheet = {
    Plains: await loadAsset("Plain"),
    Water: await loadAsset("Water"),
    Mountain: await loadAsset("Mountain"),
    "mountain peak": await loadAsset("Mountain Peak"),
    Hill: await loadAsset("Hill"),
    Farm: await loadAsset("Farm"),
    "wooded plain": await loadAsset("Hex - Sparse Trees (lush) 1"),
    "forested plain": await loadAsset("Hex - Forest, deciduous (lush)"),
    "mountain medium": await loadAsset("Hex - Mountains, medium (lush)"),
    sand: await loadAsset("Hex - Plains (desert) 5"),
  };
  const baseBuildings = await PIXI.Assets.load(`icons/buildings/buildings.png`);
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
  return { tilesheet, fullTrees, buildingSheet };
}
