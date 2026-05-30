import Phaser from "phaser";
import type { GridCoordinate, WorldPoint } from "../../../core/grid/GridCoordinate";
import { gameplayCellToVisualTile, type GridCellMapping } from "../../../game/world/GridCellMapping";
import type { GroundSurfaceLayout } from "../../rendering/GroundSurfaceLayout";
import { moveCircleWithBlockers } from "../collision/TrialCollisionResolver";
import type { TrialCollisionBody } from "../collision/TrialCollisionTypes";
import type { TrialMeleeTarget } from "../combat/TrialCombatTypes";
import type { TrialPlayerHealth } from "../player/TrialPlayerHealth";
import { trialCoinTuning, trialCollisionTuning, trialDamageFeedbackTuning, trialDashTuning } from "../tuning/TrialGameplayTuning";
import { trialCharacterAnimationKeys, trialCharacterTextureKeys } from "./TrialCharacterAssets";

export interface TrialCharacterControllerOptions {
  readonly scene: Phaser.Scene;
  readonly surfaceLayout: GroundSurfaceLayout;
  readonly gridCellMapping: GridCellMapping;
  readonly startCell: GridCoordinate;
  readonly health: TrialPlayerHealth;
}

export class TrialCharacterController implements TrialMeleeTarget, TrialCollisionBody {
  private static readonly movementSpeedSurfacePixelsPerSecond = 310;
  readonly id = "trial-player";
  readonly radiusPixels = trialCollisionTuning.character.radiusPixels;
  readonly marginPixels = trialCollisionTuning.character.marginPixels;
  readonly collisionExtentsPixels = trialCollisionTuning.character.extentsPixels;
  readonly collisionMarginsPixels = trialCollisionTuning.character.marginsPixels;

