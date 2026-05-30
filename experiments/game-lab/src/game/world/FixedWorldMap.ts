import { createGridMetrics } from "../../core/grid/GridMetrics";
import type { TerrainTag, TileCell } from "../../core/world/TileCell";
import type { WorldMap } from "../../core/world/WorldMap";
import { validateWorldMap } from "../../core/world/WorldMap";
import { selectGroundTileId } from "../tiles/GroundTileVisualPalette";

const gridColumns = 48;
const gridRows = 28;
const renderTileSize = 126;
const centerColumn = Math.floor(gridColumns / 2);
const centerRow = Math.floor(gridRows / 2);

const basePadBounds = {
  left: centerColumn - 2,
  right: centerColumn + 1,
  top: centerRow - 2,
  bottom: centerRow + 1
};

export function createFixedWorldMap(): WorldMap {
  const grid = createGridMetrics(gridColumns, gridRows, renderTileSize);
  const cells: TileCell[] = [];

  for (let row = 0; row < grid.rows; row++) {
    for (let column = 0; column < grid.columns; column++) {
      cells.push({
        coordinate: { column, row },
        tileId: chooseTileId(column, row),
        tags: chooseTags(column, row)
      });
    }
  }

  const map: WorldMap = {
    id: "lab-fixed-yard-01",
    name: "Fixed Yard 01",
    grid,
    cells
  };

  validateWorldMap(map);
  return map;
}

function chooseTags(column: number, row: number): readonly TerrainTag[] {
  const tags: TerrainTag[] = [];

  if (isEdge(column, row)) {
    tags.push("edge");
  }

  if (isBasePad(column, row)) {
    tags.push("base-pad");
  }
  else if (isRoad(column, row)) {
    tags.push("road");
  }
  else {
    tags.push("field");
  }

  return tags;
}

function chooseTileId(column: number, row: number): string {
  return selectGroundTileId({
    column,
    row,
    isBasePad: isBasePad(column, row),
    isRoad: isRoad(column, row),
    isEdge: isEdge(column, row),
    isCornerRubble: isCornerRubble(column, row)
  });
}

function isBasePad(column: number, row: number): boolean {
  return (
    column >= basePadBounds.left &&
    column <= basePadBounds.right &&
    row >= basePadBounds.top &&
    row <= basePadBounds.bottom
  );
}

function isRoad(column: number, row: number): boolean {
  const horizontalLane = row >= centerRow - 1 && row <= centerRow;
  const verticalLane = column >= centerColumn - 1 && column <= centerColumn;

  return horizontalLane || verticalLane;
}

function isEdge(column: number, row: number): boolean {
  return column === 0 || row === 0 || column === gridColumns - 1 || row === gridRows - 1;
}

function isCornerRubble(column: number, row: number): boolean {
  const nearLeftOrRight = column < 4 || column > gridColumns - 5;
  const nearTopOrBottom = row < 3 || row > gridRows - 4;

  return nearLeftOrRight && nearTopOrBottom;
}
