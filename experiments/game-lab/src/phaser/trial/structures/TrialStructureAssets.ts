import Phaser from "phaser";

export const trialStructureTextureKeys = {
  generator: "trial:structure:generator"
} as const;

export function preloadTrialStructureAssets(scene: Phaser.Scene): void {
  scene.load.image(
    trialStructureTextureKeys.generator,
    "/assets/structures/generator/generator_2x2.png"
  );
}
