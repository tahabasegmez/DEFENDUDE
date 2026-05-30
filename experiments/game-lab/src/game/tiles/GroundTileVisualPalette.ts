import { createGroundTileId } from "./GroundTileCatalog";

export interface GroundTileSelectionContext {
  readonly column: number;
  readonly row: number;
  readonly isBasePad: boolean;
  readonly isRoad: boolean;
  readonly isEdge: boolean;
  readonly isCornerRubble: boolean;
}

const smoothConcreteTiles = [
  createGroundTileId(2, 7),
  createGroundTileId(4, 4),
  createGroundTileId(4, 2),
  createGroundTileId(4, 3),
  createGroundTileId(2, 5),
  createGroundTileId(2, 2),
  createGroundTileId(4, 9),
  createGroundTileId(7, 2),
  createGroundTileId(5, 4),
  createGroundTileId(3, 6),
  createGroundTileId(3, 2),
  createGroundTileId(6, 3),
  createGroundTileId(1, 9),
  createGroundTileId(7, 5),
  createGroundTileId(4, 7),
  createGroundTileId(1, 5)
] as const;

const subtleDarkTiles = [
  createGroundTileId(2, 4),
  createGroundTileId(1, 6),
  createGroundTileId(3, 3),
  createGroundTileId(4, 1),
  createGroundTileId(3, 7)
] as const;

const subtleWarmTiles = [
  createGroundTileId(3, 8),
  createGroundTileId(3, 9),
  createGroundTileId(7, 4),
  createGroundTileId(6, 1),
  createGroundTileId(5, 7)
] as const;

const basePadTiles = [
  createGroundTileId(4, 4),
  createGroundTileId(4, 2),
  createGroundTileId(4, 3),
  createGroundTileId(2, 5),
  createGroundTileId(2, 2)
] as const;

const rareDetailTiles = [
  createGroundTileId(7, 8),
  createGroundTileId(7, 6),
  createGroundTileId(7, 7),
  createGroundTileId(6, 2),
  createGroundTileId(6, 7),
  createGroundTileId(5, 9)
] as const;

export function selectGroundTileId(context: GroundTileSelectionContext): string {
  if (context.isBasePad) {
    return pickStable(basePadTiles, context.column, context.row, 17, 2);
  }

  if (shouldUseRareDetail(context)) {
    return pickStable(rareDetailTiles, context.column, context.row, 43, 4);
  }

  if (context.isCornerRubble) {
    return pickStable(subtleDarkTiles, context.column, context.row, 31, 3);
  }

  if (context.isEdge) {
    return pickStable(subtleWarmTiles, context.column, context.row, 29, 3);
  }

  if (context.isRoad) {
    return selectSoftRoadTile(context);
  }

  return selectSoftFieldTile(context);
}

function selectSoftFieldTile(context: GroundTileSelectionContext): string {
  const blend = hash(context.column, context.row, 71) % 10;

  if (blend < 2) {
    return pickStable(subtleWarmTiles, context.column, context.row, 5, 4);
  }

  if (blend === 2) {
    return pickStable(subtleDarkTiles, context.column, context.row, 11, 4);
  }

  return pickStable(smoothConcreteTiles, context.column, context.row, 3, 4);
}

function selectSoftRoadTile(context: GroundTileSelectionContext): string {
  const blend = hash(context.column, context.row, 89) % 10;

  if (blend < 4) {
    return pickStable(subtleDarkTiles, context.column, context.row, 13, 4);
  }

  return pickStable(smoothConcreteTiles, context.column, context.row, 19, 4);
}

function shouldUseRareDetail(context: GroundTileSelectionContext): boolean {
  if (context.isBasePad || context.isRoad) {
    return false;
  }

  return hash(context.column, context.row, 101) % 23 === 0;
}

function pickStable(
  tileIds: readonly string[],
  column: number,
  row: number,
  salt: number,
  regionSize: number
): string {
  const regionColumn = Math.floor(column / regionSize);
  const regionRow = Math.floor(row / regionSize);
  const localVariation = hash(column, row, salt + 137) % 4 === 0 ? 1 : 0;
  const index = (hash(regionColumn, regionRow, salt) + localVariation) % tileIds.length;

  return tileIds[index];
}

function hash(column: number, row: number, salt: number): number {
  let value = column * 374761393 + row * 668265263 + salt * 1442695041;
  value = (value ^ (value >>> 13)) * 1274126177;

  return Math.abs(value ^ (value >>> 16));
}
