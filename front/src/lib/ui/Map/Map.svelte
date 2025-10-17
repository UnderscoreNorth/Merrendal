<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as PIXI from "pixi.js";
  import { game, map, openModals, view } from "$lib/stores";
  import type { TerrainTile } from "../../map/generation";
  import { fromCube, shuffle } from "$lib/util/terrainHelpers";
  import { drawTrees, getTreePositions, type TreeCoord } from "./drawTrees";
  import { loadTilesheet } from "./init";

  let h: number;
  let container: HTMLDivElement;
  let app: PIXI.Application;
  let mapContainer: PIXI.Container;
  let mapSprites: Record<
    string,
    { container: PIXI.Container; tile: PIXI.Sprite; trees: PIXI.Sprite[] }
  > = {};
  let treeSprites: Record<string, TreeCoord[]> = {};
  let isMapBuilt = false;
  let tilesheet: Record<string, PIXI.Texture> = {};
  let buildingSheet: Record<string, PIXI.Texture> = {};
  let fullTrees: PIXI.Texture[] = [];
  let riverTextures: Record<string, PIXI.Texture> = {};
  let tilesheetLoaded = false;
  let season = "";
  let lakes: Set<string> = new Set();

  function getTileTexture(cell: TerrainTile): PIXI.Texture | null {
    if (!tilesheetLoaded) return null;
    let tileName: keyof typeof tilesheet = cell.terrain.topography;
    if (Math.round(cell.terrain.elevation) > 4) {
      tileName = "mountain peak";
    } else if (Math.round(cell.terrain.elevation) > 3) {
      tileName = "mountain medium";
    }
    if (!tileName || !tilesheet[tileName]) {
      console.warn(`No texture found for terrain type: ${tileName}`);
      return null;
    }

    return tilesheet[tileName];
  }

  function drawTile(cell: TerrainTile, u: number) {
    let data = mapSprites[fromCube(cell.loc)];
    let sprite = data?.tile;
    if (sprite && isMapBuilt) {
      return;
    }

    const texture = getTileTexture(cell);
    if (!texture) return;
    let elevation = cell.terrain.elevation;
    if (elevation < 0) {
      elevation = 0;
    } else {
      elevation += 0.5;
    }
    if (cell.terrain.topography == "Mountain") elevation -= 0.5;

    const x = u * ((3 * cell.loc.q) / 2);
    const y =
      u *
      ((Math.sqrt(3) * cell.loc.q) / 2 +
        Math.sqrt(3) * cell.loc.r -
        elevation * 0.2) *
      0.75;
    const seed = (cell.loc.q * 73856093) ^ (cell.loc.r * 19349663);
    const shouldFlip = seed % 2 === 0;
    const xScale = ((shouldFlip ? 1 : -1) * (u * 2)) / 240;
    const yScale = (u * 2) / 310;
    if (!sprite) {
      sprite = new PIXI.Sprite(texture);
      mapSprites[fromCube(cell.loc)] = {
        container: new PIXI.Container(),
        tile: sprite,
        trees: [],
      };
      data = mapSprites[fromCube(cell.loc)];
      data.container.eventMode = "static";
      data.container.hitArea = new PIXI.Circle(x, y + 2.2 * u, 3 * u);
      new PIXI.Polygon([]);
      data.container.on("pointerdown", () => {
        openArea(cell.loc.q, cell.loc.r, cell.loc.s);
      });
      data.container.on("mouseover", () => {
        const brightness = new PIXI.ColorMatrixFilter();
        brightness.brightness(1.5, false);
        data.container.filters = [brightness];
      });
      data.container.on("mouseleave", () => {
        data.container.filters = [];
      });
      mapContainer.addChild(data.container);
      sprite.anchor.set(0.5, 0.5);
      data.container.addChild(sprite);
      sprite.position.set(x, y);
      sprite.scale.set(xScale, yScale);
      let brightness = 1;
      if (cell.terrain.topography === "Water") {
        // Elevation ranges from -3 to 0 for water
        // Map to brightness: -3 (deepest) = 0.4, 0 (shallow) = 1.0
        brightness = 0.4 + ((cell.terrain.elevation + 3) / 3) * 0.6;
        //brightness = Array.from(lakes).indexOf(cell.groupID) / lakes.size;
        const tintValue = Math.floor(brightness * 255);
        sprite.tint = (tintValue << 16) | (tintValue << 8) | tintValue;
      } else if (!["farmland", "village"].includes(cell.terrain.topography)) {
        //brightness = 0.9 + (((seed % 5) + 1) / 5) * 0.1;
        brightness = 0.7 + cell.yield * 0.3;
        const tintValue = Math.floor(brightness * 255);
        sprite.tint = (tintValue << 16) | (tintValue << 8) | tintValue;
      } else {
        sprite.tint = 0xffffff; // Reset tint for non-water tiles
      }
      if (cell.terrain.river) {
        const texture = riverTextures[cell.terrain.river];
        const river = new PIXI.Sprite(texture);
        if (!texture) console.log(cell.terrain.river);
        river.anchor.set(0.5, 0.5);
        data.container.addChild(river);
        river.position.set(x, y);
        river.scale.set(Math.abs(xScale), yScale);
      }
    } else {
      sprite.position.set(x, y);
      sprite.scale.set(xScale, yScale);
    }
    // Draw trees on top of the base tile
    const area = $game.areas.find((i) => fromCube(i.loc) == fromCube(cell.loc));
    drawTrees(
      treeSprites,
      mapSprites,
      area,
      buildingSheet,
      fullTrees,
      cell,
      u,
      x,
      y,
    );
    const text = new PIXI.Text({
      text: `q:${cell.loc.q}, s:${cell.loc.s}, r:${cell.loc.r}`,
      style: {
        fontSize: 5,
        fill: "white",
        wordWrap: true,
        wordWrapWidth: 20,
      },
    });
    text.anchor.set(0.5, 0.5);
    text.position.set(x, y);
    //mapContainer.addChild(text);
  }
  function openArea(q: number, r: number, s: number) {
    const area = $game.areas.find(
      (a) => a.loc.q == q && a.loc.r == r && a.loc.s == s,
    );
    if (area !== undefined) $openModals["areaDetail"] = area;
  }

  function buildMap() {
    if (!app || !mapContainer || !tilesheetLoaded) return;
    console.time("building map");
    lakes = new Set();
    for (const tile of $map) {
      if (tile.terrain.topography == "Water") {
        lakes.add(tile.groupID);
      }
    }
    const u = $view.renderSize / (($game.mapSize * 4) / 2);
    for (const cell of $map) {
      drawTile(cell, u);
    }
    isMapBuilt = true;
    updateCamera();
    console.timeEnd("building map");
  }
  function initTrees() {
    for (const tile of $map) {
      treeSprites[fromCube(tile.loc)] = getTreePositions(fullTrees, tile);
    }
  }

  let animationFrameId: number | null = null;

  function updateCamera() {
    if (!mapContainer) {
      console.log("no map container");
      return;
    }
    //if (app.ticker) app.ticker.start();

    // Schedule camera update on next frame
    requestAnimationFrame(() => {
      mapContainer.scale.set($view.zoom);
      mapContainer.position.set(
        ($view.x + $view.xDiff) * $view.zoom + $view.renderSize / 2,
        ($view.y + $view.yDiff) * $view.zoom + $view.renderSize / 2,
      );
      //if (app.ticker) app.ticker.stop();
    });
  }

  onMount(async () => {
    app = new PIXI.Application();
    await app.init({
      width: window.innerWidth / 2,
      height: window.innerHeight / 2,
      backgroundColor: 0x05112e,
      resolution: window.devicePixelRatio || 1,
    });

    container.appendChild(app.canvas as HTMLCanvasElement);
    mapContainer = new PIXI.Container();
    app.stage.addChild(mapContainer);

    // Load tilesheet
    ({ fullTrees, tilesheet, riverTextures, buildingSheet } =
      await loadTilesheet());
    tilesheetLoaded = true;
    initTrees();
    buildMap();
    game.subscribe(() => {
      isMapBuilt = false;
      buildMap();
    });
    const unsubMap = map.subscribe(() => {
      isMapBuilt = false;
      buildMap();
    });

    const unsubView = view.subscribe(() => {
      updateCamera();
    });
    /*const unsubGame = game.subscribe((i) => {
      if (i.season !== season) {
        isMapBuilt = false;
        buildMap();
      }
    });*/

    return () => {
      unsubMap();
      unsubView();
      //unsubGame();
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  });

  onDestroy(() => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    for (const data of Object.values(mapSprites)) {
      data.container.destroy();
    }

    if (app) {
      app.destroy(true, { children: true, texture: true });
    }
  });

  function scroll(e: WheelEvent) {
    let zoom = $view.zoom;
    zoom -= (e.deltaY * zoom) / 1000;
    if (zoom < 1) zoom = 1;
    if (zoom > $game.mapSize / 10) zoom = $game.mapSize / 10;
    changeZoom(zoom);
  }
  let drag = false;
  let startX = 0;
  let startY = 0;
  let xDiff = 0;
  let yDiff = 0;
  let initTouchDistance = -1;
  let initZoom = 0;
  function doubleClick(e: MouseEvent) {
    let { zoom, x, y } = $view;
    zoom += 0.08;
    if (zoom < 1) zoom = 1;
    if (zoom > 3) zoom = 3;
    changeZoom(zoom);
  }
  function changeZoom(z: number) {
    view.update((v) => {
      let initOffset = (v.renderSize - v.renderSize / v.zoom) / 2;
      let afterOffset = (v.renderSize - v.renderSize / z) / 2;
      v.x += initOffset - afterOffset;
      v.y += initOffset - afterOffset;
      v.zoom = z;
      return v;
    });
  }
  function getPinchDistance(t: TouchList) {
    return Math.sqrt(
      Math.pow(t[0].clientX - t[1].clientX, 2) +
        Math.pow(t[0].clientY - t[1].clientY, 2),
    );
  }
  function dragStart(e: MouseEvent | TouchEvent) {
    if (e instanceof TouchEvent && e.targetTouches.length == 2) {
      initTouchDistance = getPinchDistance(e.targetTouches);
      initZoom = $view.zoom;
      drag = true;
      return;
    }
    drag = true;
    if (e instanceof MouseEvent) {
      startX = e.offsetX;
      startY = e.offsetY;
    } else {
      startX = e.targetTouches[0].clientX;
      startY = e.targetTouches[0].clientY;
    }
    let names = Array.from(document.getElementsByClassName("islandName"))
      .concat(Array.from(document.getElementsByClassName("gameBar")))
      .concat(
        Array.from(document.getElementsByTagName("char")),
      ) as HTMLDivElement[];
    for (const name of names) {
      name.style.pointerEvents = "none";
    }
  }
  function dragMove(e: MouseEvent | TouchEvent) {
    if (
      e instanceof TouchEvent &&
      e.targetTouches.length == 2 &&
      initTouchDistance >= 0
    ) {
      let zoom = $view.zoom;
      let d = getPinchDistance(e.targetTouches);
      zoom = (initZoom * d) / initTouchDistance;
      if (zoom < 1) zoom = 1;
      if (zoom > 3) zoom = 3;
      changeZoom(zoom);
      e.preventDefault();
      return;
    }
    let dragSpeed = $game.mapSize * 20 * $view.zoom;
    if (drag) {
      let offsetX =
        e instanceof MouseEvent ? e.offsetX : e.targetTouches[0].clientX;
      let offsetY =
        e instanceof MouseEvent ? e.offsetY : e.targetTouches[0].clientY;
      xDiff = ((offsetX - startX) / h) * dragSpeed;
      $view.xDiff = xDiff;
      yDiff = ((offsetY - startY) / h) * dragSpeed;
      $view.yDiff = yDiff;
    }
  }
  function dragEnd(e: MouseEvent | TouchEvent) {
    initTouchDistance = -1;
    if (drag) {
      drag = false;
      view.update((v) => {
        v.x += v.xDiff;
        v.y += v.yDiff;
        v.xDiff = 0;
        v.yDiff = 0;
        return v;
      });
      let names = Array.from(document.getElementsByClassName("islandName"))
        .concat(Array.from(document.getElementsByClassName("gameBar")))
        .concat(
          Array.from(document.getElementsByTagName("char")),
        ) as HTMLDivElement[];
      for (const name of names) {
        name.style.pointerEvents = "auto";
      }
    }
  }
</script>

<svelte:window
  on:resize={() => {
    isMapBuilt = false;
    buildMap();
  }} />
<div
  bind:this={container}
  bind:clientHeight={h}
  on:wheel={scroll}
  on:dblclick={doubleClick}
  on:mousemove={dragMove}
  on:mousedown={dragStart}
  on:mouseup={dragEnd}
  on:mouseleave={dragEnd}
  on:touchstart={dragStart}
  on:touchmove={dragMove}
  on:touchend={dragEnd}>
</div>

<style>
  div :global(canvas) {
    height: 100vh;
    width: 100vw;
  }
  :global(mapicon.glow svg) {
    position: relative;
    filter: drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.8));
    z-index: 1;
  }
  div {
    position: relative;
    height: min(100svh, 100vw);
  }
</style>
