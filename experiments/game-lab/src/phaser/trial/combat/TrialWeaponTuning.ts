import type { TrialProjectileDefinition, TrialWeaponArmDefinition, TrialWeaponDefinition } from "./TrialCombatTypes";
import { trialCharacterTextureKeys } from "../character/TrialCharacterAssets";
import { trialProjectileTextureKeys } from "./TrialProjectileAssets";

export const trialProjectileDefinitions: Readonly<Record<string, TrialProjectileDefinition>> = {
  smallBullet: {
    id: "smallBullet",
    textureKey: trialProjectileTextureKeys.smallBullet,
    scale: 0.15,
    artworkForwardRadians: Math.PI,
    speedPixelsPerSecond: 1250,
    damage: 14,
    maxLifetimeMs: 1400
  },
  rifleBullet: {
    id: "rifleBullet",
    textureKey: trialProjectileTextureKeys.rifleBullet,
    scale: 0.18,
    artworkForwardRadians: Math.PI,
    speedPixelsPerSecond: 1650,
    damage: 28,
    maxLifetimeMs: 1600
  },
  rocket: {
    id: "rocket",
    textureKey: trialProjectileTextureKeys.rocket,
    scale: 0.24,
    artworkForwardRadians: Math.PI,
    speedPixelsPerSecond: 820,
    damage: 80,
    maxLifetimeMs: 2400,
    explosionRadiusGridCells: 9
  }
};

export const trialWeaponDefinitions: Readonly<Record<string, TrialWeaponDefinition>> = {
  pistol: {
    id: "pistol",
    projectileId: "smallBullet",
    cooldownMs: 620,
    magazine: {
      capacity: 12,
      reserveAmmo: "infinite",
      reloadDurationMs: 850
    },
    projectileAngleOffsetsRadians: [0]
  },
  smg: {
    id: "smg",
    projectileId: "smallBullet",
    cooldownMs: 95,
    magazine: {
      capacity: 30,
      reserveAmmo: 120,
      reloadDurationMs: 1200
    },
    projectileAngleOffsetsRadians: [0]
  },
  shotgun: {
    id: "shotgun",
    projectileId: "smallBullet",
    cooldownMs: 900,
    magazine: {
      capacity: 6,
      reserveAmmo: 36,
      reloadDurationMs: 1700
    },
    projectileAngleOffsetsRadians: [-0.10, 0, 0.10]
  },
  rifle: {
    id: "rifle",
    projectileId: "rifleBullet",
    cooldownMs: 260,
    magazine: {
      capacity: 20,
      reserveAmmo: 80,
      reloadDurationMs: 1500
    },
    projectileAngleOffsetsRadians: [0]
  },
  rocketLauncher: {
    id: "rocketLauncher",
    projectileId: "rocket",
    cooldownMs: 1250,
    magazine: {
      capacity: 1,
      reserveAmmo: 8,
      reloadDurationMs: 2100
    },
    projectileAngleOffsetsRadians: [0]
  }
};

export const trialWeaponArmDefinitions: Readonly<Record<string, TrialWeaponArmDefinition>> = {
  pistol: {
    weaponId: "pistol",
    textureKey: trialCharacterTextureKeys.pistolArm,
    pivotFromArmTopLeft: { x: 85, y: 20 },
    muzzleFromArmTopLeft: { x: 6, y: 20 },
    scale: 0.78,
    artworkForwardRadians: Math.PI
  },
  smg: {
    weaponId: "smg",
    textureKey: trialCharacterTextureKeys.smgArm,
    pivotFromArmTopLeft: { x: 122, y: 29 },
    muzzleFromArmTopLeft: { x: 8, y: 19 },
    scale: 0.78,
    artworkForwardRadians: Math.PI
  },
  shotgun: {
    weaponId: "shotgun",
    textureKey: trialCharacterTextureKeys.shotgunArm,
    pivotFromArmTopLeft: { x: 144, y: 16 },
    muzzleFromArmTopLeft: { x: 7, y: 17 },
    scale: 0.78,
    artworkForwardRadians: Math.PI
  },
  rifle: {
    weaponId: "rifle",
    textureKey: trialCharacterTextureKeys.rifleArm,
    pivotFromArmTopLeft: { x: 155, y: 16 },
    muzzleFromArmTopLeft: { x: 7, y: 16 },
    scale: 0.78,
    artworkForwardRadians: Math.PI
  },
  rocketLauncher: {
    weaponId: "rocketLauncher",
    textureKey: trialCharacterTextureKeys.rocketLauncherArm,
    pivotFromArmTopLeft: { x: 155, y: 22 },
    muzzleFromArmTopLeft: { x: 7, y: 24 },
    scale: 0.78,
    artworkForwardRadians: Math.PI
  }
};

export const trialWeaponOrder = ["pistol", "smg", "shotgun", "rifle", "rocketLauncher"] as const;
