import Phaser from "phaser";

export interface TrialProjectileDefinition {
  readonly id: string;
  readonly textureKey: string;
  readonly scale: number;
  readonly artworkForwardRadians: number;
  readonly speedPixelsPerSecond: number;
  readonly damage: number;
  readonly maxLifetimeMs: number;
  readonly explosionRadiusGridCells?: number;
}

export interface TrialDamageableTarget {
  readonly x: number;
  readonly y: number;
  applyDamage(damage: number): void;
  getHitCircle(): Phaser.Geom.Circle;
  getHitRect?(): Phaser.Geom.Rectangle;
  isDamageable(): boolean;
}

export interface TrialMeleeTarget {
  readonly x: number;
  readonly y: number;
  applyDamage(halfHearts: number, source?: { readonly x: number; readonly y: number }): void;
  isAttackable(): boolean;
  getMeleeHitRadius?(): number;
  onMeleeAttacked?(attacker: TrialDamageableTarget): void;
}

export interface TrialMagazineDefinition {
  readonly capacity: number;
  readonly reserveAmmo: number | "infinite";
  readonly reloadDurationMs: number;
}

export interface TrialWeaponDefinition {
  readonly id: string;
  readonly projectileId: string;
  readonly cooldownMs: number;
  readonly magazine: TrialMagazineDefinition | null;
  readonly projectileAngleOffsetsRadians: readonly number[];
}

export interface TrialWeaponArmDefinition {
  readonly weaponId: string;
  readonly textureKey: string;
  readonly pivotFromArmTopLeft: {
    readonly x: number;
    readonly y: number;
  };
  readonly muzzleFromArmTopLeft: {
    readonly x: number;
    readonly y: number;
  };
  readonly scale: number;
  readonly artworkForwardRadians: number;
}

export interface TrialWeaponRuntimeSnapshot {
  readonly weaponId: string;
  readonly magazineCapacity: number | "infinite";
  readonly cooldownRemainingMs: number;
  readonly isReloading: boolean;
  readonly reloadRemainingMs: number;
  readonly reloadDurationMs: number;
  readonly ammoInMagazine: number | "infinite";
  readonly reserveAmmo: number | "infinite";
}
