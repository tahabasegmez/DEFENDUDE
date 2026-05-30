import Phaser from "phaser";
import type { GridCoordinate } from "../../../core/grid/GridCoordinate";
import type { WorldMap } from "../../../core/world/WorldMap";
import type { GroundSurfaceLayout } from "../../rendering/GroundSurfaceLayout";
import type { TrialCollisionBody } from "../collision/TrialCollisionTypes";
import type { TrialDamageableTarget } from "../combat/TrialCombatTypes";
import type { TrialProjectileManager } from "../combat/TrialProjectileManager";
import { trialShopTextureKeys } from "../shop/TrialShopAssets";
import { trialPlacementTuning } from "../tuning/TrialGameplayTuning";

let nextMineId = 1;

export interface TrialMineControllerOptions {
  readonly scene: Phaser.Scene;
  readonly map: WorldMap;
  readonly surfaceLayout: GroundSurfaceLayout;
  readonly cell: GridCoordinate;
}

export class TrialMineController implements TrialCollisionBody {
  readonly id: string;
  readonly cell: GridCoordinate;
  readonly radiusPixels = trialPlacementTuning.mineCollision.radiusPixels;
  readonly marginPixels = trialPlacementTuning.mineCollision.marginPixels;
  readonly collisionExtentsPixels = trialPlacementTuning.mineCollision.extentsPixels;
  readonly collisionMarginsPixels = trialPlacementTuning.mineCollision.marginsPixels;
  private readonly sprite: Phaser.GameObjects.Image;
  private isExploded = false;

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  constructor(options: TrialMineControllerOptions) {
    this.id = `trial-mine-${nextMineId++}`;
    this.cell = options.cell;
    const position = options.surfaceLayout.gridCellCenterToWorld(options.cell);
    this.sprite = options.scene.add
      .image(position.x, position.y, trialShopTextureKeys.mine)
      .setOrigin(0.5, 0.5)
      .setScale(trialPlacementTuning.mineScale)
      .setDepth(820 + position.y);
  }

  update(targets: readonly TrialDamageableTarget[], projectileManager: TrialProjectileManager): void {
    if (this.isExploded) {
      return;
    }

    for (const target of targets) {
      if (!target.isDamageable()) {
        continue;
      }

      if (this.circleIntersectsTarget(this.x, this.y, trialPlacementTuning.mineTriggerRadiusPixels, target)) {
        this.explode(projectileManager, targets);
        return;
      }
    }
  }

  isActive(): boolean {
    return !this.isExploded;
  }

  isBlocking(): boolean {
    return false;
  }

  private explode(projectileManager: TrialProjectileManager, targets: readonly TrialDamageableTarget[]): void {
    this.isExploded = true;
    projectileManager.explodeAt(
      this.x,
      this.y,
      trialPlacementTuning.mineExplosionRadiusPixels,
      trialPlacementTuning.mineExplosionDamage,
      targets
    );
    this.sprite.destroy();
  }

  private circleIntersectsTarget(x: number, y: number, radius: number, target: TrialDamageableTarget): boolean {
    const rect = target.getHitRect?.();
    if (rect) {
      const closestX = Phaser.Math.Clamp(x, rect.left, rect.right);
      const closestY = Phaser.Math.Clamp(y, rect.top, rect.bottom);
      return Phaser.Math.Distance.Squared(x, y, closestX, closestY) <= radius * radius;
    }

    const hitCircle = target.getHitCircle();
    return Phaser.Math.Distance.Between(x, y, hitCircle.x, hitCircle.y) <= radius + hitCircle.radius;
  }
}
