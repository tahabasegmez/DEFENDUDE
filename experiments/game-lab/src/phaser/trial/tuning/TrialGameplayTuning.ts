export const trialCameraTuning = {
  zoom: 1.25 / 1.5,
  followLerp: 0.16
} as const;

export const trialTypographyTuning = {
  fontFamily: "Arial",
  coinStackFontSizePixels: 18,
  hudFontSizePixels: 22
} as const;

export const trialAnimationTuning = {
  character: {
    idleFrameRate: 1,
    walkFrameRate: 10,
    deathFrameRate: 7
  },
  normalZombie: {
    walkFrameRate: 6,
    attackFrameRate: 7,
    deathFrameRate: 7
  },
  fastZombie: {
    walkFrameRate: 9,
    attackFrameRate: 9,
    deathFrameRate: 9
  },
  giantZombie: {
    walkFrameRate: 5,
    attackFrameRate: 6,
    deathFrameRate: 6
  }
} as const;

export const trialZombieTypeTuning = {
  normal: {
    movementSpeedSurfacePixelsPerSecond: 115,
    attackRangePixels: 72,
    attackCooldownMs: 950,
    attackDamageHalfHearts: 1,
    maxHealth: 100,
    hitCircleRadiusPixels: 42,
    hitCircleOffsetYPixels: -42,
    hitBoxOffsetPixels: { x: 0, y: -75 },
    hitBoxSizePixels: { width: 42, height: 115 },
    deathDespawnDelayMs: 1000,
    coinDropCount: 2,
    scale: 0.9,
    spawnWeight: 1
  },
  fast: {
    movementSpeedSurfacePixelsPerSecond: 180,
    attackRangePixels: 66,
    attackCooldownMs: 760,
    attackDamageHalfHearts: 2,
    maxHealth: 50,
    hitCircleRadiusPixels: 36,
    hitCircleOffsetYPixels: -38,
    hitBoxOffsetPixels: { x: 0, y: -60 },
    hitBoxSizePixels: { width: 38, height: 100 },
    deathDespawnDelayMs: 900,
    coinDropCount: 3,
    scale: 0.86,
    spawnWeight: 0.45
  },
  giant: {
    movementSpeedSurfacePixelsPerSecond: 72,
    attackRangePixels: 84,
    attackCooldownMs: 1250,
    attackDamageHalfHearts: 4,
    maxHealth: 300,
    hitCircleRadiusPixels: 54,
    hitCircleOffsetYPixels: -52,
    hitBoxOffsetPixels: { x: 0, y: -72 },
    hitBoxSizePixels: { width: 60, height: 130 },
    deathDespawnDelayMs: 1200,
    coinDropCount: 8,
    scale: 1.08,
    spawnWeight: 0.16
  }
} as const;

export const trialZombieSpawnTuning = {
  initialSpawnCount: 4,
  continuousSpawnIntervalMs: 1500,
  maxAliveCount: 24
} as const;

export const trialWaveTuning = {
  startWave: 0,
  baseZombieCount: 8,
  zombiesPerWave: 4,
  postTenZombieCountMultiplier: 1.45,
  postTenSpawnIntervalMultiplier: 0.65,
  postTenMaxAliveBonus: 10,
  spawnIntervalMs: 1250,
  maxAliveBase: 18,
  maxAlivePerWave: 2,
  introStartScale: 0.72,
  introEndScale: 2.4,
  introDurationMs: 2450,
  introOffsetPixels: { x: -120, y: -100 },
  indicatorMarginPixels: { x: 180, y: -60 },
  indicatorFontSizePixels: 28,
  playButtonSizePixels: 40,
  playButtonGapPixels: 14
} as const;

export const trialCollisionTuning = {
  character: {
    radiusPixels: 26,
    marginPixels: 8,
    extentsPixels: { left: 20, right: 20, top: 48, bottom: 6 },
    marginsPixels: { left: 3, right: 3, top: 2, bottom: 2 }
  },
  normalZombie: {
    radiusPixels: 24,
    marginPixels: 6,
    extentsPixels: { left: 19, right: 19, top: 42, bottom: 5 },
    marginsPixels: { left: 3, right: 3, top: 2, bottom: 2 }
  },
  generator: {
    radiusPixels: 118,
    marginPixels: 12,
    extentsPixels: { left: 104, right: 104, top: 104, bottom: 104 },
    marginsPixels: { left: 10, right: 10, top: 10, bottom: 10 }
  },
  fence: {
    radiusPixels: 44,
    marginPixels: 4,
    extentsPixels: { left: 45, right: 45, top: 42, bottom: 42 },
    marginsPixels: { left: 2, right: 2, top: 2, bottom: 2 }
  },
  turret: {
    radiusPixels: 42,
    marginPixels: 8,
    extentsPixels: { left: 44, right: 44, top: 38, bottom: 38 },
    marginsPixels: { left: 5, right: 5, top: 5, bottom: 5 }
  }
} as const;

