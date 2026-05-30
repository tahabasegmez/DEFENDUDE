import Phaser from "phaser";
import type { GroundSurfaceLayout } from "../../rendering/GroundSurfaceLayout";
import { trialApocalypseTuning, trialWaveTuning, trialZombieTypeTuning } from "../tuning/TrialGameplayTuning";
import type { TrialCollisionBody } from "../collision/TrialCollisionTypes";
import type { TrialDamageableTarget, TrialMeleeTarget } from "../combat/TrialCombatTypes";
import type { TrialDifficultySettings } from "../difficulty/TrialDifficultySettings";
import { TrialNormalZombieController, type TrialZombieType } from "./TrialNormalZombieController";

export interface TrialZombieManagerOptions {
  readonly scene: Phaser.Scene;
  readonly surfaceLayout: GroundSurfaceLayout;
  readonly primaryTargets: readonly TrialMeleeTarget[];
  readonly obstacleTargets: ReadonlyArray<TrialMeleeTarget & TrialCollisionBody>;
  readonly difficulty: TrialDifficultySettings;
  readonly onZombieDeath?: (x: number, y: number, coinDropCount: number) => void;
}

export class TrialZombieManager {
  private readonly scene: Phaser.Scene;
  private readonly surfaceLayout: GroundSurfaceLayout;
  private readonly primaryTargets: readonly TrialMeleeTarget[];
  private readonly obstacleTargets: ReadonlyArray<TrialMeleeTarget & TrialCollisionBody>;
  private readonly difficulty: TrialDifficultySettings;
  private readonly onZombieDeath?: (x: number, y: number, coinDropCount: number) => void;
  private readonly zombies: TrialNormalZombieController[] = [];
  private activeWaveNumber = 0;
  private remainingSpawns = 0;
  private waveSpawnIntervalMs: number = trialWaveTuning.spawnIntervalMs;
  private waveMaxAliveCount: number = trialWaveTuning.maxAliveBase;
  private waveIsActive = false;
  private apocalypseIsActive = false;
  private apocalypseElapsedMs = 0;
  private readonly spawnTimersBySide: Record<"top" | "right" | "bottom" | "left", number> = {
    top: 0,
    right: trialWaveTuning.spawnIntervalMs * 0.25,
    bottom: trialWaveTuning.spawnIntervalMs * 0.5,
    left: trialWaveTuning.spawnIntervalMs * 0.75
  };

  constructor(options: TrialZombieManagerOptions) {
    this.scene = options.scene;
    this.surfaceLayout = options.surfaceLayout;
    this.primaryTargets = options.primaryTargets;
    this.obstacleTargets = options.obstacleTargets;
    this.difficulty = options.difficulty;
    this.onZombieDeath = options.onZombieDeath;
    this.resetSpawnTimers();
  }

  update(deltaMs: number, blockers: readonly TrialCollisionBody[] = []): void {
    if (this.apocalypseIsActive) {
      this.apocalypseElapsedMs += deltaMs;
      this.waveSpawnIntervalMs = Phaser.Math.Linear(
        trialApocalypseTuning.spawnIntervalStartMs,
        trialApocalypseTuning.spawnIntervalMinMs,
        Phaser.Math.Clamp(this.apocalypseElapsedMs / trialApocalypseTuning.spawnIntervalRampDurationMs, 0, 1)
      );
      this.waveMaxAliveCount = Math.round(Phaser.Math.Linear(
        trialApocalypseTuning.maxAliveStart,
        trialApocalypseTuning.maxAliveEnd,
        Phaser.Math.Clamp(this.apocalypseElapsedMs / trialApocalypseTuning.maxAliveRampDurationMs, 0, 1)
      ));
    }
    this.updateContinuousSpawn(deltaMs);

    for (let index = this.zombies.length - 1; index >= 0; index--) {
      const zombie = this.zombies[index];
      zombie.update(deltaMs, blockers);
      if (zombie.isRemoved()) {
        this.zombies.splice(index, 1);
      }
    }
  }

  getDamageableTargets(): readonly TrialDamageableTarget[] {
    return this.zombies.filter((zombie) => zombie.isDamageable());
  }

  getCollisionBodies(): readonly TrialCollisionBody[] {
    return this.zombies.filter((zombie) => zombie.isBlocking());
  }

  startNight(): void {
    this.resetSpawnTimers();
  }

  startWave(waveNumber: number): void {
    this.activeWaveNumber = waveNumber;
    const postTenMultiplier = waveNumber >= 10 ? trialWaveTuning.postTenZombieCountMultiplier : 1;
    this.remainingSpawns = Math.ceil((trialWaveTuning.baseZombieCount + waveNumber * trialWaveTuning.zombiesPerWave) * postTenMultiplier);
    this.waveSpawnIntervalMs = trialWaveTuning.spawnIntervalMs * (waveNumber >= 10 ? trialWaveTuning.postTenSpawnIntervalMultiplier : 1);
    this.waveMaxAliveCount = trialWaveTuning.maxAliveBase + waveNumber * trialWaveTuning.maxAlivePerWave + (waveNumber >= 10 ? trialWaveTuning.postTenMaxAliveBonus : 0);
    this.waveIsActive = true;
    this.resetSpawnTimers();
  }

  isWaveComplete(): boolean {
    return this.waveIsActive && this.remainingSpawns <= 0 && this.zombies.length === 0;
  }

  finishWave(): void {
    this.waveIsActive = false;
    this.remainingSpawns = 0;
  }

