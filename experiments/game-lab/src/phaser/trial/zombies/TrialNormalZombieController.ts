import Phaser from "phaser";
import { getCollisionRect, moveCircleWithBlockers, segmentIntersectsRect } from "../collision/TrialCollisionResolver";
import type { TrialCollisionBody } from "../collision/TrialCollisionTypes";
import { trialCollisionTuning, trialZombieTypeTuning } from "../tuning/TrialGameplayTuning";
import type { TrialDamageableTarget, TrialMeleeTarget } from "../combat/TrialCombatTypes";
import { trialZombieAnimationKeys, trialZombieTextureKeys } from "./TrialZombieAssets";

export interface TrialNormalZombieControllerOptions {
  readonly scene: Phaser.Scene;
  readonly x: number;
  readonly y: number;
  readonly primaryTargets: readonly TrialMeleeTarget[];
  readonly obstacleTargets: ReadonlyArray<TrialMeleeTarget & TrialCollisionBody>;
  readonly zombieType: TrialZombieType;
  readonly healthMultiplier: number;
  readonly damageMultiplier: number;
  readonly onDeath?: (x: number, y: number, coinDropCount: number) => void;
  readonly isPassive?: boolean;
}

type TrialZombieState = "walking" | "attacking" | "dying" | "dead";
export type TrialZombieType = keyof typeof trialZombieTypeTuning;
let nextTrialZombieId = 1;

export class TrialNormalZombieController implements TrialDamageableTarget, TrialCollisionBody {
  readonly id: string;
  private readonly scene: Phaser.Scene;
  private readonly primaryTargets: readonly TrialMeleeTarget[];
  private readonly obstacleTargets: ReadonlyArray<TrialMeleeTarget & TrialCollisionBody>;
  private readonly type: TrialZombieType;
  private readonly tuning: typeof trialZombieTypeTuning[TrialZombieType];
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly damageMultiplier: number;
  private readonly onDeath?: (x: number, y: number, coinDropCount: number) => void;
  private readonly isPassive: boolean;
  private health: number;
  private state: TrialZombieState = "walking";
  private attackCooldownRemainingMs: number;
  private deathDespawnRemainingMs: number | null = null;

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  get radiusPixels(): number {
    return this.type === "giant" ? 36 : trialCollisionTuning.normalZombie.radiusPixels;
  }

  get marginPixels(): number {
    return trialCollisionTuning.normalZombie.marginPixels;
  }

  get collisionExtentsPixels(): { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number } {
    return this.type === "giant"
      ? { left: 30, right: 30, top: 58, bottom: 6 }
      : trialCollisionTuning.normalZombie.extentsPixels;
  }

  get collisionMarginsPixels(): { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number } {
    return trialCollisionTuning.normalZombie.marginsPixels;
  }

  constructor(options: TrialNormalZombieControllerOptions) {
    this.id = `trial-zombie-${nextTrialZombieId++}`;
    this.scene = options.scene;
    this.type = options.zombieType;
    this.tuning = trialZombieTypeTuning[this.type];
    this.primaryTargets = options.primaryTargets;
    this.obstacleTargets = options.obstacleTargets;
    this.damageMultiplier = options.damageMultiplier;
    this.onDeath = options.onDeath;
    this.isPassive = options.isPassive ?? false;
    this.health = this.tuning.maxHealth * options.healthMultiplier;
    this.attackCooldownRemainingMs = Phaser.Math.Between(0, this.tuning.attackCooldownMs);
    this.sprite = this.scene.add
      .sprite(options.x, options.y, this.getTextureKeys().walk)
      .setOrigin(0.5, 1)
      .setScale(this.tuning.scale)
      .setDepth(1000 + options.y);
    this.sprite.play(this.getAnimationKeys().walk);
  }

  update(deltaMs: number, blockers: readonly TrialCollisionBody[] = []): void {
    if (this.state === "dead") {
      return;
    }

    if (this.state === "dying") {
      this.updateDeath(deltaMs);
      return;
    }

    this.attackCooldownRemainingMs = Math.max(0, this.attackCooldownRemainingMs - deltaMs);

    if (this.isPassive) {
      this.state = "walking";
      this.ensureAnimation(this.getAnimationKeys().walk);
      this.sprite.setDepth(1000 + this.sprite.y);
      return;
    }

    const target = this.findNearestAttackableTarget();
    if (!target) {
      this.ensureAnimation(this.getAnimationKeys().walk);
      return;
    }

    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const distance = Math.hypot(dx, dy);
    const targetHitRadius = target.getMeleeHitRadius?.() ?? 0;
    const isInAttackRange = distance <= this.tuning.attackRangePixels + targetHitRadius;

    this.sprite.setFlipX(dx > 0);
    this.sprite.setDepth(1000 + this.sprite.y);

    if (isInAttackRange) {
      this.tryAttack(target);
      return;
    }

    this.moveTowardTarget(dx, dy, distance, deltaMs, blockers);
  }

  applyDamage(damage: number): void {
    if (!this.isDamageable()) {
      return;
    }

    this.health = Math.max(0, this.health - damage);
    if (this.health <= 0) {
      this.startDeath();
    }
  }

  getHitCircle(): Phaser.Geom.Circle {
    return new Phaser.Geom.Circle(
      this.sprite.x,
      this.sprite.y + this.tuning.hitCircleOffsetYPixels,
      this.tuning.hitCircleRadiusPixels * Math.abs(this.sprite.scaleX)
    );
  }