export const trialPlayerHealthTuning = {
  maxHalfHearts: 10
} as const;

export const trialGeneratorTuning = {
  maxHalfHearts: 20,
  gridSize: 2,
  reservedAdjacentCells: 1,
  heartScale: 0.045,
  heartSpacingPixels: 20,
  heartOffsetYPixels: 18
} as const;

export const trialDifficultyTuning = {
  activeDifficulty: "medium",
  difficulties: {
    easy: {
      friendlyProjectileDamagesStructures: false,
      zombieSpawnRateMultiplier: 0.75,
      zombieHealthMultiplier: 0.85,
      zombieDamageMultiplier: 0.75
    },
    medium: {
      friendlyProjectileDamagesStructures: false,
      zombieSpawnRateMultiplier: 1,
      zombieHealthMultiplier: 1,
      zombieDamageMultiplier: 1
    },
    hard: {
      friendlyProjectileDamagesStructures: true,
      zombieSpawnRateMultiplier: 1.25,
      zombieHealthMultiplier: 1.2,
      zombieDamageMultiplier: 1.25
    },
    apocalypse: {
      friendlyProjectileDamagesStructures: true,
      zombieSpawnRateMultiplier: 1.6,
      zombieHealthMultiplier: 1.55,
      zombieDamageMultiplier: 1.6
    }
  }
} as const;

export const trialCoinTuning = {
  stackMergeDistancePixels: 48,
  pickupDistancePixels: 96,
  pickupTargetOffsetFromCharacterTopLeft: { x: 54, y: 52 },
  magnetStartSpeedPixelsPerSecond: 130,
  magnetAccelerationPixelsPerSecondSquared: 900,
  collectDistancePixels: 20,
  bobAmplitudePixels: 8,
  bobDurationMs: 1150,
  scale: 0.025
} as const;

export const trialDayNightTuning = {
  initialMode: "day",
  nightOverlayAlpha: 0.99,
  generatorLightRadiusPixels: 750,
  generatorLightFadePixels: 320,
  overlayOverscanMultiplier: 1.35,
  transitionDurationMs: 650,
  lightTint: {
    red: 255, // 255
    green: 214, // 214
    blue: 100, // 125
    alpha: 0.10  // 0.10
  }
} as const;

export const trialProjectileLightTuning = {
  enabled: true,
  defaultRadiusPixels: 58,
  radiusFromProjectileSizeMultiplier: 2.4,
  defaultIntensity: 0.45,
  fadeOutDurationMs: 220,
  explosionRadiusPixels: 250,
  explosionIntensity: 0.82,
  explosionFadeOutDurationMs: 820,
  byProjectileId: {
    smallBullet: { radiusPixels: 30, intensity: 0.38 },
    rifleBullet: { radiusPixels: 68, intensity: 0.606 },
    rocket: { radiusPixels: 120, intensity: 0.72 }
  }
} as const;

export const trialHudTuning = {
  scale: 0.35,
  marginPixels: { x: -150, y: 80 },
  stretchToViewportWidth: false,
  portraitVisible: false,
  heartGroupOffsetPixels: { x: 22, y: 5 },
  weaponGroupOffsetPixels: { x: 0, y: 0 },
  weaponAmmoGroupOffsetPixels: { x: 0, y: 0 },
  selectedAmmoOffsetPixels: { x: 0, y: 5 },
  heartSpacingPixels: 28,
  heartRowSpacingPixels: 30,
  heartsPerRow: 5,
  maxVisibleHearts: 10,
  coinTextOffsetFromIconPixels: 20,
  coinIconScale: 0.025,
  coinGroupOffsetPixels: { x: 5, y: 1 },
  weaponIconScale: 0.21,
  portraitScale: 0.74,
  heartScale: 0.055,
  selectedWeaponAmmoFontSizePixels: 44,
  weaponAmmoFontSizePixels: 15
} as const;

