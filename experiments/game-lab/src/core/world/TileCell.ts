import type { GridCoordinate } from "../grid/GridCoordinate";

export type TerrainTag = "field" | "road" | "base-pad" | "edge";

export interface TileCell {
  readonly coordinate: GridCoordinate;
  readonly tileId: string;
  readonly tags: readonly TerrainTag[];
}
