import { trialShopTextureKeys } from "./TrialShopAssets";
import type { TrialInventoryItemId } from "./TrialInventoryModel";

export type TrialShopTab = "weapons" | "turrets" | "fences";

export interface TrialShopItemDefinition {
  readonly id: string;
  readonly inventoryItemId?: TrialInventoryItemId;
  readonly tab: TrialShopTab;
  readonly textureKey?: string;
  readonly label: string;
  readonly price: number;
}

export const trialShopItems: readonly TrialShopItemDefinition[] = [
  { id: "pistol", inventoryItemId: "pistolMagazine", tab: "weapons", textureKey: trialShopTextureKeys.pistol, label: "Pistol", price: 0 },
  { id: "smg", inventoryItemId: "smgMagazine", tab: "weapons", textureKey: trialShopTextureKeys.smg, label: "SMG", price: 18 },
  { id: "shotgun", inventoryItemId: "shotgunMagazine", tab: "weapons", textureKey: trialShopTextureKeys.shotgun, label: "Shotgun", price: 22 },
  { id: "rifle", inventoryItemId: "rifleMagazine", tab: "weapons", textureKey: trialShopTextureKeys.rifle, label: "Rifle", price: 28 },
  { id: "rocketLauncher", inventoryItemId: "rocket", tab: "weapons", textureKey: trialShopTextureKeys.rocketLauncher, label: "Rocket", price: 35 },
  { id: "woodenFence", inventoryItemId: "woodenFence", tab: "fences", textureKey: trialShopTextureKeys.woodenFence, label: "Wood", price: 10 },
  { id: "metalFence", inventoryItemId: "metalFence", tab: "fences", textureKey: trialShopTextureKeys.metalFence, label: "Metal", price: 22 },
  { id: "electricFence", inventoryItemId: "electricFence", tab: "fences", textureKey: trialShopTextureKeys.electricFence, label: "Electric", price: 34 },
  { id: "lightTurret", inventoryItemId: "lightTurret", tab: "turrets", textureKey: trialShopTextureKeys.pistolTurret, label: "Light", price: 70 },
  { id: "machinegunTurret", inventoryItemId: "machinegunTurret", tab: "turrets", textureKey: trialShopTextureKeys.machinegunTurret, label: "MG", price: 120 },
  { id: "heavyTurret", inventoryItemId: "heavyTurret", tab: "turrets", textureKey: trialShopTextureKeys.sniperTurret, label: "Heavy", price: 160 },
  { id: "mine", inventoryItemId: "mine", tab: "turrets", textureKey: trialShopTextureKeys.mine, label: "Mine", price: 25 }
];

export const trialInventoryDisplayOrder: readonly TrialInventoryItemId[] = [
  "woodenFence",
  "metalFence",
  "electricFence",
  "lightTurret",
  "machinegunTurret",
  "heavyTurret",
  "mine"
];

export function getShopTextureForInventoryItem(itemId: TrialInventoryItemId): string | undefined {
  return trialShopItems.find((item) => item.inventoryItemId === itemId)?.textureKey;
}
