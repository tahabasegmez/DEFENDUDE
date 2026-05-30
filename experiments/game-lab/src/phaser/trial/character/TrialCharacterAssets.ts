import Phaser from "phaser";
import { trialAnimationTuning } from "../tuning/TrialGameplayTuning";

export const trialCharacterTextureKeys = {
  idle: "trial:character:idle",
  walk: "trial:character:walk",
  death: "trial:character:death",
  pistolArm: "trial:character:weapon:pistol-arm",
  smgArm: "trial:character:weapon:smg-arm",
  shotgunArm: "trial:character:weapon:shotgun-arm",
  rifleArm: "trial:character:weapon:rifle-arm",
  rocketLauncherArm: "trial:character:weapon:rocket-launcher-arm"
} as const;

export const trialCharacterAnimationKeys = {
  idle: "trial:character:idle",
  walk: "trial:character:walk",
  death: "trial:character:death"
} as const;

const characterAssetBasePath = "/assets/character";

export function preloadTrialCharacterAssets(scene: Phaser.Scene): void {
  scene.load.image(
    trialCharacterTextureKeys.idle,
    `${characterAssetBasePath}/left/idle/body_frame_01.png`
  );
  scene.load.atlas(
    trialCharacterTextureKeys.walk,
    `${characterAssetBasePath}/left/walk/spritesheet/main_character_walk_sheet.png`,
    `${characterAssetBasePath}/left/walk/spritesheet/main_character_walk.json`
  );
  scene.load.atlas(
    trialCharacterTextureKeys.death,
    `${characterAssetBasePath}/left/death/spritesheet/main_character_death_sheet.png`,
    `${characterAssetBasePath}/left/death/spritesheet/main_character_death.json`
  );
  scene.load.image(
    trialCharacterTextureKeys.pistolArm,
    `${characterAssetBasePath}/left/weapon_with_arm/pistol/arm_weapon_pistol_normal_85_20.png`
  );
  scene.load.image(
    trialCharacterTextureKeys.smgArm,
    `${characterAssetBasePath}/left/weapon_with_arm/smg/arm_weapon_smg_normal_122_29.png`
  );
  scene.load.image(
    trialCharacterTextureKeys.shotgunArm,
    `${characterAssetBasePath}/left/weapon_with_arm/shotgun/arm_weapon_shotgun_normal_144_16.png`
  );
  scene.load.image(
    trialCharacterTextureKeys.rifleArm,
    `${characterAssetBasePath}/left/weapon_with_arm/rifle/arm_weapon_rifle_normal_155_16.png`
  );
  scene.load.image(
    trialCharacterTextureKeys.rocketLauncherArm,
    `${characterAssetBasePath}/left/weapon_with_arm/rocket_launcher/arm_weapon_rocket_launcher_normal_155_22.png`
  );
}

export function createTrialCharacterAnimations(scene: Phaser.Scene): void {
  createAnimationIfMissing(scene, {
    key: trialCharacterAnimationKeys.idle,
    frames: [{ key: trialCharacterTextureKeys.idle }],
    frameRate: trialAnimationTuning.character.idleFrameRate,
    repeat: -1
  });
  createAnimationIfMissing(scene, {
    key: trialCharacterAnimationKeys.walk,
    frames: createAtlasFrames(trialCharacterTextureKeys.walk, "body_frame_01", 6),
    frameRate: trialAnimationTuning.character.walkFrameRate,
    repeat: -1
  });
  createAnimationIfMissing(scene, {
    key: trialCharacterAnimationKeys.death,
    frames: createAtlasFrames(trialCharacterTextureKeys.death, "body_frame_10", 5),
    frameRate: trialAnimationTuning.character.deathFrameRate,
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
