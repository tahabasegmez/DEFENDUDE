import Phaser from "phaser";

export const trialDefenseTextureKeys = {
  fenceWooden: "trial:defense:fence:wooden",
  fenceMetal: "trial:defense:fence:metal",
  fenceElectric: "trial:defense:fence:electric",
  turretBaseLight: "trial:defense:turret:base:light",
  turretBaseHeavy: "trial:defense:turret:base:heavy",
  turretBaseMachinegun: "trial:defense:turret:base:machinegun",
  turretBarrelLightRight: "trial:defense:turret:barrel:light:right",
  turretBarrelHeavyRight: "trial:defense:turret:barrel:heavy:right",
  turretBarrelMachinegunRight: "trial:defense:turret:barrel:machinegun:right"
} as const;

const defenseAssetBasePath = "/assets/defense";

export function preloadTrialDefenseAssets(scene: Phaser.Scene): void {
  scene.load.image(trialDefenseTextureKeys.fenceWooden, `${defenseAssetBasePath}/fence/wooden_spiked_fence.png`);
  scene.load.image(trialDefenseTextureKeys.fenceMetal, `${defenseAssetBasePath}/fence/metal_spiked_fence.png`);
  scene.load.image(trialDefenseTextureKeys.fenceElectric, `${defenseAssetBasePath}/fence/electric_spiked_fence.png`);
  scene.load.image(trialDefenseTextureKeys.turretBaseLight, `${defenseAssetBasePath}/turret_parts_right/turret_base_light.png`);
  scene.load.image(trialDefenseTextureKeys.turretBaseHeavy, `${defenseAssetBasePath}/turret_parts_right/turret_base_heavy.png`);
  scene.load.image(trialDefenseTextureKeys.turretBaseMachinegun, `${defenseAssetBasePath}/turret_parts_right/turret_base_machinegun.png`);
  scene.load.image(trialDefenseTextureKeys.turretBarrelLightRight, `${defenseAssetBasePath}/turret_parts_right/turret_barrel_light_normal.png`);
  scene.load.image(trialDefenseTextureKeys.turretBarrelHeavyRight, `${defenseAssetBasePath}/turret_parts_right/turret_barrel_heavy_normal.png`);
  scene.load.image(trialDefenseTextureKeys.turretBarrelMachinegunRight, `${defenseAssetBasePath}/turret_parts_right/turret_barrel_machinegun_normal.png`);
}
