import type { GridMetrics } from "../grid/GridMetrics";
import type { TileCell } from "./TileCell";

export interface WorldMap {
  readonly id: string;
  readonly name: string;
  readonly grid: GridMetrics;
  readonly cells: readonly TileCell[];
}

export function validateWorldMap(map: WorldMap): void {
  const expectedCellCount = map.grid.columns * map.grid.rows;

  if (map.cells.length !== expectedCellCount) {
    throw new Error(`World map "${map.id}" has ${map.cells.length} cells, expected ${expectedCellCount}.`);
  }

  const seen = new Set<string>();

  for (const cell of map.cells) {
    const key = `${cell.coordinate.column},${cell.coordinate.row}`;

    if (seen.has(key)) {
      throw new Error(`World map "${map.id}" has duplicate cell ${key}.`);
    }

    seen.add(key);
  }
}
