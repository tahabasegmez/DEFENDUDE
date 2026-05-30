import Phaser from "phaser";

export const trialCoinTextureKeys = {
  gold: "trial:coin:gold"
} as const;

export function preloadTrialCoinAssets(scene: Phaser.Scene): void {
  scene.load.image(trialCoinTextureKeys.gold, "/assets/shop_icons/left/coin_gold.png");
}
