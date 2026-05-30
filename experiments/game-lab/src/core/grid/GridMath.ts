import type { GridCoordinate, WorldPoint } from "./GridCoordinate";
import type { GridMetrics } from "./GridMetrics";

export function isInsideGrid(metrics: GridMetrics, coordinate: GridCoordinate): boolean {
  return (
    coordinate.column >= 0 &&
    coordinate.row >= 0 &&
    coordinate.column < metrics.columns &&
    coordinate.row < metrics.rows
  );
}

export function gridToWorldTopLeft(metrics: GridMetrics, coordinate: GridCoordinate): WorldPoint {
  return {
    x: coordinate.column * metrics.tileSize,
    y: coordinate.row * metrics.tileSize
  };
}

export function gridToWorldCenter(metrics: GridMetrics, coordinate: GridCoordinate): WorldPoint {
  return {
    x: coordinate.column * metrics.tileSize + metrics.tileSize / 2,
    y: coordinate.row * metrics.tileSize + metrics.tileSize / 2
  };
}

export function worldToGrid(metrics: GridMetrics, point: WorldPoint): GridCoordinate {
  return {
    column: Math.floor(point.x / metrics.tileSize),
    row: Math.floor(point.y / metrics.tileSize)
  };
}
