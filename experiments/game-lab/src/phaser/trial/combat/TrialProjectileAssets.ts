import Phaser from "phaser";

export const trialProjectileTextureKeys = {
  smallBullet: "trial:projectile:small-bullet",
  rifleBullet: "trial:projectile:rifle-bullet",
  rocket: "trial:projectile:rocket",
  explosion: "trial:projectile:explosion"
} as const;

const projectileAssetBasePath = "/assets/projectiles/left";

export function preloadTrialProjectileAssets(scene: Phaser.Scene): void {
  scene.load.image(
    trialProjectileTextureKeys.smallBullet,
    `${projectileAssetBasePath}/small_bullet.png`
  );
  scene.load.image(
    trialProjectileTextureKeys.rifleBullet,
    `${projectileAssetBasePath}/rifle_bullet.png`
  );
  scene.load.image(
    trialProjectileTextureKeys.rocket,
    `${projectileAssetBasePath}/rocket.png`
  );
  scene.load.image(
    trialProjectileTextureKeys.explosion,
    `${projectileAssetBasePath}/explosion_effect.png`
  );
}
