import Phaser from "phaser";
import type { TrialCoinWallet } from "../coin/TrialCoinWallet";
import { trialShopMenuTuning, trialTypographyTuning } from "../tuning/TrialGameplayTuning";
import { trialShopTextureKeys } from "./TrialShopAssets";
import { trialShopItems, type TrialShopItemDefinition, type TrialShopTab } from "./TrialShopCatalog";
import type { TrialInventoryModel } from "./TrialInventoryModel";

type TrialShopPurchaseHandler = (item: TrialShopItemDefinition) => void;

const canvas = { width: 1380, height: 1022 };
const tabHitAreas: Record<TrialShopTab, { readonly x: number; readonly y: number; readonly width: number; readonly height: number }> = {
  weapons: { x: 110, y: 0, width: 365, height: 135 },
  turrets: { x: 500, y: 0, width: 365, height: 135 },
  fences: { x: 890, y: 0, width: 365, height: 135 }
};
const slots = [
  { content: { x: 145, y: 216, width: 290, height: 255 }, price: { x: 170, y: 510, width: 240, height: 32 } },
  { content: { x: 512, y: 216, width: 290, height: 255 }, price: { x: 563, y: 510, width: 230, height: 32 } },
  { content: { x: 878, y: 216, width: 289, height: 255 }, price: { x: 933, y: 510, width: 230, height: 32 } },
  { content: { x: 145, y: 604, width: 290, height: 255 }, price: { x: 168, y: 859, width: 245, height: 32 } },
  { content: { x: 512, y: 604, width: 290, height: 255 }, price: { x: 564, y: 859, width: 231, height: 32 } },
  { content: { x: 878, y: 604, width: 289, height: 255 }, price: { x: 932, y: 859, width: 232, height: 32 } }
] as const;

export class TrialShopMenu {
  private readonly scene: Phaser.Scene;
  private readonly wallet: TrialCoinWallet;
  private readonly inventory: TrialInventoryModel;
  private readonly toggleKey: Phaser.Input.Keyboard.Key;
  private readonly tabKeys: Record<TrialShopTab, Phaser.Input.Keyboard.Key>;
  private readonly panel: Phaser.GameObjects.Image;
  private readonly icons: Phaser.GameObjects.Image[] = [];
  private readonly hoverBackdrops: Phaser.GameObjects.Rectangle[] = [];
  private readonly hitZones: Phaser.GameObjects.Rectangle[] = [];
  private readonly tabZones: Phaser.GameObjects.Rectangle[] = [];
  private readonly prices: Phaser.GameObjects.Text[] = [];
  private readonly priceCoinIcons: Phaser.GameObjects.Image[] = [];
  private readonly pluses: Phaser.GameObjects.Text[] = [];
  private readonly onPurchase?: TrialShopPurchaseHandler;
  private activeTab: TrialShopTab = "weapons";
  private isOpen = false;
  private canOpen = true;
  private x = 0;
  private y = 0;
  private scale = trialShopMenuTuning.scale;

  constructor(scene: Phaser.Scene, wallet: TrialCoinWallet, inventory: TrialInventoryModel, onPurchase?: TrialShopPurchaseHandler) {
    this.scene = scene;
    this.wallet = wallet;
    this.inventory = inventory;
    this.onPurchase = onPurchase;
    this.toggleKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.tabKeys = {
      weapons: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      turrets: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      fences: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
    };
    this.panel = scene.add.image(0, 0, trialShopTextureKeys.shopWeapons).setOrigin(0, 0).setScrollFactor(0).setDepth(100301);

    for (let index = 0; index < slots.length; index++) {
      this.hoverBackdrops.push(scene.add.rectangle(0, 0, 1, 1, 0x000000, 0).setScrollFactor(0).setDepth(100302));
      this.icons.push(scene.add.image(0, 0, trialShopTextureKeys.coin).setScrollFactor(0).setScale(trialShopMenuTuning.tabItemLayout.weapons.iconScale).setDepth(100303));
      this.prices.push(this.createText("", trialShopMenuTuning.priceFontSizePixels, 100303));
      this.priceCoinIcons.push(scene.add.image(0, 0, trialShopTextureKeys.coin).setScrollFactor(0).setScale(trialShopMenuTuning.tabItemLayout.weapons.coinScale).setDepth(100303));
      this.pluses.push(this.createText("+", trialShopMenuTuning.plusFontSizePixels, 100305).setVisible(false));
      const hitZone = scene.add.rectangle(0, 0, 1, 1, 0xffffff, 0).setScrollFactor(0).setDepth(100306).setInteractive({ useHandCursor: true });
      hitZone.on(Phaser.Input.Events.POINTER_OVER, () => this.showPlus(index, true));
      hitZone.on(Phaser.Input.Events.POINTER_OUT, () => this.showPlus(index, false));
      hitZone.on(Phaser.Input.Events.POINTER_DOWN, (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.buySlot(index);
      });
      this.hitZones.push(hitZone);
    }

    for (const tab of ["weapons", "turrets", "fences"] as const) {
      const tabZone = scene.add.rectangle(0, 0, 1, 1, 0xffffff, 0).setScrollFactor(0).setDepth(100307).setInteractive({ useHandCursor: true });
      tabZone.on(Phaser.Input.Events.POINTER_DOWN, (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.activeTab = tab;
        this.refresh();
      });
      this.tabZones.push(tabZone);
    }

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.layout();
    this.setOpen(false);
  }

