export interface GridCoordinate {
  readonly column: number;
  readonly row: number;
}

export interface WorldPoint {
  readonly x: number;
  readonly y: number;
}

export function gridCoordinateKey(coordinate: GridCoordinate): string {
  return `${coordinate.column},${coordinate.row}`;
}
