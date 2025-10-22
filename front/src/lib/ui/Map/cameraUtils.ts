import type { View } from "$lib/stores";

/**
 * Calculate zoom change with proper offset adjustment
 */
export function calculateZoomChange(view: View, newZoom: number): Partial<View> {
  const initOffset = (view.renderSize - view.renderSize / view.zoom) / 2;
  const afterOffset = (view.renderSize - view.renderSize / newZoom) / 2;

  return {
    x: view.x + initOffset - afterOffset,
    y: view.y + initOffset - afterOffset,
    zoom: newZoom,
  };
}

/**
 * Clamp zoom value to valid range
 */
export function clampZoom(zoom: number, mapSize: number): number {
  const minZoom = 1;
  const maxZoom = mapSize / 10;
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

/**
 * Calculate pinch distance between two touch points
 */
export function getPinchDistance(touches: TouchList): number {
  return Math.sqrt(
    Math.pow(touches[0].clientX - touches[1].clientX, 2) +
      Math.pow(touches[0].clientY - touches[1].clientY, 2)
  );
}

/**
 * Calculate drag offset based on mouse/touch movement
 */
export function calculateDragOffset(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  containerHeight: number,
  mapSize: number,
  zoom: number
): { xDiff: number; yDiff: number } {
  const dragSpeed = mapSize * 20 * zoom;
  const xDiff = ((currentX - startX) / containerHeight) * dragSpeed;
  const yDiff = ((currentY - startY) / containerHeight) * dragSpeed;
  return { xDiff, yDiff };
}

/**
 * Toggle pointer events on UI elements during drag
 */
export function setUIPointerEvents(enabled: boolean): void {
  const selectors = ["islandName", "gameBar"];
  const elements = selectors.flatMap((cls) =>
    Array.from(document.getElementsByClassName(cls))
  );
  elements.push(...Array.from(document.getElementsByTagName("char")));

  (elements as HTMLElement[]).forEach((el) => {
    el.style.pointerEvents = enabled ? "auto" : "none";
  });
}
