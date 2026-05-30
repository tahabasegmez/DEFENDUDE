import Phaser from "phaser";
import { trialAnimationTuning } from "../tuning/TrialGameplayTuning";

export const trialZombieTextureKeys = {
  normalWalk: "trial:zombie:normal:walk",
  normalAttack: "trial:zombie:normal:attack",
  normalDeath: "trial:zombie:normal:death",
  fastWalk: "trial:zombie:fast:walk",
  fastAttack: "trial:zombie:fast:attack",
  fastDeath: "trial:zombie:fast:death",
  giantWalk: "trial:zombie:giant:walk",
  giantAttack: "trial:zombie:giant:attack",
  giantDeath: "trial:zombie:giant:death"
} as const;

export const trialZombieAnimationKeys = {
  normalWalk: "trial:zombie:normal:walk",
  normalAttack: "trial:zombie:normal:attack",
  normalDeath: "trial:zombie:normal:death",
  fastWalk: "trial:zombie:fast:walk",
  fastAttack: "trial:zombie:fast:attack",
  fastDeath: "trial:zombie:fast:death",
  giantWalk: "trial:zombie:giant:walk",
  giantAttack: "trial:zombie:giant:attack",
  giantDeath: "trial:zombie:giant:death"
} as const;

const normalZombieAssetBasePath = "/assets/zombies/left/normal_zombie";
const fastZombieAssetBasePath = "/assets/zombies/left/fast_zombie";
const giantZombieAssetBasePath = "/assets/zombies/left/tank_zombie";

export function preloadTrialZombieAssets(scene: Phaser.Scene): void {
  scene.load.atlas(
    trialZombieTextureKeys.normalWalk,
    `${normalZombieAssetBasePath}/walk/spritesheet/normal_zombie_walk_sheet.png`,
    `${normalZombieAssetBasePath}/walk/spritesheet/normal_zombie_walk.json`
  );
  scene.load.atlas(
    trialZombieTextureKeys.normalAttack,
    `${normalZombieAssetBasePath}/attack/spritesheet/normal_zombie_attack_sheet.png`,
    `${normalZombieAssetBasePath}/attack/spritesheet/normal_zombie_attack.json`
  );
  scene.load.atlas(
    trialZombieTextureKeys.normalDeath,
    `${normalZombieAssetBasePath}/death/spritesheet/normal_zombie_death_sheet_trimmedcells.png`,
    `${normalZombieAssetBasePath}/death/spritesheet/normal_zombie_death.json`
  );
  scene.load.atlas(
    trialZombieTextureKeys.fastWalk,
    `${fastZombieAssetBasePath}/walk/spritesheet/fast_zombie_frame_01-sheet.png`,
    `${fastZombieAssetBasePath}/walk/spritesheet/fast_zombie_frame_01.json`
  );
  scene.load.atlas(
    trialZombieTextureKeys.fastAttack,
    `${fastZombieAssetBasePath}/attack/spritesheet/fast_zombie_frame_01-sheet.png`,
    `${fastZombieAssetBasePath}/attack/spritesheet/fast_zombie_frame_01.json`
  );
  scene.load.atlas(
    trialZombieTextureKeys.fastDeath,
    `${fastZombieAssetBasePath}/death/spritesheet/fast_zombie_frame_06-sheet.png`,
    `${fastZombieAssetBasePath}/death/spritesheet/fast_zombie_frame_06.json`
  );
  scene.load.atlas(
    trialZombieTextureKeys.giantWalk,
    `${giantZombieAssetBasePath}/walk/spritesheet/tank_zombie_frame_01-sheet.png`,
    `${giantZombieAssetBasePath}/walk/spritesheet/tank_zombie_frame_01.json`
  );
  scene.load.atlas(
    trialZombieTextureKeys.giantAttack,
    `${giantZombieAssetBasePath}/attack/spritesheet/tank_zombie_frame_02-sheet.png`,
    `${giantZombieAssetBasePath}/attack/spritesheet/tank_zombie_frame_02.json`
  );
  scene.load.atlas(
    trialZombieTextureKeys.giantDeath,
    `${giantZombieAssetBasePath}/death/spritesheet/tank_zombie_frame_04-sheet.png`,
    `${giantZombieAssetBasePath}/death/spritesheet/tank_zombie_frame_04.json`
  );
}

