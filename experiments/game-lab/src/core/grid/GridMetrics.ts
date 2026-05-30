export interface GridMetrics {
  readonly columns: number;
  readonly rows: number;
  readonly tileSize: number;
}

export function createGridMetrics(columns: number, rows: number, tileSize: number): GridMetrics {
  if (!Number.isInteger(columns) || columns <= 0) {
    throw new Error("Grid columns must be a positive integer.");
  }

  if (!Number.isInteger(rows) || rows <= 0) {
    throw new Error("Grid rows must be a positive integer.");
  }

  if (!Number.isInteger(tileSize) || tileSize <= 0) {
    throw new Error("Grid tileSize must be a positive integer.");
  }

  return { columns, rows, tileSize };
}

export function getWorldWidth(metrics: GridMetrics): number {
  return metrics.columns * metrics.tileSize;
}

export function getWorldHeight(metrics: GridMetrics): number {
  return metrics.rows * metrics.tileSize;
}
