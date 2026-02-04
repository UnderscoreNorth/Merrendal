<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as PIXI from "pixi.js";
  import { BloomFilter } from "pixi-filters";
  import {
    game,
    openModals,
    view,
    tileSelection,
    changedAreas,
    colorView,
  } from "$lib/stores";
  import type { TerrainTile } from "$lib/map/generation";
  import { fromCube, getVisibleTiles } from "$lib/util/terrainHelpers";
  import { drawTrees, getTreePositions, type TreeCoord } from "./drawTrees";
  import { loadTilesheet } from "./init";
  import MapInteractionHandler from "./MapInteractionHandler.svelte";
  import MapControls from "./MapControls.svelte";
  import {
    getTileTexture,
    calculateTilePosition,
    calculateTileScale,
    calculateTileBrightness,
    createHexHitArea,
    type TileSpriteData,
  } from "./tileRenderer";
  import { drawRiverRoad } from "./riverRoadRenderer";
  import { type Area } from "$lib/data/areas";

  // PIXI App and containers
  let container: HTMLDivElement;
  let app: PIXI.Application;
  let mapContainer: PIXI.Container;

  // Sprite storage
  let mapSprites: Record<string, TileSpriteData> = {};
  let treeSprites: Record<string, TreeCoord[]> = {};

  // Asset storage
  let tilesheet: Record<string, PIXI.Texture> = {};
  let buildingSheet: Record<string, PIXI.Texture> = {};
  let fullTrees: PIXI.Texture[] = [];

  // State flags
  let isMapBuilt = false;
  let tilesheetLoaded = false;
  let lakes: Set<string> = new Set();
  let seed = "";
  /**
   * Open area detail modal or starting area modal
   * If in tile selection mode, handle tile selection instead
   */
  function openArea(q: number, r: number, s: number) {
    const areaId = fromCube({ q, r, s });

    // If in tile selection mode, handle tile selection
    if ($tileSelection?.active) {
      const area = Object.values($game.areas).find(
        (a) => a.loc.q === q && a.loc.r === r && a.loc.s === s,
      );
      if (area && $tileSelection.eligibleTiles.has(area.areaID)) {
        $tileSelection.onSelect(area.areaID);
      }
      return;
    }

    // Normal behavior: open modals
    const area = $game.areas[areaId];
    if (area !== undefined) {
      if (area.seen !== "No") {
        $openModals["areaDetail"] = area;

        $colorView = {
          type: "tileView",
          tile: areaId,
          tiles: getVisibleTiles(area, $game.areas, {}).map((i) => i.areaID),
        };
      }
    } else if ($game.map !== undefined) {
      const newArea = $game.map.tiles[areaId];
      console.log($colorView);
      if (newArea.terrain.topography === "Plains") {
        $openModals["startingArea"] = newArea;
      }
    }
  }

  /**
   * Draw or update a single tile
   */
  function drawTile(cell: Area, u: number) {
    const tileKey = fromCube(cell.loc);
    let data = mapSprites[tileKey];
    //if (cell.seen == "No") return;
    if (data?.tile && isMapBuilt) {
      return; // Tile already drawn
    }

    const texture = getTileTexture(cell, tilesheet);
    if (!texture) return;

    const { xScale, yScale } = calculateTileScale(cell, u);

    // Create new tile if it doesn't exist
    if (!data) {
      const sprite = new PIXI.Sprite(texture);
      const tileContainer = new PIXI.Container();

      data = {
        container: tileContainer,
        tile: sprite,
        trees: [],
      };
      mapSprites[tileKey] = data;

      // Setup interaction
      tileContainer.eventMode = "static";
      tileContainer.hitArea = createHexHitArea(u);
      tileContainer.on("pointerup", () => {
        if ($view.xDiff == 0 && $view.yDiff == 0)
          openArea(cell.loc.q, cell.loc.r, cell.loc.s);
      });
      tileContainer.on("mouseover", () => {
        tileContainer.filters = [new BloomFilter({ strength: 3 })];
      });
      tileContainer.on("mouseout", () => {
        tileContainer.filters = [];
      });

      // Setup sprite
      sprite.anchor.set(0.5, 0.15);
      sprite.scale.set(xScale, yScale);
      sprite.position.set(0, 0);
      sprite.tint = calculateTileBrightness(cell);

      tileContainer.addChild(sprite);
      mapContainer.addChild(tileContainer);
    }
    updateTile(cell, u);
    colorTile(cell);
  }
  function updateTile(cell: Area, u: number) {
    const tileKey = fromCube(cell.loc);
    const data = mapSprites[tileKey];
    const { x, y, layer } = calculateTilePosition(
      cell,
      u,
      $view.rotation,
      $view.relief,
    );
    const { xScale, yScale } = calculateTileScale(cell, u);
    // Update position
    data.container.position.set(x, y);
    data.container.zIndex = layer;
    // Draw rivers and roads
    if (fromCube(cell.loc) == "-1,34,-33") console.log(cell.terrain);
    if (cell.terrain.river || cell.terrain.road) {
      if (data.riverRoad) {
        data.container.removeChild(data.riverRoad);
        data.riverRoad.destroy();
      }
      const riverRoad = drawRiverRoad(cell, u, xScale, yScale, $view.rotation);
      if (riverRoad) {
        data.container.addChild(riverRoad);
        data.riverRoad = riverRoad;
      }
    }

    drawTrees(
      treeSprites,
      mapSprites,
      buildingSheet,
      fullTrees,
      cell,
      u,
      $view.treeOpacity,
    );
  }
  function colorTile(cell: Area) {
    const tileKey = fromCube(cell.loc);
    const data = mapSprites[tileKey];
    if (cell.seen == "No") {
      data.container.tint = 0x000000;
      return;
    }
    if ($colorView.type == "tileSelect") {
      if ($tileSelection.eligibleTiles.has(cell.areaID)) {
        // Eligible tile - normal brightness
        data.tile.tint = calculateTileBrightness(cell);
      } else {
        // Ineligible tile - grey out
        data.container.tint = 0x444444;
      }
    } else if ($colorView.type == "tileView") {
      if ($colorView.tile == tileKey || $colorView.tiles.includes(tileKey)) {
        data.container.tint = 0xffffff;
      } else {
        // Ineligible tile - grey out
        data.container.tint = 0x444444;
      }
    } else {
      // Normal mode - restore normal tint and alpha
      data.tile.tint = calculateTileBrightness(cell);
      data.container.alpha = 1;
      data.container.tint = 0xffffff;
      if (cell.seen == "Seen") {
        data.container.tint = 0xaaaaaa;
      }
    }
  }

  /**
   * Build the entire map
   */
  function buildMap() {
    if (!app || !mapContainer || !tilesheetLoaded) return;
    console.time("building map");
    const u = $view.renderSize / ((40 * 4) / 2);
    // Draw all tiles
    for (const cell of Object.values($game.areas)) {
      drawTile(cell, u);
    }

    isMapBuilt = true;
    updateCamera();
    console.timeEnd("building map");
  }

  /**
   * Initialize tree positions for all tiles
   */
  function initTrees() {
    for (const tile of Object.values($game.areas)) {
      treeSprites[fromCube(tile.loc)] = getTreePositions(fullTrees, tile);
    }
  }

  /**
   * Update camera position and zoom
   */
  function updateCamera() {
    if (!mapContainer) return;

    requestAnimationFrame(() => {
      if (mapContainer.scale == undefined) return;
      mapContainer.scale.set($view.zoom);
      mapContainer.position.set(
        ($view.x + $view.xDiff) * $view.zoom,
        ($view.y + $view.yDiff) * $view.zoom,
      );
    });
  }

  function updateMap() {
    isMapBuilt = false;
    buildMap();
  }

  // Lifecycle - Mount
  onMount(async () => {
    seed = $game.seed;
    // Initialize PIXI Application
    app = new PIXI.Application();
    await app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x05112e,
      resolution: window.devicePixelRatio || 1,
    });

    container.appendChild(app.canvas as HTMLCanvasElement);
    mapContainer = new PIXI.Container();
    app.stage.addChild(mapContainer);

    // Load assets
    ({ fullTrees, tilesheet, buildingSheet } = await loadTilesheet());
    tilesheetLoaded = true;

    // Initialize and build
    initTrees();
    buildMap();

    // Setup subscriptions
    const unsubGame = changedAreas.subscribe((cA) => {
      console.log(cA);
      if (cA.tiles.length && cA.render) {
        for (const tileKey of cA.tiles) {
          if (mapSprites[tileKey] == undefined) continue;
          let tile = mapSprites[tileKey].tile;
          if (tile !== undefined) {
            mapSprites[tileKey].container.removeChild(tile);
            tile.destroy();
          }

          delete mapSprites[tileKey];
        }
        isMapBuilt = false;
        buildMap();
        $changedAreas.tiles = [];
        $changedAreas.render = false;
      }
    });

    const unsubView = view.subscribe(() => {
      updateCamera();
    });

    const unsubTileSelection = tileSelection.subscribe(() => {
      // Re-render map when tile selection mode changes
      isMapBuilt = false;
      buildMap();
    });
    const unsubColorView = colorView.subscribe(() => {
      if (isMapBuilt) {
        for (const cell of Object.values($game.areas)) {
          colorTile(cell);
        }
        updateCamera();
      }
    });

    /*setInterval(() => {
      console.log($view, window.innerWidth, window.innerHeight, {
        minX,
        maxX,
        minY,
        maxY,
      });
    }, 2000);*/
    // Cleanup function
    return () => {
      unsubGame();
      unsubView();
      unsubTileSelection();
      unsubColorView();
    };
  });

  // Lifecycle - Destroy
  onDestroy(() => {
    for (const data of Object.values(mapSprites)) {
      data.container.destroy();
    }
    if (app) {
      app.destroy(true, { children: true, texture: true });
    }
  });
</script>

<svelte:window
  on:resize={() => {
    isMapBuilt = false;
    buildMap();
  }} />

<MapControls {updateMap} />

<MapInteractionHandler>
  <div bind:this={container}></div>
</MapInteractionHandler>

<style>
  :global(mapicon.glow svg) {
    position: relative;
    filter: drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.8));
    z-index: 1;
  }
</style>