export function createTrialZombieAnimations(scene: Phaser.Scene): void {
  createAnimationIfMissing(scene, {
    key: trialZombieAnimationKeys.normalWalk,
    frames: createAtlasFrames(trialZombieTextureKeys.normalWalk, "normal_zombie_frame_01", 3),
    frameRate: trialAnimationTuning.normalZombie.walkFrameRate,
    repeat: -1
  });
  createAnimationIfMissing(scene, {
    key: trialZombieAnimationKeys.normalAttack,
    frames: createAtlasFrames(trialZombieTextureKeys.normalAttack, "normal_zombie_frame_01", 3),
    frameRate: trialAnimationTuning.normalZombie.attackFrameRate,
    repeat: 0
  });
  createAnimationIfMissing(scene, {
    key: trialZombieAnimationKeys.normalDeath,
    frames: createAtlasFrames(trialZombieTextureKeys.normalDeath, "normal_zombie_frame_01", 3),
    frameRate: trialAnimationTuning.normalZombie.deathFrameRate,
    repeat: 0
  });
  createAnimationIfMissing(scene, {
    key: trialZombieAnimationKeys.fastWalk,
    frames: createAtlasFrames(trialZombieTextureKeys.fastWalk, "fast_zombie_frame_01", 5),
    frameRate: trialAnimationTuning.fastZombie.walkFrameRate,
    repeat: -1
  });
  createAnimationIfMissing(scene, {
    key: trialZombieAnimationKeys.fastAttack,
    frames: createAtlasFrames(trialZombieTextureKeys.fastAttack, "fast_zombie_frame_01", 5),
    frameRate: trialAnimationTuning.fastZombie.attackFrameRate,
    repeat: 0
  });
  createAnimationIfMissing(scene, {
    key: trialZombieAnimationKeys.fastDeath,
    frames: createAtlasFrames(trialZombieTextureKeys.fastDeath, "fast_zombie_frame_06", 4),
    frameRate: trialAnimationTuning.fastZombie.deathFrameRate,
    repeat: 0
  });
  createAnimationIfMissing(scene, {
    key: trialZombieAnimationKeys.giantWalk,
    frames: createAtlasFrames(trialZombieTextureKeys.giantWalk, "tank_zombie_frame_01", 5),
    frameRate: trialAnimationTuning.giantZombie.walkFrameRate,
    repeat: -1
  });
  createAnimationIfMissing(scene, {
    key: trialZombieAnimationKeys.giantAttack,
    frames: createAtlasFrames(trialZombieTextureKeys.giantAttack, "tank_zombie_frame_02", 5),
    frameRate: trialAnimationTuning.giantZombie.attackFrameRate,
    repeat: 0
  });
  createAnimationIfMissing(scene, {
    key: trialZombieAnimationKeys.giantDeath,
    frames: createAtlasFrames(trialZombieTextureKeys.giantDeath, "tank_zombie_frame_04", 3),
    frameRate: trialAnimationTuning.giantZombie.deathFrameRate,
    repeat: 0
  });
}

function createAtlasFrames(textureKey: string, framePrefix: string, frameCount: number): Phaser.Types.Animations.AnimationFrame[] {
  return Array.from({ length: frameCount }, (_, index) => ({
    key: textureKey,
    frame: `${framePrefix} ${index}.png`
  }));
}

function createAnimationIfMissing(
  scene: Phaser.Scene,
  config: Phaser.Types.Animations.Animation & { key: string }
): void {
  if (scene.anims.exists(config.key)) {
    return;
  }

  scene.anims.create(config);
}