  getHitRect(): Phaser.Geom.Rectangle {
    const scale = Math.abs(this.sprite.scaleX);
    const width = this.tuning.hitBoxSizePixels.width * scale;
    const height = this.tuning.hitBoxSizePixels.height * scale;
    const centerX = this.sprite.x + this.tuning.hitBoxOffsetPixels.x * scale;
    const centerY = this.sprite.y + this.tuning.hitBoxOffsetPixels.y * scale;
    return new Phaser.Geom.Rectangle(centerX - width / 2, centerY - height / 2, width, height);
  }

  isDamageable(): boolean {
    return this.state === "walking" || this.state === "attacking";
  }

  isBlocking(): boolean {
    return this.isDamageable();
  }

  isRemoved(): boolean {
    return this.state === "dead";
  }

  private moveTowardTarget(
    dx: number,
    dy: number,
    distance: number,
    deltaMs: number,
    blockers: readonly TrialCollisionBody[]
  ): void {
    if (distance <= 0) {
      return;
    }

    const speed = this.tuning.movementSpeedSurfacePixelsPerSecond * (deltaMs / 1000);
    const current = { x: this.sprite.x, y: this.sprite.y };
    const next = moveCircleWithBlockers(
      current,
      {
        x: this.sprite.x + (dx / distance) * speed,
        y: this.sprite.y + (dy / distance) * speed
      },
      this,
      blockers
    );
    this.sprite.setPosition(next.x, next.y);

    this.state = "walking";
    this.ensureAnimation(this.getAnimationKeys().walk);
  }

  private tryAttack(target: TrialMeleeTarget): void {
    this.state = "attacking";
    this.ensureAnimation(this.getAnimationKeys().attack);

    if (this.attackCooldownRemainingMs > 0) {
      return;
    }

    target.applyDamage(Math.max(1, Math.round(this.tuning.attackDamageHalfHearts * this.damageMultiplier)), this);
    target.onMeleeAttacked?.(this);
    if (!this.isDamageable()) {
      return;
    }

    this.sprite.play(this.getAnimationKeys().attack, true);
    this.attackCooldownRemainingMs = this.tuning.attackCooldownMs;
  }

  private findNearestAttackableTarget(): TrialMeleeTarget | null {
    const primaryTarget = this.findNearestPrimaryTarget();
    if (!primaryTarget) {
      return null;
    }

    return this.findBlockingObstacle(primaryTarget) ?? primaryTarget;
  }

  private findNearestPrimaryTarget(): TrialMeleeTarget | null {
    let nearestTarget: TrialMeleeTarget | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const target of this.primaryTargets) {
      if (!target.isAttackable()) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, target.x, target.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTarget = target;
      }
    }

    return nearestTarget;
  }

  private findBlockingObstacle(primaryTarget: TrialMeleeTarget): (TrialMeleeTarget & TrialCollisionBody) | null {
    let nearestObstacle: (TrialMeleeTarget & TrialCollisionBody) | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    const start = { x: this.sprite.x, y: this.sprite.y };
    const end = { x: primaryTarget.x, y: primaryTarget.y };

    for (const obstacle of this.obstacleTargets) {
      if (!obstacle.isAttackable() || !obstacle.isBlocking()) {
        continue;
      }

      if (!segmentIntersectsRect(start, end, getCollisionRect(obstacle))) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, obstacle.x, obstacle.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestObstacle = obstacle;
      }
    }

    return nearestObstacle;
  }

  private ensureAnimation(animationKey: string): void {
    if (this.sprite.anims.currentAnim?.key !== animationKey || !this.sprite.anims.isPlaying) {
      this.sprite.play(animationKey);
    }
  }

  private startDeath(): void {
    this.state = "dying";
    this.onDeath?.(this.sprite.x, this.sprite.y, this.tuning.coinDropCount);
    this.sprite.play(this.getAnimationKeys().death, true);
  }

  private updateDeath(deltaMs: number): void {
    this.sprite.setDepth(1000 + this.sprite.y);

    if (this.sprite.anims.isPlaying) {
      return;
    }

    if (this.deathDespawnRemainingMs === null) {
      this.deathDespawnRemainingMs = this.tuning.deathDespawnDelayMs;
      return;
    }

    this.deathDespawnRemainingMs -= deltaMs;
    if (this.deathDespawnRemainingMs <= 0) {
      this.state = "dead";
      this.sprite.destroy();
    }
  }

  private getTextureKeys(): { readonly walk: string; readonly attack: string; readonly death: string } {
    if (this.type === "fast") {
      return {
        walk: trialZombieTextureKeys.fastWalk,
        attack: trialZombieTextureKeys.fastAttack,
        death: trialZombieTextureKeys.fastDeath
      };
    }

    if (this.type === "giant") {
      return {
        walk: trialZombieTextureKeys.giantWalk,
        attack: trialZombieTextureKeys.giantAttack,
        death: trialZombieTextureKeys.giantDeath
      };
    }

    return {
      walk: trialZombieTextureKeys.normalWalk,
      attack: trialZombieTextureKeys.normalAttack,
      death: trialZombieTextureKeys.normalDeath
    };
  }

  private getAnimationKeys(): { readonly walk: string; readonly attack: string; readonly death: string } {
    if (this.type === "fast") {
      return {
        walk: trialZombieAnimationKeys.fastWalk,
        attack: trialZombieAnimationKeys.fastAttack,
        death: trialZombieAnimationKeys.fastDeath
      };
    }

    if (this.type === "giant") {
      return {
        walk: trialZombieAnimationKeys.giantWalk,
        attack: trialZombieAnimationKeys.giantAttack,
        death: trialZombieAnimationKeys.giantDeath
      };
    }

    return {
      walk: trialZombieAnimationKeys.normalWalk,
      attack: trialZombieAnimationKeys.normalAttack,
      death: trialZombieAnimationKeys.normalDeath
    };
  }
}
