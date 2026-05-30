import Phaser from "phaser";

export const trialShopTextureKeys = {
  coin: "trial:shop:icon:coin",
  pistol: "trial:shop:icon:pistol",
  smg: "trial:shop:icon:smg",
  shotgun: "trial:shop:icon:shotgun",
  rifle: "trial:shop:icon:rifle",
  rocketLauncher: "trial:shop:icon:rocket-launcher",
  woodenFence: "trial:shop:icon:wooden-fence",
  metalFence: "trial:shop:icon:metal-fence",
  electricFence: "trial:shop:icon:electric-fence",
  pistolTurret: "trial:shop:icon:pistol-turret",
  machinegunTurret: "trial:shop:icon:machinegun-turret",
  sniperTurret: "trial:shop:icon:sniper-turret",
  mine: "trial:shop:icon:mine",
  shopWeapons: "trial:shop:ui:weapons",
  shopTurrets: "trial:shop:ui:turrets",
  shopFences: "trial:shop:ui:fences",
  inventoryPanel: "trial:inventory:panel"
} as const;

const iconPath = "/assets/shop/icons_left";

export function preloadTrialShopAssets(scene: Phaser.Scene): void {
  scene.load.image(trialShopTextureKeys.coin, `${iconPath}/coin_gold.png`);
  scene.load.image(trialShopTextureKeys.pistol, `${iconPath}/pistol.png`);
  scene.load.image(trialShopTextureKeys.smg, `${iconPath}/smg.png`);
  scene.load.image(trialShopTextureKeys.shotgun, `${iconPath}/shotgun.png`);
  scene.load.image(trialShopTextureKeys.rifle, `${iconPath}/rifle.png`);
  scene.load.image(trialShopTextureKeys.rocketLauncher, `${iconPath}/rocket_launcher.png`);
  scene.load.image(trialShopTextureKeys.woodenFence, `${iconPath}/wooden_spiked_fence.png`);
  scene.load.image(trialShopTextureKeys.metalFence, `${iconPath}/metal_spiked_fence.png`);
  scene.load.image(trialShopTextureKeys.electricFence, `${iconPath}/electric_spiked_fence.png`);
  scene.load.image(trialShopTextureKeys.pistolTurret, `${iconPath}/pistol_turret.png`);
  scene.load.image(trialShopTextureKeys.machinegunTurret, `${iconPath}/machinegun_turret.png`);
  scene.load.image(trialShopTextureKeys.sniperTurret, `${iconPath}/sniper_turret.png`);
  scene.load.image(trialShopTextureKeys.mine, "/assets/projectiles/left/land_mine.png");
  scene.load.image(trialShopTextureKeys.shopWeapons, "/assets/shop/shop_ui/shop_weapons.png");
  scene.load.image(trialShopTextureKeys.shopTurrets, "/assets/shop/shop_ui/shop_turrets.png");
  scene.load.image(trialShopTextureKeys.shopFences, "/assets/shop/shop_ui/shop_fences.png");
  scene.load.image(trialShopTextureKeys.inventoryPanel, "/assets/inventory/defense_inventory_panel.png");
}
