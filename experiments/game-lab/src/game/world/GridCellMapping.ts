import type { GridCoordinate } from "../../core/grid/GridCoordinate";
import type { GridMetrics } from "../../core/grid/GridMetrics";

export interface GridCellMapping {
  readonly visualTilesPerGameplayCell: number;
}

export const oneTilePerGameplayCell: GridCellMapping = {
  visualTilesPerGameplayCell: 1
};

export function getGameplayCellSizePixels(metrics: GridMetrics, mapping: GridCellMapping): number {
  return metrics.tileSize * mapping.visualTilesPerGameplayCell;
}

export function gameplayCellToVisualTile(
  coordinate: GridCoordinate,
  mapping: GridCellMapping
): GridCoordinate {
  return {
    column: coordinate.column * mapping.visualTilesPerGameplayCell,
    row: coordinate.row * mapping.visualTilesPerGameplayCell
  };
}