  private readonly scene: Phaser.Scene;
  private readonly surfaceLayout: GroundSurfaceLayout;
  private readonly gridCellMapping: GridCellMapping;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private readonly dashKey: Phaser.Input.Keyboard.Key;
  private readonly health: TrialPlayerHealth;
  private surfacePosition: WorldPoint;
  private lastBlockers: readonly TrialCollisionBody[] = [];
  private lastMovementDirection: WorldPoint = { x: 0, y: 1 };
  private dashCooldownRemainingMs = 0;
  private dashElapsedMs = 0;
  private dashStart: WorldPoint | null = null;
  private dashTarget: WorldPoint | null = null;
  private readonly damageVisualOffset = { x: 0, y: 0 };
  private deathAnimationStarted = false;

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  constructor(options: TrialCharacterControllerOptions) {
    this.scene = options.scene;
    this.surfaceLayout = options.surfaceLayout;
    this.gridCellMapping = options.gridCellMapping;
    this.health = options.health;
    this.surfacePosition = this.gameplayCellToSurfaceCenter(options.startCell);

    const startPoint = this.surfaceLayout.surfacePointToWorld(this.surfacePosition);
    this.sprite = this.scene.add
      .sprite(startPoint.x, startPoint.y, trialCharacterTextureKeys.idle)
      .setOrigin(0.5, 1)
      .setDepth(1000 + startPoint.y);
    this.sprite.play(trialCharacterAnimationKeys.idle);

    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.wasd = this.scene.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    }) as Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
    this.dashKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.snapToSurfacePosition();
  }

  getFollowTarget(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  getBodySprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  getCurrentGridCell(): GridCoordinate {
    return {
      column: Math.floor(this.surfacePosition.x / this.surfaceLayout.stride),
      row: Math.floor(this.surfacePosition.y / this.surfaceLayout.stride)
    };
  }

  applyDamage(halfHearts: number, source?: { readonly x: number; readonly y: number }): void {
    this.health.applyDamage(halfHearts);
    if (source) {
      this.playDamageKnockback(source);
    }
  }

  getCoinPickupTargetWorldPosition(): Phaser.Math.Vector2 {
    const scaleX = Math.abs(this.sprite.scaleX);
    const scaleY = Math.abs(this.sprite.scaleY);
    const frameWidth = this.sprite.frame.realWidth;
    const frameHeight = this.sprite.frame.realHeight;
    const left = this.sprite.x - frameWidth * scaleX * this.sprite.originX;
    const top = this.sprite.y - frameHeight * scaleY * this.sprite.originY;

    return new Phaser.Math.Vector2(
      left + trialCoinTuning.pickupTargetOffsetFromCharacterTopLeft.x * scaleX,
      top + trialCoinTuning.pickupTargetOffsetFromCharacterTopLeft.y * scaleY
    );
  }

  isAttackable(): boolean {
    return !this.health.isDead();
  }

  getMeleeHitRadius(): number {
    return this.radiusPixels;
  }

  isDead(): boolean {
    return this.health.isDead();
  }

  isBlocking(): boolean {
    return !this.health.isDead();
  }

  update(_time: number, delta: number, blockers: readonly TrialCollisionBody[] = []): void {
    this.lastBlockers = blockers;
    if (this.health.isDead()) {
      this.updateDeathPose();
      return;
    }

    this.dashCooldownRemainingMs = Math.max(0, this.dashCooldownRemainingMs - delta);

    if (this.updateDash(delta, blockers)) {
      return;
    }

    const movement = this.readMovementVector();
    const isWalking = movement.x !== 0 || movement.y !== 0;

    if (isWalking) {
      this.lastMovementDirection = movement;
      this.tryStartDash(movement, blockers);
      const seconds = delta / 1000;
      const distance = TrialCharacterController.movementSpeedSurfacePixelsPerSecond * seconds;

      const desiredPosition = this.clampSurfacePosition({
        x: this.surfacePosition.x + movement.x * distance,
        y: this.surfacePosition.y + movement.y * distance
      });
      this.surfacePosition = moveCircleWithBlockers(
        this.surfacePosition,
        desiredPosition,
        this,
        blockers
      );

    }

    const projectedPoint = this.surfaceLayout.surfacePointToWorld(this.surfacePosition);
    this.sprite.setPosition(projectedPoint.x + this.damageVisualOffset.x, projectedPoint.y + this.damageVisualOffset.y);
    this.sprite.setDepth(1000 + this.sprite.y);
    this.sprite.setScale(0.9 * this.surfaceLayout.scaleAtSurfacePoint(this.surfacePosition));

    const desiredAnimation = isWalking ? trialCharacterAnimationKeys.walk : trialCharacterAnimationKeys.idle;

    if (this.sprite.anims.currentAnim?.key !== desiredAnimation) {
      this.sprite.play(desiredAnimation);
    }
  }

  private tryStartDash(movement: WorldPoint, blockers: readonly TrialCollisionBody[]): void {
    if (!Phaser.Input.Keyboard.JustDown(this.dashKey) || this.dashCooldownRemainingMs > 0 || this.dashTarget) {
      return;
    }

    const direction = movement.x !== 0 || movement.y !== 0 ? movement : this.lastMovementDirection;
    const target = this.clampSurfacePosition({
      x: this.surfacePosition.x + direction.x * trialDashTuning.distancePixels,
      y: this.surfacePosition.y + direction.y * trialDashTuning.distancePixels
    });
    const resolvedTarget = moveCircleWithBlockers(this.surfacePosition, target, this, blockers);
    this.dashStart = this.surfacePosition;
    this.dashTarget = resolvedTarget;
    this.dashElapsedMs = 0;
    this.dashCooldownRemainingMs = trialDashTuning.cooldownMs;
  }

  private updateDash(delta: number, blockers: readonly TrialCollisionBody[]): boolean {
    if (!this.dashStart || !this.dashTarget) {
      const movement = this.readMovementVector();
      if (movement.x !== 0 || movement.y !== 0) {
        this.lastMovementDirection = movement;
      }
      this.tryStartDash(movement, blockers);
      return false;
    }

    this.dashElapsedMs = Math.min(trialDashTuning.durationMs, this.dashElapsedMs + delta);
    const progress = this.easeDash(this.dashElapsedMs / trialDashTuning.durationMs);
    const desired = {
      x: Phaser.Math.Linear(this.dashStart.x, this.dashTarget.x, progress),
      y: Phaser.Math.Linear(this.dashStart.y, this.dashTarget.y, progress)
    };
    this.surfacePosition = moveCircleWithBlockers(this.surfacePosition, desired, this, blockers);
    const projectedPoint = this.surfaceLayout.surfacePointToWorld(this.surfacePosition);
    this.sprite.setPosition(projectedPoint.x + this.damageVisualOffset.x, projectedPoint.y + this.damageVisualOffset.y);
    this.sprite.setDepth(1000 + this.sprite.y);
    this.sprite.setScale(0.9 * this.surfaceLayout.scaleAtSurfacePoint(this.surfacePosition));
    this.ensureMovementAnimation();

    if (this.dashElapsedMs >= trialDashTuning.durationMs) {
      this.dashStart = null;
      this.dashTarget = null;
    }

    return true;
  }

  private ensureMovementAnimation(): void {
    if (this.sprite.anims.currentAnim?.key !== trialCharacterAnimationKeys.walk) {
      this.sprite.play(trialCharacterAnimationKeys.walk);
    }
  }

  private easeDash(progress: number): number {
    const easing = trialDashTuning.ease as string;
    if (easing === "Cubic.easeOut") {
      return Phaser.Math.Easing.Cubic.Out(progress);
    }

    if (easing === "Sine.easeOut") {
      return Phaser.Math.Easing.Sine.Out(progress);
    }

    return Phaser.Math.Easing.Quadratic.Out(progress);
  }

  private updateDeathPose(): void {
    if (!this.deathAnimationStarted) {
      this.sprite.play(trialCharacterAnimationKeys.death, true);
      this.deathAnimationStarted = true;
    }

    this.sprite.setDepth(1000 + this.sprite.y);
  }

  private playDamageKnockback(source: { readonly x: number; readonly y: number }): void {
    const tuning = trialDamageFeedbackTuning.playerKnockback;
    const angle = Phaser.Math.Angle.Between(source.x, source.y, this.sprite.x, this.sprite.y);
    const start = this.surfacePosition;
    const target = this.clampSurfacePosition({
      x: start.x + Math.cos(angle) * tuning.distancePixels,
      y: start.y + Math.sin(angle) * tuning.distancePixels
    });
    this.surfacePosition = moveCircleWithBlockers(start, target, this, this.lastBlockers);

    this.damageVisualOffset.x = start.x - target.x;
    this.damageVisualOffset.y = start.y - target.y - tuning.liftPixels;
    this.scene.tweens.killTweensOf(this.damageVisualOffset);
    this.scene.tweens.add({
      targets: this.damageVisualOffset,
      x: 0,
      y: 0,
      duration: tuning.durationMs,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.damageVisualOffset.x = 0;
        this.damageVisualOffset.y = 0;
        this.snapToSurfacePosition();
      }
    });
  }

  private readMovementVector(): WorldPoint {
    const movement = { x: 0, y: 0 };

    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      movement.x -= 1;
    }

    if (this.cursors.right.isDown || this.wasd.right.isDown) {
      movement.x += 1;
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      movement.y -= 1;
    }

    if (this.cursors.down.isDown || this.wasd.down.isDown) {
      movement.y += 1;
    }

    if (movement.x === 0 && movement.y === 0) {
      return movement;
    }

    const length = Math.hypot(movement.x, movement.y);
    return {
      x: movement.x / length,
      y: movement.y / length
    };
  }

  private snapToSurfacePosition(): void {
    const point = this.surfaceLayout.surfacePointToWorld(this.surfacePosition);
    this.sprite.setPosition(point.x, point.y);
    this.sprite.setScale(0.9 * this.surfaceLayout.scaleAtSurfacePoint(this.surfacePosition));
  }

  private gameplayCellToSurfaceCenter(cell: GridCoordinate): WorldPoint {
    const visualTile = gameplayCellToVisualTile(cell, this.gridCellMapping);

    return {
      x: visualTile.column * this.surfaceLayout.stride + this.surfaceLayout.stride / 2,
      y: visualTile.row * this.surfaceLayout.stride + this.surfaceLayout.stride / 2
    };
  }

  private clampSurfacePosition(position: WorldPoint): WorldPoint {
    const margin = this.surfaceLayout.stride / 2;

    return {
      x: Phaser.Math.Clamp(position.x, margin, this.surfaceLayout.surfaceWidth - margin),
      y: Phaser.Math.Clamp(position.y, margin, this.surfaceLayout.surfaceHeight - margin)
    };
  }
}