  startApocalypse(): void {
    this.apocalypseIsActive = true;
    this.waveIsActive = false;
    this.remainingSpawns = Number.POSITIVE_INFINITY;
    this.apocalypseElapsedMs = 0;
    this.waveSpawnIntervalMs = trialApocalypseTuning.spawnIntervalStartMs;
    this.waveMaxAliveCount = trialApocalypseTuning.maxAliveStart;
    this.resetSpawnTimers();
  }

  startShootingRange(): void {
    this.waveIsActive = false;
    this.apocalypseIsActive = false;
    this.remainingSpawns = 0;
    this.killAll();
    this.spawnShootingRangeDummies();
  }

  getApocalypseElapsedMs(): number {
    return this.apocalypseElapsedMs;
  }

  killAll(): void {
    for (const zombie of this.zombies) {
      zombie.applyDamage(Number.POSITIVE_INFINITY);
    }
  }

  private resetSpawnTimers(): void {
    this.spawnTimersBySide.top = 0;
    this.spawnTimersBySide.right = this.waveSpawnIntervalMs * 0.25;
    this.spawnTimersBySide.bottom = this.waveSpawnIntervalMs * 0.5;
    this.spawnTimersBySide.left = this.waveSpawnIntervalMs * 0.75;
  }

  private updateContinuousSpawn(deltaMs: number): void {
    const sideNames = Object.keys(this.spawnTimersBySide) as Array<keyof typeof this.spawnTimersBySide>;
    const interval = this.waveSpawnIntervalMs / this.difficulty.zombieSpawnRateMultiplier;

    for (const side of sideNames) {
      this.spawnTimersBySide[side] -= deltaMs;
      if (!(this.waveIsActive || this.apocalypseIsActive) || this.remainingSpawns <= 0 || this.spawnTimersBySide[side] > 0 || this.zombies.length >= this.waveMaxAliveCount) {
        continue;
      }

      const point = this.pickSpawnPoint(side);
      this.spawnZombie(point.x, point.y, this.pickZombieType());
      this.remainingSpawns -= 1;
      this.spawnTimersBySide[side] = interval;
    }
  }

  private pickSpawnPoint(side: "top" | "right" | "bottom" | "left"): { readonly x: number; readonly y: number } {
    const margin = this.surfaceLayout.stride;

    if (side === "top") {
      return { x: Phaser.Math.Between(margin, this.surfaceLayout.surfaceWidth - margin), y: margin };
    }

    if (side === "bottom") {
      return {
        x: Phaser.Math.Between(margin, this.surfaceLayout.surfaceWidth - margin),
        y: this.surfaceLayout.surfaceHeight - margin
      };
    }

    if (side === "left") {
      return { x: margin, y: Phaser.Math.Between(margin, this.surfaceLayout.surfaceHeight - margin) };
    }

    return {
      x: this.surfaceLayout.surfaceWidth - margin,
      y: Phaser.Math.Between(margin, this.surfaceLayout.surfaceHeight - margin)
    };
  }

  private spawnZombie(x: number, y: number, zombieType: TrialZombieType): void {
    this.zombies.push(
      new TrialNormalZombieController({
        scene: this.scene,
        x,
        y,
        zombieType,
        primaryTargets: this.primaryTargets,
        obstacleTargets: this.obstacleTargets,
        healthMultiplier: this.difficulty.zombieHealthMultiplier,
        damageMultiplier: this.difficulty.zombieDamageMultiplier,
        onDeath: this.onZombieDeath
      })
    );
  }

  private spawnShootingRangeDummies(): void {
    const zombieTypes = Object.keys(trialZombieTypeTuning) as TrialZombieType[];
    const columnsPerType = 10;
    const spacing = this.surfaceLayout.stride * 1.25;
    const startX = this.surfaceLayout.surfaceWidth / 2 - columnsPerType * spacing / 2;
    const startY = this.surfaceLayout.surfaceHeight / 2 - zombieTypes.length * 4 * spacing;

    for (let typeIndex = 0; typeIndex < zombieTypes.length; typeIndex++) {
      for (let index = 0; index < 30; index++) {
        const column = index % columnsPerType;
        const row = Math.floor(index / columnsPerType);
        this.zombies.push(
          new TrialNormalZombieController({
            scene: this.scene,
            x: startX + column * spacing,
            y: startY + typeIndex * 4 * spacing + row * spacing,
            zombieType: zombieTypes[typeIndex],
            primaryTargets: [],
            obstacleTargets: [],
            healthMultiplier: this.difficulty.zombieHealthMultiplier,
            damageMultiplier: this.difficulty.zombieDamageMultiplier,
            isPassive: true
          })
        );
      }
    }
  }

  private pickZombieType(): TrialZombieType {
    const entries = (Object.entries(trialZombieTypeTuning) as Array<[TrialZombieType, typeof trialZombieTypeTuning[TrialZombieType]]>)
      .filter(([type]) => this.isZombieTypeUnlocked(type));
    const totalWeight = entries.reduce((sum, [, tuning]) => sum + (this.apocalypseIsActive ? 1 : tuning.spawnWeight), 0);
    let roll = Math.random() * totalWeight;

    for (const [type, tuning] of entries) {
      roll -= this.apocalypseIsActive ? 1 : tuning.spawnWeight;
      if (roll <= 0) {
        return type;
      }
    }

    return "normal";
  }

  private isZombieTypeUnlocked(type: TrialZombieType): boolean {
    if (this.apocalypseIsActive) {
      return true;
    }

    if (type === "normal") {
      return true;
    }

    if (type === "fast") {
      return this.activeWaveNumber >= 4;
    }

    return this.activeWaveNumber >= 7;
  }
}
