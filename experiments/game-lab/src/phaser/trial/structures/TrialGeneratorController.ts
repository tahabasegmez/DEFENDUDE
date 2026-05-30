import Phaser from "phaser";
import type { GridCoordinate } from "../../../core/grid/GridCoordinate";
import type { WorldMap } from "../../../core/world/WorldMap";
import type { GroundSurfaceLayout } from "../../rendering/GroundSurfaceLayout";
import type { TrialCollisionBody } from "../collision/TrialCollisionTypes";
import type { TrialDamageableTarget, TrialMeleeTarget } from "../combat/TrialCombatTypes";
import { TrialWorldHeartBar } from "../hud/TrialWorldHeartBar";
import { TrialPlayerHealth } from "../player/TrialPlayerHealth";
import { trialCollisionTuning, trialGeneratorTuning } from "../tuning/TrialGameplayTuning";
import { trialStructureTextureKeys } from "./TrialStructureAssets";

export interface TrialGeneratorControllerOptions {
  readonly scene: Phaser.Scene;
  readonly map: WorldMap;
  readonly surfaceLayout: GroundSurfaceLayout;
}

export class TrialGeneratorController implements TrialMeleeTarget, TrialCollisionBody, TrialDamageableTarget {
  readonly id = "trial-generator";
  readonly radiusPixels = trialCollisionTuning.generator.radiusPixels;
  readonly marginPixels = trialCollisionTuning.generator.marginPixels;
  readonly collisionExtentsPixels = trialCollisionTuning.generator.extentsPixels;
  readonly collisionMarginsPixels = trialCollisionTuning.generator.marginsPixels;
  private readonly scene: Phaser.Scene;
  private readonly map: WorldMap;
  private readonly surfaceLayout: GroundSurfaceLayout;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly health = new TrialPlayerHealth(trialGeneratorTuning.maxHalfHearts);
  private readonly healthBar: TrialWorldHeartBar;
  private readonly reservedCells: readonly GridCoordinate[];

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  constructor(options: TrialGeneratorControllerOptions) {
    this.scene = options.scene;
    this.map = options.map;
    this.surfaceLayout = options.surfaceLayout;

    const topLeftCell = this.getCenteredTopLeftCell();
    const position = this.getStructureCenter(topLeftCell);
    const displaySize = this.getStructureDisplaySize();

    this.sprite = this.scene.add
      .image(position.x, position.y, trialStructureTextureKeys.generator)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(displaySize, displaySize)
      .setDepth(900 + position.y);

    this.reservedCells = this.createReservedCells(topLeftCell);
    this.healthBar = new TrialWorldHeartBar({
      scene: this.scene,
      health: this.health,
      scale: trialGeneratorTuning.heartScale,
      spacingPixels: trialGeneratorTuning.heartSpacingPixels,
      depth: 40000
    });
    this.update();
  }

  applyDamage(halfHearts: number): void {
    this.health.applyDamage(halfHearts);
  }

  restoreHealth(currentHalfHearts: number): void {
    this.health.setCurrentHalfHearts(currentHalfHearts);
  }

  getHealthSnapshot(): { readonly currentHalfHearts: number; readonly maxHalfHearts: number } {
    return this.health.getSnapshot();
  }

  isAttackable(): boolean {
    return !this.health.isDead();
  }

  getHitCircle(): Phaser.Geom.Circle {
    return new Phaser.Geom.Circle(this.x, this.y, this.radiusPixels);
  }

  isDamageable(): boolean {
    return !this.health.isDead();
  }

  isDead(): boolean {
    return this.health.isDead();
  }

  getMeleeHitRadius(): number {
    return this.radiusPixels;
  }

  isBlocking(): boolean {
    return !this.health.isDead();
  }

  getReservedCells(): readonly GridCoordinate[] {
    return this.reservedCells;
  }

  update(): void {
    this.healthBar.update(
      this.sprite.x,
      this.sprite.y + this.sprite.displayHeight / 2 + trialGeneratorTuning.heartOffsetYPixels
    );
  }

  private getCenteredTopLeftCell(): GridCoordinate {
    const size = trialGeneratorTuning.gridSize;

    return {
      column: Math.floor(this.map.grid.columns / 2 - size / 2),
      row: Math.floor(this.map.grid.rows / 2 - size / 2)
    };
  }

  private getStructureCenter(topLeftCell: GridCoordinate): { readonly x: number; readonly y: number } {
    const size = trialGeneratorTuning.gridSize;
    const span = this.surfaceLayout.stride * (size - 1);

    return {
      x: topLeftCell.column * this.surfaceLayout.stride + span / 2 + this.map.grid.tileSize / 2,
      y: topLeftCell.row * this.surfaceLayout.stride + span / 2 + this.map.grid.tileSize / 2
    };
  }

  private getStructureDisplaySize(): number {
    const size = trialGeneratorTuning.gridSize;
    return this.surfaceLayout.stride * (size - 1) + this.map.grid.tileSize;
  }

  private createReservedCells(topLeftCell: GridCoordinate): readonly GridCoordinate[] {
    const reservedCells: GridCoordinate[] = [];
    const size = trialGeneratorTuning.gridSize;
    const margin = trialGeneratorTuning.reservedAdjacentCells;
    const startColumn = topLeftCell.column - margin;
    const endColumn = topLeftCell.column + size + margin - 1;
    const startRow = topLeftCell.row - margin;
    const endRow = topLeftCell.row + size + margin - 1;

    for (let row = startRow; row <= endRow; row++) {
      for (let column = startColumn; column <= endColumn; column++) {
        if (column < 0 || row < 0 || column >= this.map.grid.columns || row >= this.map.grid.rows) {
          continue;
        }

        reservedCells.push({ column, row });
      }
    }

    return reservedCells;
  }
}
