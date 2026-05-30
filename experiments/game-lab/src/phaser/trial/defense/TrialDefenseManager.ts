import Phaser from "phaser";
import type { GridCoordinate } from "../../../core/grid/GridCoordinate";
import type { WorldMap } from "../../../core/world/WorldMap";
import type { GroundSurfaceLayout } from "../../rendering/GroundSurfaceLayout";
import type { TrialCollisionBody } from "../collision/TrialCollisionTypes";
import type { TrialDamageableTarget, TrialMeleeTarget } from "../combat/TrialCombatTypes";
import { TrialProjectileManager } from "../combat/TrialProjectileManager";
import type { TrialDifficultySettings } from "../difficulty/TrialDifficultySettings";
import {
  trialDefenseLayoutTuning,
  trialFenceDefinitions,
  type TrialFenceKind,
  trialTurretDefinitions,
  type TrialTurretKind
} from "./TrialDefenseTuning";
import { TrialFenceController } from "./TrialFenceController";
import { TrialMineController } from "./TrialMineController";
import { TrialTurretController } from "./TrialTurretController";
import type { TrialInventoryItemId } from "../shop/TrialInventoryModel";

export interface TrialDefenseManagerOptions {
  readonly scene: Phaser.Scene;
  readonly map: WorldMap;
  readonly surfaceLayout: GroundSurfaceLayout;
  readonly projectileManager: TrialProjectileManager;
  readonly difficulty: TrialDifficultySettings;
}

export class TrialDefenseManager {
  private readonly scene: Phaser.Scene;
  private readonly map: WorldMap;
  private readonly surfaceLayout: GroundSurfaceLayout;
  private readonly projectileManager: TrialProjectileManager;
  private readonly difficulty: TrialDifficultySettings;
  private readonly fences: TrialFenceController[] = [];
  private readonly turrets: TrialTurretController[] = [];
  private readonly mines: TrialMineController[] = [];
  private readonly occupiedCells = new Set<string>();
  private readonly pauseKey: Phaser.Input.Keyboard.Key;
  private isPaused = false;

  constructor(options: TrialDefenseManagerOptions) {
    this.scene = options.scene;
    this.map = options.map;
    this.surfaceLayout = options.surfaceLayout;
    this.projectileManager = options.projectileManager;
    this.difficulty = options.difficulty;
    this.pauseKey = options.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    for (const cell of this.createFenceCells(options.map)) {
      const definition = this.pickFenceDefinition(cell);
      this.addFence(cell, definition.kind);
    }

    const turretCells = this.createTurretCells(options.map);
    for (let index = 0; index < turretCells.length; index++) {
      const kind = trialDefenseLayoutTuning.turretCornerOrder[index % trialDefenseLayoutTuning.turretCornerOrder.length];
      this.addTurret(turretCells[index], kind);
    }
  }

  update(deltaMs: number, targets: readonly TrialDamageableTarget[]): void {
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.isPaused = !this.isPaused;
    }

    if (this.isPaused) {
      return;
    }

