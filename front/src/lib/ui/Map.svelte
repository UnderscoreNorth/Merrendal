<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as PIXI from "pixi.js";
  import { game, map, openModals, view } from "$lib/stores";
  import type { TerrainTile } from "../map/generation";
  import { fromCube, shuffle } from "$lib/util/terrainHelpers";
  import { dataset_dev } from "svelte/internal";

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
  let fullTrees: PIXI.Texture[] = [];
  let halfTrees: PIXI.Texture[] = [];
  let riverTextures: Record<string, PIXI.Texture> = {};
  let tilesheetLoaded = false;
  let season = "";
  let lakes: Set<string> = new Set();
  type TreeCoord = { x: number; y: number; var: number };

  // Tile names array - fill this in with your tile names in order
  const tileNames: string[] = [
    "plain",
    "wooded plain",
    "forested plain",
    "hill",
    "wooded hill",
    "mountain",
    "water",
    "ocean",
    "snow plain",
    "snow wooded plain",
    "snow forested plain",
    "snow hill",
    "snow forested hill",
    "sand",
    "village",
    "town",
    "city",
    "farmland",
    "snow water",
    "snow village",
    "snow Castle",
  ];

  async function loadTilesheet() {
    async function loadAsset(fn: string) {
      return new PIXI.Texture({
        source: await PIXI.Assets.load(`/sprites/${fn}.png`),
      });
    }
    try {
      tilesheet = {
        plain: await loadAsset("Hex - Plains (lush) 1"),
        water: await loadAsset("Hex - Water - Ocean (still water) 5"),
        mountain: await loadAsset("Hex - Mountains, foothills (lush)"),
        "mountain peak": await loadAsset("Hex - Mountains, peak (rocky)"),
        village: await loadAsset("Hex - Urban - Town (lush)"),
        farmland: await loadAsset("Hex - Urban - Farmland (lush) 1"),
        "wooded plain": await loadAsset("Hex - Sparse Trees (lush) 1"),
        "forested plain": await loadAsset("Hex - Forest, deciduous (lush)"),
        "mountain medium": await loadAsset("Hex - Mountains, medium (lush)"),
        sand: await loadAsset("Hex - Plains (desert) 5"),
      };
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
      for (const fn of [
        "Extras/Foliage - Bush 1 (lush)",
        "Extras/Foliage - Bush 2 (lush)",
        "Extras/Foliage - Bush 3 (lush)",
        "Extras/Foliage - Bush 4 (lush)",
        "Extras/Foliage - Bush 5 (lush)",
      ]) {
        halfTrees.push(await loadAsset(fn));
      }
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
      tilesheetLoaded = true;
    } catch (error) {
      console.error("Failed to load tilesheet:", error);
    }
  }
  function getTileTexture(cell: TerrainTile): PIXI.Texture | null {
    if (!tilesheetLoaded) return null;

    // Get the tile name based on terrain type (no forest variants)
    let tileName: keyof typeof tilesheet = cell.type;
    if (Math.round(cell.elevation) > 4) {
      tileName = "mountain peak";
    } else if (Math.round(cell.elevation) > 3) {
      tileName = "mountain medium";
    }
    // Remove forest-based tile selection - always use base tile
    /*if ($game.season == "Winter" && tilesheet["snow " + tileName])
      tileName = "snow " + tileName;*/
    if (!tileName || !tilesheet[tileName]) {
      console.warn(`No texture found for terrain type: ${tileName}`);
      return null;
    }

    return tilesheet[tileName];
  }

  // Generate deterministic tree positions for a tile
  function getTreePositions(cell: TerrainTile): TreeCoord[] {
    const positions: TreeCoord[] = [];

    // Use tile coordinates as seed for deterministic randomness
    let seed = (cell.q * 73856093) ^ (cell.r * 19349663);

    // Simple LCG for deterministic pseudo-random numbers
    function seededRandom() {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }
    // Place full trees first
    for (let i = 0; i < 50; i++) {
      const angle = seededRandom() * i;
      const distance = Math.pow(i / 50, 0.4); // Keep trees within hex bounds
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      positions.push({
        x: x,
        y: y,
        var: i % fullTrees.length,
      });
    }
    shuffle(positions);
    return positions;
  }
  // Create or update tree sprites for a tile
  function drawTrees(
    cell: TerrainTile,
    u: number,
    tileX: number,
    tileY: number,
  ) {
    const key = fromCube(cell);
    const availablePositions = treeSprites[key];
    const maxTrees = availablePositions.length;
    const desiredTrees = Math.floor(cell.forested / 2);
    const treeCount = Math.min(desiredTrees, maxTrees);
    const treePositions = availablePositions
      .slice(0, treeCount)
      .sort((a, b) => a.y - b.y);
    availablePositions.slice(treeCount).forEach((_, index) => {
      const data = mapSprites[fromCube(cell)];
      const sprite = data.trees[index]; //actualTreeSprites.get(spriteKey);
      if (sprite) {
        data.container.removeChild(sprite);
        sprite.destroy();
      }
    });
    treePositions.forEach((pos, index) => {
      const data = mapSprites[fromCube(cell)];
      if (!data.trees[index]) {
        const texture = fullTrees[pos.var];
        const treeSprite = new PIXI.Sprite(texture);
        treeSprite.anchor.set(0.5, 0.8); // Anchor at bottom center of tree

        // Position relative to tile center
        const hexRadius = u * 0.8; // Approximate hex radius for positioning
        treeSprite.position.set(
          tileX + pos.x * hexRadius,
          tileY + pos.y * hexRadius * 0.7, // Slightly compress Y to fit hex better
        );

        // Scale trees appropriately
        const treeScale = (u * 1.5) / 240; // Adjust scale as needed
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

  function drawTile(cell: TerrainTile, u: number) {
    const key = `${cell.q},${cell.r}`;
    let data = mapSprites[fromCube(cell)];
    let sprite = data?.tile;

    // If sprite already exists and map is built, skip redrawing
    if (sprite && isMapBuilt) {
      return;
    }

    const texture = getTileTexture(cell);
    if (!texture) return;
    // Calculate hex position (flat-top hexagon layout)
    let elevation = cell.elevation;
    if (elevation < 0) {
      elevation = 0;
    } else {
      elevation += 0.5;
    }
    if (cell.type == "mountain") elevation -= 0.5;

    const x = u * ((3 * cell.q) / 2);
    const y =
      u *
      ((Math.sqrt(3) * cell.q) / 2 + Math.sqrt(3) * cell.r - elevation * 0.2) *
      0.75;
    // Scale sprite to fit the hex size
    // Tiles are 32x40, we want them to fit in the hex
    // Randomly flip tiles horizontally for variety (50% chance)
    // Use deterministic randomness based on tile position
    const seed = (cell.q * 73856093) ^ (cell.r * 19349663);
    const shouldFlip = seed % 2 === 0;
    const xScale = ((shouldFlip ? 1 : -1) * (u * 2)) / 240;
    const yScale = (u * 2) / 310;
    if (!sprite) {
      sprite = new PIXI.Sprite(texture);
      mapSprites[fromCube(cell)] = {
        container: new PIXI.Container(),
        tile: sprite,
        trees: [],
      };
      data = mapSprites[fromCube(cell)];
      data.container.eventMode = "static";
      data.container.hitArea = new PIXI.Circle(x, y + 2.2 * u, 3 * u);
      new PIXI.Polygon([]);
      data.container.on("pointerdown", () => {
        $openModals["selectedCell"] = cell;
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
      if (cell.type === "water") {
        // Elevation ranges from -3 to 0 for water
        // Map to brightness: -3 (deepest) = 0.4, 0 (shallow) = 1.0
        brightness = 0.4 + ((cell.elevation + 3) / 3) * 0.6;
        //brightness = Array.from(lakes).indexOf(cell.groupID) / lakes.size;
        const tintValue = Math.floor(brightness * 255);
        sprite.tint = (tintValue << 16) | (tintValue << 8) | tintValue;
      } else if (!["farmland", "village"].includes(cell.type)) {
        //brightness = 0.9 + (((seed % 5) + 1) / 5) * 0.1;
        brightness = 0.7 + cell.yield * 0.3;
        const tintValue = Math.floor(brightness * 255);
        sprite.tint = (tintValue << 16) | (tintValue << 8) | tintValue;
      } else {
        sprite.tint = 0xffffff; // Reset tint for non-water tiles
      }
      if (cell.river) {
        const texture = riverTextures[cell.river];
        const river = new PIXI.Sprite(texture);
        if (!texture) console.log(cell.river);
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
    drawTrees(cell, u, x, y);
    const text = new PIXI.Text({
      text: `q:${cell.q}, s:${cell.s}, r:${cell.r}`,
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

  function buildMap() {
    if (!app || !mapContainer || !tilesheetLoaded) return;
    console.time("building map");
    lakes = new Set();
    for (const tile of $map) {
      if (tile.type == "water") {
        lakes.add(tile.groupID);
      }
    }
    const u = $view.renderSize / (($game.mapSize * 6) / 2);
    for (const cell of $map) {
      drawTile(cell, u);
    }
    isMapBuilt = true;
    updateCamera();
    console.timeEnd("building map");
  }
  function initTrees() {
    for (const tile of $map) {
      treeSprites[fromCube(tile)] = getTreePositions(tile);
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
    await loadTilesheet();
    initTrees();
    buildMap();
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
  }}
/>
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
  on:touchend={dragEnd}
></div>

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
