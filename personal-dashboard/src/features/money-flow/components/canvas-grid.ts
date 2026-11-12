export const CANVAS_GRID_SIZE = 24;
export const SNAP_GRID: [number, number] = [CANVAS_GRID_SIZE, CANVAS_GRID_SIZE];

export function snapCanvasCoordinate(value: number) {
  return Math.round(value / CANVAS_GRID_SIZE) * CANVAS_GRID_SIZE;
}

export function canvasHandleRow(top: number, height: number) {
  return snapCanvasCoordinate(top + height / 2);
}