  isActive(): boolean {
    return this.isOpen;
  }

  setCanOpen(canOpen: boolean): void {
    this.canOpen = canOpen;
    if (!canOpen) {
      this.setOpen(false);
    }
  }

  isPointerOverInteractiveArea(): boolean {
    if (!this.isOpen) {
      return false;
    }

    const pointer = this.scene.input.activePointer;
    return [...this.hitZones, ...this.tabZones].some((zone) => zone.visible && zone.getBounds().contains(pointer.x, pointer.y));
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.toggleKey) && this.canOpen) {
      this.setOpen(!this.isOpen);
    }

    if (!this.isOpen) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.tabKeys.weapons)) {
      this.activeTab = "weapons";
      this.refresh();
    }
    else if (Phaser.Input.Keyboard.JustDown(this.tabKeys.turrets)) {
      this.activeTab = "turrets";
      this.refresh();
    }
    else if (Phaser.Input.Keyboard.JustDown(this.tabKeys.fences)) {
      this.activeTab = "fences";
      this.refresh();
    }
  }

  private setOpen(isOpen: boolean): void {
    this.isOpen = isOpen;
    for (const item of [this.panel, ...this.hoverBackdrops, ...this.icons, ...this.hitZones, ...this.tabZones, ...this.prices, ...this.priceCoinIcons, ...this.pluses]) {
      item.setVisible(isOpen);
    }
    if (isOpen) {
      this.refresh();
    }
  }

  private refresh(): void {
    const textureKey = this.activeTab === "weapons"
      ? trialShopTextureKeys.shopWeapons
      : this.activeTab === "turrets"
        ? trialShopTextureKeys.shopTurrets
        : trialShopTextureKeys.shopFences;
    this.panel.setTexture(textureKey);
    const items = this.getActiveItems();
    this.layout();

    for (let index = 0; index < slots.length; index++) {
      const item = items[index];
      const visible = Boolean(item);
      this.icons[index].setVisible(visible);
      this.hitZones[index].setVisible(visible);
      this.hoverBackdrops[index].setVisible(visible);
      this.hoverBackdrops[index].setAlpha(0);
      this.icons[index].setAlpha(1);
      this.prices[index].setVisible(visible);
      this.priceCoinIcons[index].setVisible(visible);
      this.pluses[index].setVisible(false);
      if (!item) {
        continue;
      }

      if (item.textureKey) {
        this.icons[index].setTexture(item.textureKey);
      }
      this.prices[index].setText(`${item.price}`);
    }
  }

  private buySlot(index: number): void {
    const item = this.getActiveItems()[index];
    if (!item || !item.inventoryItemId || !this.wallet.trySpend(item.price)) {
      this.playPurchaseDenied(index);
      return;
    }

    if (item.tab === "weapons") {
      this.onPurchase?.(item);
    }
    else {
      this.inventory.add(item.inventoryItemId);
    }
    this.showPlus(index, true);
    this.playPurchaseFeedback(index);
  }

  private showPlus(index: number, visible: boolean): void {
    if (!this.isOpen) {
      return;
    }

    const item = this.getActiveItems()[index];
    if (!item) {
      return;
    }

    this.pluses[index].setVisible(visible);
    this.pluses[index].setText(this.wallet.getTotal() >= item.price ? "+" : "x");
    this.pluses[index].setColor(this.wallet.getTotal() >= item.price ? "#f2e6c9" : "#e64040");
    this.hoverBackdrops[index].setAlpha(visible ? trialShopMenuTuning.hoverDimAlpha : 0);
    this.icons[index].setAlpha(visible ? 0.42 : 1);
  }

  private playPurchaseFeedback(index: number): void {
    const icon = this.icons[index];
    const backdrop = this.hoverBackdrops[index];
    const plus = this.pluses[index];
    const tabLayout = trialShopMenuTuning.tabItemLayout[this.activeTab];
    icon.setScale(tabLayout.iconScale);
    plus.setText("+");
    plus.setColor("#f2e6c9");
    plus.setAngle(0);
    backdrop.setAlpha(trialShopMenuTuning.purchaseFlashAlpha);
    this.scene.tweens.add({
      targets: icon,
      scale: tabLayout.iconScale * 1.16,
      duration: 90,
      yoyo: true,
      ease: "Sine.easeOut"
    });
    this.scene.tweens.add({
      targets: backdrop,
      alpha: trialShopMenuTuning.hoverDimAlpha,
      duration: 180,
      ease: "Sine.easeOut"
    });
    this.scene.tweens.add({
      targets: plus,
      angle: 360,
      scale: 1.22,
      duration: trialShopMenuTuning.purchaseSpinDurationMs,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        plus.setAngle(0);
        plus.setScale(1);
      }
    });
  }

  private playPurchaseDenied(index: number): void {
    const plus = this.pluses[index];
    plus.setVisible(true);
    plus.setText("x");
    plus.setColor("#e64040");
    this.scene.tweens.killTweensOf(plus);
    this.scene.tweens.add({
      targets: plus,
      scale: 1.18,
      duration: 70,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => plus.setScale(1)
    });
  }

  private getActiveItems(): readonly TrialShopItemDefinition[] {
    return trialShopItems.filter((item) => item.tab === this.activeTab);
  }

  private layout(): void {
    const width = canvas.width * this.scale;
    const height = canvas.height * this.scale;
    this.x = (this.scene.scale.width - width) / 2;
    this.y = (this.scene.scale.height - height) / 2;
    this.panel.setPosition(this.x, this.y).setScale(this.scale);

    for (let index = 0; index < slots.length; index++) {
      const tabLayout = trialShopMenuTuning.tabItemLayout[this.activeTab];
      this.placeRectangle(this.hoverBackdrops[index], slots[index].content);
      this.placeRectangle(this.hitZones[index], this.expandRect(slots[index].content, trialShopMenuTuning.slotHitAreaPaddingPixels));
      this.icons[index].setScale(tabLayout.iconScale);
      this.prices[index].setScale(tabLayout.priceScale);
      this.priceCoinIcons[index].setScale(tabLayout.coinScale);
      this.place(this.icons[index], slots[index].content, tabLayout.iconOffsetPixels.x * this.scale, tabLayout.iconOffsetPixels.y * this.scale);
      this.place(this.prices[index], slots[index].price, tabLayout.priceOffsetPixels.x * this.scale, tabLayout.priceOffsetPixels.y * this.scale);
      this.place(
        this.priceCoinIcons[index],
        slots[index].price,
        (tabLayout.priceOffsetPixels.x + tabLayout.coinOffsetPixels.x) * this.scale,
        (tabLayout.priceOffsetPixels.y + tabLayout.coinOffsetPixels.y) * this.scale
      );
      this.place(this.pluses[index], slots[index].content);
    }

    const tabs = ["weapons", "turrets", "fences"] as const;
    for (let index = 0; index < tabs.length; index++) {
      this.placeRectangle(this.tabZones[index], this.expandRect(tabHitAreas[tabs[index]], trialShopMenuTuning.tabHitAreaPaddingPixels));
    }
  }

  private createText(text: string, fontSize: number, depth: number): Phaser.GameObjects.Text {
    return this.scene.add.text(0, 0, text, {
      fontFamily: trialTypographyTuning.fontFamily,
      fontSize: `${fontSize}px`,
      color: "#f2e6c9",
      stroke: "#130f0a",
      strokeThickness: 4
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(depth);
  }

  private place(target: Phaser.GameObjects.Components.Transform, rect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }, offsetX = 0, offsetY = 0): void {
    target.setPosition(
      this.x + (rect.x + rect.width / 2) * this.scale + offsetX,
      this.y + (rect.y + rect.height / 2) * this.scale + offsetY
    );
  }

  private placeRectangle(rectangle: Phaser.GameObjects.Rectangle, rect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }): void {
    rectangle
      .setPosition(this.x + (rect.x + rect.width / 2) * this.scale, this.y + (rect.y + rect.height / 2) * this.scale)
      .setSize(rect.width * this.scale, rect.height * this.scale);
  }

  private expandRect(
    rect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
    padding: { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number }
  ): { readonly x: number; readonly y: number; readonly width: number; readonly height: number } {
    return {
      x: rect.x - padding.left,
      y: rect.y - padding.top,
      width: rect.width + padding.left + padding.right,
      height: rect.height + padding.top + padding.bottom
    };
  }
}
