import Phaser from "phaser";
import type { TrialDamageableTarget, TrialProjectileDefinition } from "./TrialCombatTypes";
import { trialProjectileTextureKeys } from "./TrialProjectileAssets";
import { trialProjectileLightTuning } from "../tuning/TrialGameplayTuning";

export interface TrialProjectileSpawnRequest {
  readonly definition: TrialProjectileDefinition;
  readonly x: number;
  readonly y: number;
  readonly angleRadians: number;
  readonly canDamageStructures?: boolean;
}

interface ActiveProjectile {
  readonly sprite: Phaser.GameObjects.Image;
  readonly velocity: Phaser.Math.Vector2;
  readonly definition: TrialProjectileDefinition;
  readonly canDamageStructures: boolean;
  lifetimeMs: number;
}

interface FadingLight {
  readonly x: number;
  readonly y: number;
  readonly radiusPixels: number;
  readonly initialIntensity: number;
  readonly durationMs: number;
  elapsedMs: number;
}

export class TrialProjectileManager {
  private readonly scene: Phaser.Scene;
  private readonly projectiles: ActiveProjectile[] = [];
  private readonly fadingLights: FadingLight[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  spawn(request: TrialProjectileSpawnRequest): void {
    const sprite = this.scene.add
      .image(request.x, request.y, request.definition.textureKey)
      .setOrigin(0.5, 0.5)
      .setScale(request.definition.scale)
      .setRotation(request.angleRadians - request.definition.artworkForwardRadians)
      .setDepth(20000 + request.y);
    const velocity = new Phaser.Math.Vector2(
      Math.cos(request.angleRadians) * request.definition.speedPixelsPerSecond,
      Math.sin(request.angleRadians) * request.definition.speedPixelsPerSecond
    );

    this.projectiles.push({
      sprite,
      velocity,
      definition: request.definition,
      canDamageStructures: request.canDamageStructures ?? false,
      lifetimeMs: 0
    });
  }

  update(
    deltaMs: number,
    targets: readonly TrialDamageableTarget[] = [],
    structureBlockers: readonly TrialDamageableTarget[] = [],
    gridStridePixels = 1
  ): void {
    for (let index = this.projectiles.length - 1; index >= 0; index--) {
      const projectile = this.projectiles[index];
      projectile.lifetimeMs += deltaMs;
      projectile.sprite.x += projectile.velocity.x * (deltaMs / 1000);
      projectile.sprite.y += projectile.velocity.y * (deltaMs / 1000);
      projectile.sprite.setDepth(20000 + projectile.sprite.y);

      if (this.tryHitTarget(projectile, targets, gridStridePixels)) {
        this.addProjectileFadeLight(projectile);
        projectile.sprite.destroy();
        this.projectiles.splice(index, 1);
        continue;
      }

      if (this.tryHitStructure(projectile, structureBlockers)) {
        this.addProjectileFadeLight(projectile);
        projectile.sprite.destroy();
        this.projectiles.splice(index, 1);
        continue;
      }

      if (projectile.lifetimeMs >= projectile.definition.maxLifetimeMs) {
        this.addProjectileFadeLight(projectile);
        projectile.sprite.destroy();
        this.projectiles.splice(index, 1);
      }
    }

    this.updateFadingLights(deltaMs);
  }

  getLightSources(): ReadonlyArray<{ readonly x: number; readonly y: number; readonly radiusPixels: number; readonly intensity: number }> {
    if (!trialProjectileLightTuning.enabled) {
      return [];
    }

    const activeLights: Array<{ readonly x: number; readonly y: number; readonly radiusPixels: number; readonly intensity: number }> = this.projectiles.map((projectile) => {
      const projectileId = this.getBaseProjectileId(projectile.definition.id);
      const configured = trialProjectileLightTuning.byProjectileId[projectileId as keyof typeof trialProjectileLightTuning.byProjectileId];
      const sizeRadius = Math.max(projectile.sprite.displayWidth, projectile.sprite.displayHeight)
        * trialProjectileLightTuning.radiusFromProjectileSizeMultiplier;

      return {
        x: projectile.sprite.x,
        y: projectile.sprite.y,
        radiusPixels: Math.max(configured?.radiusPixels ?? trialProjectileLightTuning.defaultRadiusPixels, sizeRadius),
        intensity: configured?.intensity ?? trialProjectileLightTuning.defaultIntensity
      };
    });
    const fadingLights = this.fadingLights.map((light) => ({
      x: light.x,
      y: light.y,
      radiusPixels: light.radiusPixels,
      intensity: light.initialIntensity * Math.max(0, 1 - light.elapsedMs / light.durationMs)
    }));

    return activeLights.concat(fadingLights);
  }

  explodeAt(x: number, y: number, radiusPixels: number, damage: number, targets: readonly TrialDamageableTarget[]): void {
    this.spawnExplosion(x, y, radiusPixels);
    this.addExplosionLight(x, y);

    for (const target of targets) {
      if (!target.isDamageable()) {
        continue;
      }

      if (this.circleIntersectsTarget(x, y, radiusPixels, target)) {
        target.applyDamage(damage);
      }
    }
  }

  private tryHitStructure(projectile: ActiveProjectile, structures: readonly TrialDamageableTarget[]): boolean {
    const projectileRadius = Math.max(4, Math.max(projectile.sprite.displayWidth, projectile.sprite.displayHeight) * 0.35);

    for (const structure of structures) {
      if (!structure.isDamageable()) {
        continue;
      }

      if (!this.circleIntersectsTarget(projectile.sprite.x, projectile.sprite.y, projectileRadius, structure)) {
        continue;
      }

      if (projectile.canDamageStructures) {
        structure.applyDamage(projectile.definition.damage);
      }

      return true;
    }

    return false;
  }

  private tryHitTarget(
    projectile: ActiveProjectile,
    targets: readonly TrialDamageableTarget[],
    gridStridePixels: number
  ): boolean {
    const projectileRadius = Math.max(4, Math.max(projectile.sprite.displayWidth, projectile.sprite.displayHeight) * 0.35);

    for (const target of targets) {
      if (!target.isDamageable()) {
        continue;
      }

      if (!this.circleIntersectsTarget(projectile.sprite.x, projectile.sprite.y, projectileRadius, target)) {
        continue;
      }

      this.applyProjectileDamage(projectile, targets, target, gridStridePixels);
      return true;
    }

    return false;
  }

  private applyProjectileDamage(
    projectile: ActiveProjectile,
    targets: readonly TrialDamageableTarget[],
    directHitTarget: TrialDamageableTarget,
    gridStridePixels: number
  ): void {
    if (!projectile.definition.explosionRadiusGridCells) {
      directHitTarget.applyDamage(projectile.definition.damage);
      return;
    }

    const explosionRadius = this.getExplosionRadiusPixels(projectile.definition.explosionRadiusGridCells, gridStridePixels);
    this.spawnExplosion(projectile.sprite.x, projectile.sprite.y, explosionRadius);
    this.addExplosionLight(projectile.sprite.x, projectile.sprite.y);

    for (const target of targets) {
      if (!target.isDamageable()) {
        continue;
      }

      if (this.circleIntersectsTarget(projectile.sprite.x, projectile.sprite.y, explosionRadius, target)) {
        target.applyDamage(projectile.definition.damage);
      }
    }
  }

  private circleIntersectsTarget(x: number, y: number, radius: number, target: TrialDamageableTarget): boolean {
    const rect = target.getHitRect?.();
    if (rect) {
      const closestX = Phaser.Math.Clamp(x, rect.left, rect.right);
      const closestY = Phaser.Math.Clamp(y, rect.top, rect.bottom);
      return Phaser.Math.Distance.Squared(x, y, closestX, closestY) <= radius * radius;
    }

    const hitCircle = target.getHitCircle();
    const distance = Phaser.Math.Distance.Between(x, y, hitCircle.x, hitCircle.y);
    return distance <= radius + hitCircle.radius;
  }

  private getExplosionRadiusPixels(explosionAreaGridCells: number, gridStridePixels: number): number {
    const gridWidth = Math.max(1, Math.sqrt(explosionAreaGridCells));
    return gridWidth * gridStridePixels * 0.5;
  }

  private spawnExplosion(x: number, y: number, radiusPixels: number): void {
    const explosion = this.scene.add
      .image(x, y, trialProjectileTextureKeys.explosion)
      .setOrigin(0.5, 0.5)
      .setDepth(30000 + y);
    const textureWidth = Math.max(1, explosion.width);
    explosion.setScale((radiusPixels * 2) / textureWidth);
    this.scene.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: explosion.scaleX * 1.15,
      duration: 240,
      onComplete: () => explosion.destroy()
    });
  }

  private getBaseProjectileId(projectileId: string): string {
    if (projectileId.includes("rocket")) {
      return "rocket";
    }

    if (projectileId.includes("rifleBullet")) {
      return "rifleBullet";
    }

    return "smallBullet";
  }

  private addProjectileFadeLight(projectile: ActiveProjectile): void {
    const projectileId = this.getBaseProjectileId(projectile.definition.id);
    const configured = trialProjectileLightTuning.byProjectileId[projectileId as keyof typeof trialProjectileLightTuning.byProjectileId];
    this.fadingLights.push({
      x: projectile.sprite.x,
      y: projectile.sprite.y,
      radiusPixels: configured?.radiusPixels ?? trialProjectileLightTuning.defaultRadiusPixels,
      initialIntensity: configured?.intensity ?? trialProjectileLightTuning.defaultIntensity,
      durationMs: trialProjectileLightTuning.fadeOutDurationMs,
      elapsedMs: 0
    });
  }

  private addExplosionLight(x: number, y: number): void {
    this.fadingLights.push({
      x,
      y,
      radiusPixels: trialProjectileLightTuning.explosionRadiusPixels,
      initialIntensity: trialProjectileLightTuning.explosionIntensity,
      durationMs: trialProjectileLightTuning.explosionFadeOutDurationMs,
      elapsedMs: 0
    });
  }

  private updateFadingLights(deltaMs: number): void {
    for (let index = this.fadingLights.length - 1; index >= 0; index--) {
      this.fadingLights[index].elapsedMs += deltaMs;
      if (this.fadingLights[index].elapsedMs >= this.fadingLights[index].durationMs) {
        this.fadingLights.splice(index, 1);
      }
    }
  }
}
