import Phaser from "phaser";
import type { GridCoordinate } from "../../../core/grid/GridCoordinate";
import type { WorldMap } from "../../../core/world/WorldMap";
import type { GroundSurfaceLayout } from "../../rendering/GroundSurfaceLayout";
import type { TrialCollisionBody } from "../collision/TrialCollisionTypes";
import type { TrialDamageableTarget, TrialProjectileDefinition } from "../combat/TrialCombatTypes";
import { TrialProjectileManager } from "../combat/TrialProjectileManager";
import { trialProjectileDefinitions } from "../combat/TrialWeaponTuning";
import { trialCollisionTuning, trialDamageFeedbackTuning } from "../tuning/TrialGameplayTuning";
import type { TrialTurretDefinition } from "./TrialDefenseTuning";

let nextTurretId = 1;

export interface TrialTurretControllerOptions {
  readonly scene: Phaser.Scene;
  readonly map: WorldMap;
  readonly surfaceLayout: GroundSurfaceLayout;
  readonly projectileManager: TrialProjectileManager;
  readonly cell: GridCoordinate;
  readonly definition: TrialTurretDefinition;
  readonly canDamageStructures: boolean;
}

interface TurretBarrelVisual {
  readonly textureKey: string;
  readonly flipY: boolean;
  readonly artworkForwardRadians: number;
}

export class TrialTurretController implements TrialCollisionBody, TrialDamageableTarget {
  readonly id: string;
  readonly radiusPixels = trialCollisionTuning.turret.radiusPixels;
  readonly marginPixels = trialCollisionTuning.turret.marginPixels;
  readonly collisionExtentsPixels = trialCollisionTuning.turret.extentsPixels;
  readonly collisionMarginsPixels = trialCollisionTuning.turret.marginsPixels;
  readonly cell: GridCoordinate;
  private readonly scene: Phaser.Scene;
  private readonly projectileManager: TrialProjectileManager;
  private readonly definition: TrialTurretDefinition;
  private readonly canDamageStructures: boolean;
  private readonly base: Phaser.GameObjects.Image;
  private readonly barrel: Phaser.GameObjects.Image;
  private readonly baseX: number;
  private readonly baseY: number;
  private cooldownRemainingMs = Phaser.Math.Between(0, 250);
  private aimAngleRadians = 0;
  private currentVisual?: TurretBarrelVisual;

  get x(): number {
    return this.baseX;
  }

  get y(): number {
    return this.baseY;
  }

  constructor(options: TrialTurretControllerOptions) {
    this.id = `trial-turret-${nextTurretId++}`;
    this.cell = options.cell;
    this.scene = options.scene;
    this.projectileManager = options.projectileManager;
    this.definition = options.definition;
    this.canDamageStructures = options.canDamageStructures;

    const position = options.surfaceLayout.gridCellCenterToWorld(options.cell);
    this.baseX = position.x;
    this.baseY = position.y;
    this.base = this.scene.add
      .image(position.x, position.y, options.definition.baseTextureKey)
      .setOrigin(0.5, 0.5)
      .setScale(options.definition.wholeScale * options.definition.baseScale)
      .setDepth(880 + position.y);

    const socketWorld = this.getBaseSocketWorldPosition();
    this.barrel = this.scene.add
      .image(socketWorld.x, socketWorld.y, options.definition.barrelTextures.right)
      .setScale(options.definition.wholeScale * options.definition.barrelScale)
      .setDepth(this.base.depth + 1);
    this.applyBarrelVisual(this.resolveBarrelVisual(0));
  }

  update(deltaMs: number, targets: readonly TrialDamageableTarget[]): void {
    this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - deltaMs);

    const target = this.findNearestTarget(targets);
    if (!target) {
      return;
    }

    const hitCircle = target.getHitCircle();
    const desiredAngle = Phaser.Math.Angle.Between(this.x, this.y, hitCircle.x, hitCircle.y);
    this.aimAngleRadians = Phaser.Math.Angle.RotateTo(
      this.aimAngleRadians,
      desiredAngle,
      this.definition.rotationSpeedRadiansPerSecond * (deltaMs / 1000)
    );
    this.applyBarrelVisual(this.resolveBarrelVisual(this.aimAngleRadians));
    const socketWorld = this.getBaseSocketWorldPosition();
    this.barrel
      .setPosition(socketWorld.x, socketWorld.y)
      .setRotation(this.aimAngleRadians - this.currentVisual!.artworkForwardRadians)
      .setDepth(this.base.depth + 1);

    if (this.cooldownRemainingMs > 0) {
      return;
    }

