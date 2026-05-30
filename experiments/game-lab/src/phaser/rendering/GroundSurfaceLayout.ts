import type { GridCoordinate, WorldPoint } from "../../core/grid/GridCoordinate";
import type { WorldMap } from "../../core/world/WorldMap";

export interface GroundSurfaceLayoutOptions {
  readonly map: WorldMap;
  readonly tileOverlapPixels: number;
}

export class GroundSurfaceLayout {
  readonly stride: number;
  readonly surfaceWidth: number;
  readonly surfaceHeight: number;

  private readonly map: WorldMap;

  constructor(options: GroundSurfaceLayoutOptions) {
    this.map = options.map;
    this.stride = this.map.grid.tileSize - options.tileOverlapPixels;
    this.surfaceWidth = (this.map.grid.columns - 1) * this.stride + this.map.grid.tileSize;
    this.surfaceHeight = (this.map.grid.rows - 1) * this.stride + this.map.grid.tileSize;
  }

  gridCellCenterToWorld(coordinate: GridCoordinate): WorldPoint {
    return {
      x: coordinate.column * this.stride + this.map.grid.tileSize / 2,
      y: coordinate.row * this.stride + this.map.grid.tileSize / 2
    };
  }

  surfacePointToWorld(point: WorldPoint): WorldPoint {
    return point;
  }

  scaleAtSurfacePoint(_point: WorldPoint): number {
    return 1;
  }
}