export const trialInventoryHudTuning = {
  scale: 0.34,
  marginPixels: { x: 170, y: -50 },
  itemIconScale: 0.13,
  countFontSizePixels: 20,
  itemHitAreaPaddingPixels: { left: 22, right: 110, top: 18, bottom: 18 },
  hoverDimAlpha: 0.28,
  selectionAlpha: 0.22
} as const;

export const trialShopMenuTuning = {
  scale: 0.62,
  tabItemLayout: {
    weapons: {
      iconOffsetPixels: { x: 0, y: -12 },
      iconScale: 0.50,
      priceOffsetPixels: { x: 0, y: 0 },
      priceScale: 1,
      coinOffsetPixels: { x: 44, y: 0 },
      coinScale: 0.018
    },
    turrets: {
      iconOffsetPixels: { x: 0, y: -12 },
      iconScale: 0.50,
      priceOffsetPixels: { x: 0, y: 0 },
      priceScale: 1,
      coinOffsetPixels: { x: 44, y: 0 },
      coinScale: 0.018
    },
    fences: {
      iconOffsetPixels: { x: 0, y: -12 },
      iconScale: 0.50,
      priceOffsetPixels: { x: 0, y: 0 },
      priceScale: 1,
      coinOffsetPixels: { x: 44, y: 0 },
      coinScale: 0.018
    }
  },
  priceFontSizePixels: 20,
  plusFontSizePixels: 50,
  ownedFontSizePixels: 18,
  slotHitAreaPaddingPixels: { left: 22, right: 22, top: 22, bottom: 74 },
  tabHitAreaPaddingPixels: { left: 10, right: 10, top: 8, bottom: 8 },
  hoverDimAlpha: 0.34,
  purchaseFlashAlpha: 0.62,
  purchaseSpinDurationMs: 220
} as const;

export const trialDashTuning = {
  cooldownMs: 850,
  distancePixels: 185,
  durationMs: 210,
  ease: "Quad.easeOut"
} as const;

export const trialPlacementTuning = {
  previewAlpha: 0.55,
  invalidTint: 0xff3434,
  validTint: 0xffffff,
  mineScale: 0.18,
  mineTriggerRadiusPixels: 28,
  mineExplosionRadiusPixels: 170,
  mineExplosionDamage: 95,
  mineCollision: {
    radiusPixels: 30,
    marginPixels: 2,
    extentsPixels: { left: 30, right: 30, top: 30, bottom: 30 },
    marginsPixels: { left: 2, right: 2, top: 2, bottom: 2 }
  }
} as const;

export const trialApocalypseTuning = {
  spawnIntervalStartMs: 1400,
  spawnIntervalMinMs: 430,
  spawnIntervalRampDurationMs: 180000,
  maxAliveStart: 18,
  maxAliveEnd: 64,
  maxAliveRampDurationMs: 240000,
  fastUnlockMs: 25000,
  giantUnlockMs: 70000
} as const;

export const trialMainMenuTuning = {
  overlayColor: 0x020202,
  overlayAlpha: 0.72,
  overlayOverscanMultiplier: 1.4,
  menuOffsetPixels: { x: -120, y: -40 },
  menuScale: 1,
  itemSpacingPixels: 56,
  itemFontSizePixels: 34,
  itemHoverScale: 1.08,
  itemPressedAlpha: 0.62,
  transitionFocusOffsetPixels: { x: -120, y: -40 },
  transitionDurationMs: 420,
  transitionHoldMs: 90,
  lossTextFontSizePixels: 76,
  lossTextStartScale: 0.72,
  lossTextEndScale: 1.8,
  lossTextDurationMs: 1500,
  lossButtonSpacingPixels: 62
} as const;

export const trialFenceDebugHealthTuning = {
  enabled: false,
  maxHearts: 5,
  heartScale: 0.025,
  spacingPixels: 13,
  yOffsetPixels: 56
} as const;

export const trialDamageFeedbackTuning = {
  structureShake: {
    durationMs: 150,
    strengthPixels: 5,
    frequency: 5
  },
  playerKnockback: {
    distancePixels: 28,
    durationMs: 150,
    liftPixels: 10
  }
} as const;
