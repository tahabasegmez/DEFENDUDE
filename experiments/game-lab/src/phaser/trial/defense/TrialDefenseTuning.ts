import { trialDefenseTextureKeys } from "./TrialDefenseAssets";

export type TrialFenceKind = "wooden" | "metal" | "electric";
export type TrialTurretKind = "light" | "heavy" | "machinegun";

export interface TrialFenceDefinition {
  readonly kind: TrialFenceKind;
  readonly textureKey: string;
  readonly maxHealth: number;
  readonly electricContactDamage?: number;
}

export interface TrialTurretDefinition {
  readonly kind: TrialTurretKind;
  readonly baseTextureKey: string;
  readonly barrelTextures: {
    readonly right: string;
    readonly up?: string;
    readonly left?: string;
    readonly down?: string;
  };
  readonly projectileId: string;
  readonly projectileSpeedPixelsPerSecond: number;
  readonly projectileDamage: number;
  readonly projectileScale: number;
  readonly rangePixels: number;
  readonly cooldownMs: number;
  readonly shotsPerVolley: number;
  readonly projectileAngleOffsetsRadians: readonly number[];
  readonly rotationSpeedRadiansPerSecond: number;
  readonly wholeScale: number;
  readonly baseScale: number;
  readonly barrelScale: number;
  readonly baseSocketFromTopLeft: {
    readonly x: number;
    readonly y: number;
  };
  readonly barrelPivotFromTopLeft: {
    readonly x: number;
    readonly y: number;
  };
  readonly muzzleFromBarrelTopLeft: {
    readonly x: number;
    readonly y: number;
  };
  readonly artworkForwardRadians: number;
}

export const trialFenceDefinitions: Readonly<Record<TrialFenceKind, TrialFenceDefinition>> = {
  wooden: {
    kind: "wooden",
    textureKey: trialDefenseTextureKeys.fenceWooden,
    maxHealth: 18
  },
  metal: {
    kind: "metal",
    textureKey: trialDefenseTextureKeys.fenceMetal,
    maxHealth: 32
  },
  electric: {
    kind: "electric",
    textureKey: trialDefenseTextureKeys.fenceElectric,
    maxHealth: 40,
    electricContactDamage: 4
  }
};

export const trialTurretDefinitions: Readonly<Record<TrialTurretKind, TrialTurretDefinition>> = {
  light: {
    kind: "light",
    baseTextureKey: trialDefenseTextureKeys.turretBaseLight,
    barrelTextures: {
      right: trialDefenseTextureKeys.turretBarrelLightRight
    },
    projectileId: "smallBullet",
    projectileSpeedPixelsPerSecond: 1150,
    projectileDamage: 10,
    projectileScale: 0.15,
    rangePixels: 760,
    cooldownMs: 520,
    shotsPerVolley: 1,
    projectileAngleOffsetsRadians: [0],
    rotationSpeedRadiansPerSecond: 4.8,
    wholeScale: 1,
    baseScale: 0.54,
    barrelScale: 0.54,
    baseSocketFromTopLeft: { x: 101, y: 31 },
    barrelPivotFromTopLeft: { x: 23, y: 27 },
    muzzleFromBarrelTopLeft: { x: 101, y: 27 },
    artworkForwardRadians: 0
  },
  heavy: {
    kind: "heavy",
    baseTextureKey: trialDefenseTextureKeys.turretBaseHeavy,
    barrelTextures: {
      right: trialDefenseTextureKeys.turretBarrelHeavyRight
    },
    projectileId: "rifleBullet",
    projectileSpeedPixelsPerSecond: 1500,
    projectileDamage: 34,
    projectileScale: 0.18,
    rangePixels: 930,
    cooldownMs: 1150,
    shotsPerVolley: 1,
    projectileAngleOffsetsRadians: [0],
    rotationSpeedRadiansPerSecond: 3.2,
    wholeScale: 1,
    baseScale: 0.52,
    barrelScale: 0.52,
    baseSocketFromTopLeft: { x: 112, y: 44 },
    barrelPivotFromTopLeft: { x: 28, y: 27 },
    muzzleFromBarrelTopLeft: { x: 219, y: 26 },
    artworkForwardRadians: 0
  },
  machinegun: {
    kind: "machinegun",
    baseTextureKey: trialDefenseTextureKeys.turretBaseMachinegun,
    barrelTextures: {
      right: trialDefenseTextureKeys.turretBarrelMachinegunRight
    },
    projectileId: "smallBullet",
    projectileSpeedPixelsPerSecond: 1300,
    projectileDamage: 8,
    projectileScale: 0.13,
    rangePixels: 820,
    cooldownMs: 90,
    shotsPerVolley: 1,
    projectileAngleOffsetsRadians: [0],
    rotationSpeedRadiansPerSecond: 6.4,
    wholeScale: 1,
    baseScale: 0.52,
    barrelScale: 0.52,
    baseSocketFromTopLeft: { x: 105, y: 44 },
    barrelPivotFromTopLeft: { x: 25, y: 29 },
    muzzleFromBarrelTopLeft: { x: 124, y: 28 },
    artworkForwardRadians: 0
  }
};

export const trialDefenseLayoutTuning = {
  fenceGapFromGeneratorCells: 2,
  openFenceCells: [
    { side: "bottom", offset: 0 }
  ] as const,
  fenceOrder: ["wooden", "metal", "electric", "wooden", "metal", "electric"] as readonly TrialFenceKind[],
  turretCornerOrder: ["light", "heavy", "machinegun", "light"] as readonly TrialTurretKind[]
} as const;
