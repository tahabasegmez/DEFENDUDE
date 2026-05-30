export interface GroundTileDefinition {
  readonly id: string;
  readonly assetKey: string;
  readonly fileName: string;
  readonly sourceSize: 126;
}

const rows = 7;
const columns = 9;
const sourceSize = 126;

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function createGroundTileId(row: number, column: number): string {
  return `ground:tile_r${pad(row)}_c${pad(column)}`;
}

export const groundTileCatalog: readonly GroundTileDefinition[] = Array.from(
  { length: rows * columns },
  (_, index) => {
    const row = Math.floor(index / columns) + 1;
    const column = (index % columns) + 1;
    const fileName = `tile_r${pad(row)}_c${pad(column)}.png`;

    return {
      id: createGroundTileId(row, column),
      assetKey: createGroundTileId(row, column),
      fileName,
      sourceSize
    };
  }
);

export function getGroundTileById(tileId: string): GroundTileDefinition {
  const tile = groundTileCatalog.find((candidate) => candidate.id === tileId);

  if (!tile) {
    throw new Error(`Ground tile "${tileId}" is not registered.`);
  }

  return tile;
}