    this.fireVolley();
    this.cooldownRemainingMs = this.definition.cooldownMs;
  }

  isBlocking(): boolean {
    return true;
  }

  applyDamage(_damage: number): void {
    this.playDamageShake();
  }

  getHitCircle(): Phaser.Geom.Circle {
    return new Phaser.Geom.Circle(this.x, this.y, this.radiusPixels);
  }

  isDamageable(): boolean {
    return true;
  }

  private findNearestTarget(targets: readonly TrialDamageableTarget[]): TrialDamageableTarget | null {
    let nearestTarget: TrialDamageableTarget | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const target of targets) {
      if (!target.isDamageable()) {
        continue;
      }

      const hitCircle = target.getHitCircle();
      const distance = Phaser.Math.Distance.Between(this.x, this.y, hitCircle.x, hitCircle.y);
      if (distance > this.definition.rangePixels || distance >= nearestDistance) {
        continue;
      }

      nearestDistance = distance;
      nearestTarget = target;
    }

    return nearestTarget;
  }

  private fireVolley(): void {
    const projectileDefinition = this.createProjectileDefinition();
    const muzzle = this.barrelLocalPointToWorld(this.definition.muzzleFromBarrelTopLeft);

    for (let shotIndex = 0; shotIndex < this.definition.shotsPerVolley; shotIndex++) {
      for (const angleOffset of this.definition.projectileAngleOffsetsRadians) {
        this.projectileManager.spawn({
          definition: projectileDefinition,
          x: muzzle.x,
          y: muzzle.y,
          angleRadians: this.aimAngleRadians + angleOffset,
          canDamageStructures: this.canDamageStructures
        });
      }
    }
  }

  private createProjectileDefinition(): TrialProjectileDefinition {
    const baseDefinition = trialProjectileDefinitions[this.definition.projectileId];
    return {
      ...baseDefinition,
      id: `turret-${this.definition.kind}-${baseDefinition.id}`,
      speedPixelsPerSecond: this.definition.projectileSpeedPixelsPerSecond,
      damage: this.definition.projectileDamage,
      scale: this.definition.projectileScale
    };
  }

  private getBaseSocketWorldPosition(): Phaser.Math.Vector2 {
    const socket = this.definition.baseSocketFromTopLeft;
    const scale = Math.abs(this.base.scaleX);
    const left = this.base.x - this.base.width * scale * this.base.originX;
    const top = this.base.y - this.base.height * scale * this.base.originY;

    return new Phaser.Math.Vector2(
      left + socket.x * scale,
      top + socket.y * scale
    );
  }

  private resolveBarrelVisual(angleRadians: number): TurretBarrelVisual {
    const normalizedAngle = Phaser.Math.Angle.Normalize(angleRadians);
    const facesLeft = normalizedAngle > Math.PI / 2 && normalizedAngle < Math.PI * 1.5;

    return {
      textureKey: this.definition.barrelTextures.right,
      flipY: facesLeft,
      artworkForwardRadians: this.definition.artworkForwardRadians
    };
  }

  private applyBarrelVisual(visual: TurretBarrelVisual): void {
    if (!this.currentVisual || this.currentVisual.textureKey !== visual.textureKey) {
      this.barrel.setTexture(visual.textureKey);
    }

    this.currentVisual = visual;
    this.barrel.setFlipY(visual.flipY);
    this.applyBarrelOrigin(visual.flipY);
  }

  private applyBarrelOrigin(isMirroredLeft: boolean): void {
    const pivot = this.definition.barrelPivotFromTopLeft;
    const pivotY = isMirroredLeft ? this.barrel.height - pivot.y : pivot.y;
    this.barrel.setOrigin(pivot.x / this.barrel.width, pivotY / this.barrel.height);
  }

  private barrelLocalPointToWorld(pointFromTopLeft: { readonly x: number; readonly y: number }): Phaser.Math.Vector2 {
    const pivot = this.definition.barrelPivotFromTopLeft;
    const isMirroredLeft = this.currentVisual?.flipY ?? false;
    const pivotY = isMirroredLeft ? this.barrel.height - pivot.y : pivot.y;
    const pointY = isMirroredLeft ? this.barrel.height - pointFromTopLeft.y : pointFromTopLeft.y;
    const localX = (pointFromTopLeft.x - pivot.x) * Math.abs(this.barrel.scaleX);
    const localY = (pointY - pivotY) * Math.abs(this.barrel.scaleY);
    const cos = Math.cos(this.barrel.rotation);
    const sin = Math.sin(this.barrel.rotation);

    return new Phaser.Math.Vector2(
      this.barrel.x + localX * cos - localY * sin,
      this.barrel.y + localX * sin + localY * cos
    );
  }

  private playDamageShake(): void {
    const tuning = trialDamageFeedbackTuning.structureShake;
    this.scene.tweens.killTweensOf(this.base);
    this.scene.tweens.add({
      targets: this.base,
      x: this.baseX + tuning.strengthPixels,
      duration: tuning.durationMs / tuning.frequency,
      yoyo: true,
      repeat: tuning.frequency,
      ease: "Sine.easeInOut",
      onComplete: () => this.base.setPosition(this.baseX, this.baseY)
    });
  }
}
