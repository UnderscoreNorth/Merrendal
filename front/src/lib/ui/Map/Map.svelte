<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as PIXI from "pixi.js";
  import { BloomFilter } from "pixi-filters";
  import { game, map, openModals, view } from "$lib/stores";
  import type { TerrainTile } from "$lib/map/generation";
  import { fromCube } from "$lib/util/terrainHelpers";
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
  let riverTextures: Record<string, PIXI.Texture> = {};

  // State flags
  let isMapBuilt = false;
  let tilesheetLoaded = false;
  let lakes: Set<string> = new Set();
  let seed = "";
  /**
   * Open area detail modal or starting area modal
   */
  function openArea(q: number, r: number, s: number) {
    const area = $game.areas.find(
      (a) => a.loc.q === q && a.loc.r === r && a.loc.s === s,
    );
    if (area !== undefined) {
      $openModals["areaDetail"] = area;
    } else if ($game.map !== undefined) {
      const newArea = $game.map.tiles[fromCube({ q, r, s })];
      if (newArea.terrain.topography === "Plains") {
        $openModals["startingArea"] = newArea;
      }
    }
  }

  /**
   * Draw or update a single tile
   */
  function drawTile(cell: TerrainTile, u: number) {
    const tileKey = fromCube(cell.loc);
    let data = mapSprites[tileKey];

    if (data?.tile && isMapBuilt) {
      return; // Tile already drawn
    }

    const texture = getTileTexture(cell, tilesheet);
    if (!texture) return;

    const { x, y, layer } = calculateTilePosition(
      cell,
      u,
      $view.rotation,
      $view.relief,
    );
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
      tileContainer.on("pointerdown", () =>
        openArea(cell.loc.q, cell.loc.r, cell.loc.s),
      );
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

    // Update position
    data.container.position.set(x, y);
    data.container.zIndex = layer;

    // Draw rivers and roads
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

    // Draw trees
    const area = $game.areas.find((i) => fromCube(i.loc) === tileKey);
    drawTrees(
      treeSprites,
      mapSprites,
      area,
      buildingSheet,
      fullTrees,
      cell,
      u,
      $view.treeOpacity,
    );
  }

  /**
   * Build the entire map
   */
  function buildMap() {
    if (!app || !mapContainer || !tilesheetLoaded) return;
    if (seed !== $game.seed) {
      seed = $game.seed;
      for (const data of Object.values(mapSprites)) {
        for (const subData of data.container.children) {
          data.container.removeChild(subData);
          subData.destroy();
        }
        const tile = data.tile;
        data.container.removeChild(tile);
        tile.destroy();
        data.container.destroy();
      }
      for (const data of mapContainer.children) {
        mapContainer.removeChild(data);
        data.destroy();
      }
      mapSprites = {};
    }
    console.time("building map");

    // Collect lakes
    lakes = new Set();
    for (const tile of $map) {
      if (tile.terrain.topography === "Water") {
        lakes.add(tile.groupID);
      }
    }

    const u = $view.renderSize / (($game.mapSize * 4) / 2);

    // Draw all tiles
    for (const cell of $map) {
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
    for (const tile of $map) {
      treeSprites[fromCube(tile.loc)] = getTreePositions(fullTrees, tile);
    }
  }

  /**
   * Update camera position and zoom
   */
  function updateCamera() {
    if (!mapContainer) return;

    requestAnimationFrame(() => {
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
    ({ fullTrees, tilesheet, riverTextures, buildingSheet } =
      await loadTilesheet());
    tilesheetLoaded = true;

    // Initialize and build
    initTrees();
    buildMap();

    // Setup subscriptions
    const unsubGame = game.subscribe((g) => {
      if (g.render) {
        isMapBuilt = false;
        buildMap();
      }
    });

    const unsubMap = map.subscribe(() => {
      isMapBuilt = false;
      buildMap();
    });

    const unsubView = view.subscribe(() => {
      updateCamera();
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
      unsubMap();
      unsubView();
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
