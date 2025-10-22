<script lang="ts">
  import { view, game, type View } from "$lib/stores";
  import {
    calculateZoomChange,
    clampZoom,
    getPinchDistance,
    calculateDragOffset,
    setUIPointerEvents,
  } from "./cameraUtils";

  export let onZoomChange: (zoom: number) => void = () => {};

  let drag = false;
  let startX = 0;
  let startY = 0;
  let initTouchDistance = -1;
  let initZoom = 0;
  let containerHeight = 0;
  let containerWidth = 0;

  function handleScroll(e: WheelEvent) {
    let zoom = $view.zoom;
    zoom -= (e.deltaY * zoom) / 1000;
    zoom = clampZoom(zoom, $game.mapSize);
    changeZoom(zoom);
  }

  function handleDoubleClick(e: MouseEvent) {
    let zoom = $view.zoom + 0.08;
    zoom = clampZoom(zoom, $game.mapSize);
    changeZoom(zoom);
  }

  function changeZoom(newZoom: number) {
    view.update((v) => {
      checkBounds(v);
      return { ...v, ...calculateZoomChange(v, newZoom) };
    });
    onZoomChange(newZoom);
  }

  function handleDragStart(e: MouseEvent | TouchEvent) {
    if (e instanceof TouchEvent && e.targetTouches.length === 2) {
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
    setUIPointerEvents(false);
  }

  function handleDragMove(e: MouseEvent | TouchEvent) {
    // Handle pinch zoom on touch devices
    if (
      e instanceof TouchEvent &&
      e.targetTouches.length === 2 &&
      initTouchDistance >= 0
    ) {
      const distance = getPinchDistance(e.targetTouches);
      let zoom = (initZoom * distance) / initTouchDistance;
      zoom = clampZoom(zoom, $game.mapSize);
      changeZoom(zoom);
      e.preventDefault();
      return;
    }

    if (!drag) return;

    const currentX =
      e instanceof MouseEvent ? e.offsetX : e.targetTouches[0].clientX;
    const currentY =
      e instanceof MouseEvent ? e.offsetY : e.targetTouches[0].clientY;

    const { xDiff, yDiff } = calculateDragOffset(
      startX,
      startY,
      currentX,
      currentY,
      containerHeight,
      $game.mapSize,
      $view.zoom,
    );
    view.update((v) => {
      v = checkBounds(v);
      return { ...v, xDiff, yDiff };
    });
  }
  function checkBounds(v: View) {
    //if (v.x + 750 > containerWidth) v.x = containerWidth - 750;
    //if (v.x > 750) v.x = 750;
    return v;
  }
  function handleDragEnd(e: MouseEvent | TouchEvent) {
    initTouchDistance = -1;
    if (!drag) return;

    drag = false;
    view.update((v) => {
      v = {
        ...v,
        x: v.x + v.xDiff,
        y: v.y + v.yDiff,
        xDiff: 0,
        yDiff: 0,
      };
      v = checkBounds(v);
      return v;
    });
    setUIPointerEvents(true);
  }
</script>

<div
  bind:clientHeight={containerHeight}
  bind:clientWidth={containerWidth}
  on:wheel={handleScroll}
  on:dblclick={handleDoubleClick}
  on:mousemove={handleDragMove}
  on:mousedown={handleDragStart}
  on:mouseup={handleDragEnd}
  on:mouseleave={handleDragEnd}
  on:touchstart={handleDragStart}
  on:touchmove={handleDragMove}
  on:touchend={handleDragEnd}>
  <slot />
</div>

<style>
  div {
    position: relative;
    height: min(100svh, 100vw);
  }
  div :global(canvas) {
    height: 100vh;
    width: 100vw;
  }
</style>
