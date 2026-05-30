import Phaser from "phaser";
import type { GridCoordinate } from "../../../core/grid/GridCoordinate";
import type { WorldMap } from "../../../core/world/WorldMap";
import type { GroundSurfaceLayout } from "../../rendering/GroundSurfaceLayout";
import type { TrialCollisionBody } from "../collision/TrialCollisionTypes";
import type { TrialDamageableTarget, TrialMeleeTarget } from "../combat/TrialCombatTypes";
import { trialCollisionTuning, trialDamageFeedbackTuning } from "../tuning/TrialGameplayTuning";
import type { TrialFenceDefinition } from "./TrialDefenseTuning";

let nextFenceId = 1;

export interface TrialFenceControllerOptions {
  readonly scene: Phaser.Scene;
  readonly map: WorldMap;
  readonly surfaceLayout: GroundSurfaceLayout;
  readonly cell: GridCoordinate;
  readonly definition: TrialFenceDefinition;
}

export class TrialFenceController implements TrialMeleeTarget, TrialCollisionBody, TrialDamageableTarget {
  readonly id: string;
  readonly radiusPixels = trialCollisionTuning.fence.radiusPixels;
  readonly marginPixels = trialCollisionTuning.fence.marginPixels;
  readonly collisionExtentsPixels = trialCollisionTuning.fence.extentsPixels;
  readonly collisionMarginsPixels = trialCollisionTuning.fence.marginsPixels;
  readonly cell: GridCoordinate;
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly definition: TrialFenceDefinition;
  private readonly baseX: number;
  private readonly baseY: number;
  private health: number;
  private destroyed = false;

  get x(): number {
    return this.baseX;
  }

  get y(): number {
    return this.baseY;
  }

  constructor(options: TrialFenceControllerOptions) {
    this.id = `trial-fence-${nextFenceId++}`;
    this.scene = options.scene;
    this.definition = options.definition;
    this.cell = options.cell;
    this.health = options.definition.maxHealth;

    const position = options.surfaceLayout.gridCellCenterToWorld(options.cell);
    this.baseX = position.x;
    this.baseY = position.y;
    const displaySize = options.map.grid.tileSize;
    this.sprite = options.scene.add
      .image(position.x, position.y, options.definition.textureKey)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(displaySize, displaySize)
      .setDepth(850 + position.y);
  }

  applyDamage(damage: number): void {
    if (this.destroyed) {
      return;
    }

    this.health = Math.max(0, this.health - damage);
    this.playDamageShake();
    if (this.health <= 0) {
      this.destroyed = true;
      this.sprite.destroy();
    }
  }

  onMeleeAttacked(attacker: TrialDamageableTarget): void {
    if (!this.definition.electricContactDamage || this.destroyed) {
      return;
    }

    attacker.applyDamage(this.definition.electricContactDamage);
  }

  isAttackable(): boolean {
    return !this.destroyed;
  }

  getHitCircle(): Phaser.Geom.Circle {
    return new Phaser.Geom.Circle(this.x, this.y, this.radiusPixels);
  }

  isDamageable(): boolean {
    return !this.destroyed;
  }

  getMeleeHitRadius(): number {
    return this.radiusPixels;
  }

  isBlocking(): boolean {
    return !this.destroyed;
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  private playDamageShake(): void {
    const tuning = trialDamageFeedbackTuning.structureShake;
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + tuning.strengthPixels,
      duration: tuning.durationMs / tuning.frequency,
      yoyo: true,
      repeat: tuning.frequency,
      ease: "Sine.easeInOut",
      onComplete: () => this.sprite.setPosition(this.baseX, this.baseY)
    });
  }

}
