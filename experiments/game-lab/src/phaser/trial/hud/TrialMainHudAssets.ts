import Phaser from "phaser";

export const trialMainHudTextureKeys = {
  panel: "trial:hud:main:panel"
} as const;

export function preloadTrialMainHudAssets(scene: Phaser.Scene): void {
  scene.load.image(trialMainHudTextureKeys.panel, "/assets/main_hud/hud_post_apocalyptic.png");
}