    this.pruneDestroyedStructures();
    this.updateMines(targets);
    for (const turret of this.turrets) {
      turret.update(deltaMs, targets);
    }
  }

  getMeleeTargets(): readonly TrialMeleeTarget[] {
    return this.fences.filter((fence) => fence.isAttackable());
  }

  getObstacleMeleeTargets(): ReadonlyArray<TrialMeleeTarget & TrialCollisionBody> {
    return this.fences.filter((fence) => fence.isAttackable() && fence.isBlocking());
  }

  getStructureDamageTargets(): readonly TrialDamageableTarget[] {
    return [
      ...this.turrets
    ];
  }

  getCollisionBodies(): readonly TrialCollisionBody[] {
    return [
      ...this.fences.filter((fence) => fence.isBlocking()),
      ...this.turrets.filter((turret) => turret.isBlocking())
    ];
  }

  canPlaceAt(cell: GridCoordinate): boolean {
    return this.isInsideMap(cell) && !this.occupiedCells.has(this.getCellKey(cell));
  }

  placeInventoryItem(itemId: TrialInventoryItemId, cell: GridCoordinate): boolean {
    if (!this.canPlaceAt(cell)) {
      return false;
    }

    switch (itemId) {
      case "woodenFence":
        this.addFence(cell, "wooden");
        return true;
      case "metalFence":
        this.addFence(cell, "metal");
        return true;
      case "electricFence":
        this.addFence(cell, "electric");
        return true;
      case "lightTurret":
        this.addTurret(cell, "light");
        return true;
      case "machinegunTurret":
        this.addTurret(cell, "machinegun");
        return true;
      case "heavyTurret":
        this.addTurret(cell, "heavy");
        return true;
      case "mine":
        this.addMine(cell);
        return true;
      default:
        return false;
    }
  }

  private addFence(cell: GridCoordinate, kind: TrialFenceKind): void {
    this.occupiedCells.add(this.getCellKey(cell));
    this.fences.push(
      new TrialFenceController({
        scene: this.scene,
        map: this.map,
        surfaceLayout: this.surfaceLayout,
        cell,
        definition: trialFenceDefinitions[kind]
      })
    );
  }

  private addTurret(cell: GridCoordinate, kind: TrialTurretKind): void {
    this.occupiedCells.add(this.getCellKey(cell));
    this.turrets.push(
      new TrialTurretController({
        scene: this.scene,
        map: this.map,
        surfaceLayout: this.surfaceLayout,
        projectileManager: this.projectileManager,
        cell,
        definition: trialTurretDefinitions[kind],
        canDamageStructures: this.difficulty.friendlyProjectileDamagesStructures
      })
    );
  }

  private addMine(cell: GridCoordinate): void {
    this.occupiedCells.add(this.getCellKey(cell));
    this.mines.push(new TrialMineController({ scene: this.scene, map: this.map, surfaceLayout: this.surfaceLayout, cell }));
  }

  private updateMines(targets: readonly TrialDamageableTarget[]): void {
    for (let index = this.mines.length - 1; index >= 0; index--) {
      const mine = this.mines[index];
      mine.update(targets, this.projectileManager);
      if (!mine.isActive()) {
        this.occupiedCells.delete(this.getCellKey(mine.cell));
        this.mines.splice(index, 1);
      }
    }
  }

  private pruneDestroyedStructures(): void {
    for (let index = this.fences.length - 1; index >= 0; index--) {
      const fence = this.fences[index];
      if (!fence.isDestroyed()) {
        continue;
      }

      this.occupiedCells.delete(this.getCellKey(fence.cell));
      this.fences.splice(index, 1);
    }
  }

  private createFenceCells(map: WorldMap): readonly GridCoordinate[] {
    const bounds = this.getDefenseRingBounds(map);
    const cells: GridCoordinate[] = [];

    for (let column = bounds.left; column <= bounds.right; column++) {
      this.addFenceCellIfClosed(cells, { column, row: bounds.top }, bounds);
      this.addFenceCellIfClosed(cells, { column, row: bounds.bottom }, bounds);
    }

    for (let row = bounds.top + 1; row < bounds.bottom; row++) {
      this.addFenceCellIfClosed(cells, { column: bounds.left, row }, bounds);
      this.addFenceCellIfClosed(cells, { column: bounds.right, row }, bounds);
    }

    return cells;
  }

  private createTurretCells(map: WorldMap): readonly GridCoordinate[] {
    const generatorTopLeft = this.getGeneratorTopLeftCell(map);
    const size = 2;
    const gap = trialDefenseLayoutTuning.fenceGapFromGeneratorCells;
    const left = generatorTopLeft.column - gap;
    const right = generatorTopLeft.column + size + gap - 1;
    const top = generatorTopLeft.row - gap;
    const bottom = generatorTopLeft.row + size + gap - 1;

    return [
      { column: left, row: top },
      { column: right, row: top },
      { column: left, row: bottom },
      { column: right, row: bottom }
    ];
  }

  private getDefenseRingBounds(map: WorldMap): { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number } {
    const generatorTopLeft = this.getGeneratorTopLeftCell(map);
    const size = 2;
    const gap = trialDefenseLayoutTuning.fenceGapFromGeneratorCells;

    return {
      left: generatorTopLeft.column - gap - 1,
      right: generatorTopLeft.column + size + gap,
      top: generatorTopLeft.row - gap - 1,
      bottom: generatorTopLeft.row + size + gap
    };
  }

  private getGeneratorTopLeftCell(map: WorldMap): GridCoordinate {
    return {
      column: Math.floor(map.grid.columns / 2 - 1),
      row: Math.floor(map.grid.rows / 2 - 1)
    };
  }

  private pickFenceDefinition(cell: GridCoordinate) {
    const order = trialDefenseLayoutTuning.fenceOrder;
    const index = Math.abs(cell.column * 13 + cell.row * 7) % order.length;
    return trialFenceDefinitions[order[index]];
  }

  private addFenceCellIfClosed(
    cells: GridCoordinate[],
    cell: GridCoordinate,
    bounds: { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number }
  ): void {
    if (this.isOpenFenceCell(cell, bounds)) {
      return;
    }

    cells.push(cell);
  }

  private isOpenFenceCell(
    cell: GridCoordinate,
    bounds: { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number }
  ): boolean {
    const centerColumn = Math.floor((bounds.left + bounds.right) / 2);
    const centerRow = Math.floor((bounds.top + bounds.bottom) / 2);

    return trialDefenseLayoutTuning.openFenceCells.some((opening) => {
      if (opening.side === "bottom") {
        return cell.row === bounds.bottom && cell.column === centerColumn + opening.offset;
      }

      if (opening.side === "top") {
        return cell.row === bounds.top && cell.column === centerColumn + opening.offset;
      }

      if (opening.side === "left") {
        return cell.column === bounds.left && cell.row === centerRow + opening.offset;
      }

      return cell.column === bounds.right && cell.row === centerRow + opening.offset;
    });
  }

  private isInsideMap(cell: GridCoordinate): boolean {
    return cell.column >= 0 && cell.row >= 0 && cell.column < this.map.grid.columns && cell.row < this.map.grid.rows;
  }

  private getCellKey(cell: GridCoordinate): string {
    return `${cell.column}:${cell.row}`;
  }
}
