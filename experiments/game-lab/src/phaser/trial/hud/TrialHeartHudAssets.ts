import Phaser from "phaser";

export const trialHeartHudTextureKeys = {
  full: "trial:hud:heart:full",
  half: "trial:hud:heart:half",
  empty: "trial:hud:heart:empty"
} as const;

const heartAssetBasePath = "/assets/heart_bar_sprites";

export function preloadTrialHeartHudAssets(scene: Phaser.Scene): void {
  scene.load.image(trialHeartHudTextureKeys.full, `${heartAssetBasePath}/heart_full.png`);
  scene.load.image(trialHeartHudTextureKeys.half, `${heartAssetBasePath}/heart_half.png`);
  scene.load.image(trialHeartHudTextureKeys.empty, `${heartAssetBasePath}/heart_empty.png`);
}
