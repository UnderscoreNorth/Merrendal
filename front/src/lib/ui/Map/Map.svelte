<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as PIXI from "pixi.js";
  import { game, map, openModals, view } from "$lib/stores";
  import type { TerrainTile } from "../../map/generation";
  import {
    fromCube,
    shuffle,
    rotateCubeCoordinates,
  } from "$lib/util/terrainHelpers";
  import { drawTrees, getTreePositions, type TreeCoord } from "./drawTrees";
  import { loadTilesheet } from "./init";
  import { BloomFilter, GlowFilter, SimplexNoiseFilter } from "pixi-filters";
  import { rollRange } from "$lib/util/rolls";

  let h: number;
  let container: HTMLDivElement;
  let app: PIXI.Application;
  let mapContainer: PIXI.Container;
  let mapSprites: Record<
    string,
    {
      container: PIXI.Container;
      tile: PIXI.Sprite;
      trees: PIXI.Sprite[];
      riverRoad?: PIXI.Graphics;
    }
  > = {};
  let treeSprites: Record<string, TreeCoord[]> = {};
  let isMapBuilt = false;
  let tilesheet: Record<string, PIXI.Texture> = {};
  let buildingSheet: Record<string, PIXI.Texture> = {};
  let fullTrees: PIXI.Texture[] = [];
  let riverTextures: Record<string, PIXI.Texture> = {};
  let tilesheetLoaded = false;
  let lakes: Set<string> = new Set();
  function getTileTexture(cell: TerrainTile): PIXI.Texture | null {
    if (!tilesheetLoaded) return null;
    let tileName: keyof typeof tilesheet = cell.terrain.topography;
    if (cell.terrain.elevation > 18) {
      tileName = "mountain peak";
    } else if (cell.terrain.elevation > 13) {
      tileName = "Mountain";
    } else if (cell.terrain.elevation >= 10) {
      tileName = "Hill";
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

    // Apply rotation to coordinates
    const rotations = $view.rotation / 60; // Convert degrees to number of 60° rotations
    const rotatedLoc = rotateCubeCoordinates(cell.loc, rotations);

    const x = u * ((3 * rotatedLoc.q) / 2);
    const y =
      u *
      ((Math.sqrt(3) * rotatedLoc.q) / 2 +
        Math.sqrt(3) * rotatedLoc.r -
        elevation * 0.2) *
      0.75;
    const layer =
      (Math.sqrt(3) * rotatedLoc.q) / 2 + Math.sqrt(3) * rotatedLoc.r;
    const seed = (cell.loc.q * 73856093) ^ (cell.loc.r * 19349663);
    const shouldFlip = seed % 2 === 0;
    const xScale = ((shouldFlip ? 1 : -1) * (u * 2)) / 240;
    const yScale = (u * 2) / 310;
    if (sprite == undefined) {
      sprite = new PIXI.Sprite(texture);
      mapSprites[fromCube(cell.loc)] = {
        container: new PIXI.Container(),
        tile: sprite,
        trees: [],
      };
      data = mapSprites[fromCube(cell.loc)];
      data.container.eventMode = "static";
      const points = [];
      for (let i = 0; i < 6; i++) {
        points.push(Math.cos((i * 2 * Math.PI) / 6) * u);
        points.push(Math.sin((i * 2 * Math.PI) / 6) * u * 0.75);
      }
      data.container.hitArea = new PIXI.Polygon(points);
      //let graphic = new PIXI.Graphics().poly(points).fill(0xff0000);
      //graphic.zIndex = 3;
      //data.container.addChild(graphic);
      data.container.on("pointerdown", () => {
        openArea(cell.loc.q, cell.loc.r, cell.loc.s);
      });
      data.container.on("mouseover", () => {
        data.container.filters = [new BloomFilter({ strength: 3 })];
      });
      data.container.on("mouseout", () => {
        data.container.filters = [];
      });
      mapContainer.addChild(data.container);
      sprite.anchor.set(0.5, 0.15);
      data.container.addChild(sprite);
      data.container.position.set(x, y);
      sprite.scale.set(xScale, yScale);
      sprite.position.set(0, 0);
      let brightness = 1;
      if (cell.terrain.topography === "Water") {
        brightness = 0.4 + ((cell.terrain.elevation + 3) / 3) * 0.6;
      } else if (cell.terrain.topography === "Plains") {
        brightness = 0.7 + cell.terrain.elevation * 0.03;
      } else if (cell.terrain.topography === "Mountain") {
        brightness = 0.8 + (cell.terrain.elevation - 10) * 0.02;
      }
      const tintValue = Math.floor(brightness * 255);
      sprite.tint = (tintValue << 16) | (tintValue << 8) | tintValue;
    } else {
      data.container.position.set(x, y);
    }
    data = mapSprites[fromCube(cell.loc)];
    if (cell.terrain.river || cell.terrain.road) {
      if (data.riverRoad !== undefined) {
        data.container.removeChild(data.riverRoad);
        data.riverRoad.destroy();
        data.riverRoad = undefined;
      }
      let river = new PIXI.Graphics();
      river.moveTo(0, 0);
      const angleOffset = $view.rotation / 60;

      // Check if there's a bridge in this area
      const area = $game.areas.find((i) => fromCube(i.loc) == fromCube(cell.loc));
      const hasBridge = area?.buildings.some(b =>
        b.buildingType === "Wooden Bridge" || b.buildingType === "Stone Bridge"
      ) ?? false;

      // Find parallel directions between river and road
      const riverDirs = cell.terrain.river.split("").map((i) => Number(i));
      const roadDirs = cell.terrain.road.split("").map((i) => Number(i));
      const parallelDirs = new Set(
        riverDirs.filter((dir) => roadDirs.includes(dir)),
      );

      for (let i of riverDirs) {
        const angle = ((i - 1.5 + angleOffset) * Math.PI) / 3;
        const endX = Math.cos(angle) * u * 7.5;
        const endY = Math.sin(angle) * u * 7.5;

        // Create squiggly line with small zigzag segments
        const segments = rollRange(1, 6);
        const perpAngle = angle + Math.PI / 2;

        // River stays centered
        for (let seg = 0; seg <= segments; seg++) {
          const t = seg / segments;
          const baseX = endX * t;
          const baseY = endY * t;

          // Alternate offset direction and add some variation
          const zigzag = (seg % 2 === 0 ? 1 : -1) * u * 0.5;
          const offsetX = baseX + Math.cos(perpAngle) * zigzag;
          const offsetY = baseY + Math.sin(perpAngle) * zigzag;

          river.lineTo(offsetX, offsetY);
        }

        river.stroke({
          width: 20,
          color: 0x146ab5,
          cap: "round",
          join: "round",
        });
        river.moveTo(0, 0);
      }
      river.moveTo(0, 0);
      for (let i of roadDirs) {
        const angle = ((i - 1.5 + angleOffset) * Math.PI) / 3;
        const endX = Math.cos(angle) * u * 7.5;
        const endY = Math.sin(angle) * u * 7.5;

        // Create squiggly line with small zigzag segments
        const segments = rollRange(1, 6);
        const perpAngle = angle + Math.PI / 2;

        // If parallel with river, draw road on both sides
        if (parallelDirs.has(i)) {
          // Draw road on left side
          for (let seg = 0; seg <= segments; seg++) {
            const t = seg / segments;
            const baseX = endX * t + Math.cos(perpAngle) * u * 1.2;
            const baseY = endY * t + Math.sin(perpAngle) * u * 1.2;

            const zigzag = (seg % 2 === 0 ? 1 : -1) * u * 0.5;
            const offsetX = baseX + Math.cos(perpAngle) * zigzag;
            const offsetY = baseY + Math.sin(perpAngle) * zigzag;

            river.lineTo(offsetX, offsetY);
          }

          river.stroke({
            width: 15,
            color: 0x967d56,
            cap: "round",
            join: "round",
          });
          river.moveTo(0, 0);

          // Draw road on right side
          for (let seg = 0; seg <= segments; seg++) {
            const t = seg / segments;
            const baseX = endX * t - Math.cos(perpAngle) * u * 1.2;
            const baseY = endY * t - Math.sin(perpAngle) * u * 1.2;

            const zigzag = (seg % 2 === 0 ? 1 : -1) * u * 0.5;
            const offsetX = baseX + Math.cos(perpAngle) * zigzag;
            const offsetY = baseY + Math.sin(perpAngle) * zigzag;

            river.lineTo(offsetX, offsetY);
          }

          river.stroke({
            width: 15,
            color: 0x967d56,
            cap: "round",
            join: "round",
          });
          river.moveTo(0, 0);
        } else {
          // Road not parallel, check if it crosses a river
          const crossesRiver = riverDirs.length > 0;

          if (crossesRiver && !hasBridge) {
            // Draw road from start, stopping before center (30% of the way)
            for (let seg = 0; seg <= segments; seg++) {
              const t = seg / segments;

              // Stop at 30% of the distance
              if (t > 0.3) {
                break;
              }

              const baseX = endX * t;
              const baseY = endY * t;

              const zigzag = (seg % 2 === 0 ? 1 : -1) * u * 0.5;
              const offsetX = baseX + Math.cos(perpAngle) * zigzag;
              const offsetY = baseY + Math.sin(perpAngle) * zigzag;

              river.lineTo(offsetX, offsetY);
            }

            river.stroke({
              width: 20,
              color: 0x967d56,
              cap: "round",
              join: "round",
            });
            river.moveTo(0, 0);

            // Draw road from end, stopping before center (from 70% to 100%)
            for (let seg = 0; seg <= segments; seg++) {
              const t = 0.7 + (seg / segments) * 0.3;

              const baseX = endX * t;
              const baseY = endY * t;

              const zigzag = (seg % 2 === 0 ? 1 : -1) * u * 0.5;
              const offsetX = baseX + Math.cos(perpAngle) * zigzag;
              const offsetY = baseY + Math.sin(perpAngle) * zigzag;

              river.lineTo(offsetX, offsetY);
            }

            river.stroke({
              width: 20,
              color: 0x967d56,
              cap: "round",
              join: "round",
            });
            river.moveTo(0, 0);
          } else {
            // Road not crossing river or has bridge, draw normally
            for (let seg = 0; seg <= segments; seg++) {
              const t = seg / segments;

              const baseX = endX * t;
              const baseY = endY * t;

              const zigzag = (seg % 2 === 0 ? 1 : -1) * u * 0.5;
              const offsetX = baseX + Math.cos(perpAngle) * zigzag;
              const offsetY = baseY + Math.sin(perpAngle) * zigzag;

              river.lineTo(offsetX, offsetY);
            }

            river.stroke({
              width: 20,
              color: 0x967d56,
              cap: "round",
              join: "round",
            });
            river.moveTo(0, 0);
          }
        }
      }
      //river = new PIXI.Graphics().poly(points).fill(0xff0000);
      //if (!texture) console.log(cell.terrain.river);
      data.container.addChild(river);
      river.position.set(0, 0);
      river.scale.set(Math.abs(xScale), yScale);
      data.riverRoad = river;
    }
    data.container.zIndex = layer;
    // Draw trees on top of the base tile
    const area = $game.areas.find((i) => fromCube(i.loc) == fromCube(cell.loc));
    drawTrees(treeSprites, mapSprites, area, buildingSheet, fullTrees, cell, u);
  }
  function openArea(q: number, r: number, s: number) {
    const area = $game.areas.find(
      (a) => a.loc.q == q && a.loc.r == r && a.loc.s == s,
    );
    if (area !== undefined) {
      $openModals["areaDetail"] = area;
    } else if ($game.map !== undefined) {
      const newArea = $game.map.tiles[fromCube({ q, r, s })];
      if (newArea.terrain.topography == "Plains")
        $openModals["startingArea"] = newArea;
    }
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
        ($view.x + $view.xDiff) * $view.zoom,
        ($view.y + $view.yDiff) * $view.zoom,
      );
      //if (app.ticker) app.ticker.stop();
    });
  }

  function rotateMap() {
    for (const tile of $map) {
      const sprites = mapSprites[fromCube(tile.loc)];
    }
    view.update((v) => {
      v.rotation = (v.rotation + 60) % 360;
      return v;
    });
    // Rebuild the map with rotated coordinates
    isMapBuilt = false;
    buildMap();
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
    game.subscribe((g) => {
      if (!g.render) return;
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
<button class="rotate-button" on:click={rotateMap} title="Rotate Map">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round">
    <path
      d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
  </svg>
</button>
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
  .rotate-button {
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: rgba(58, 59, 60, 0.9);
    border: 2px solid gold;
    color: gold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    transition: all 0.2s ease;
  }
  .rotate-button:hover {
    background-color: rgba(78, 79, 80, 0.95);
    transform: rotate(60deg);
  }
  .rotate-button:active {
    transform: scale(0.95) rotate(60deg);
  }
  .rotate-button svg {
    width: 1.5rem;
    height: 1.5rem;
  }
</style>
