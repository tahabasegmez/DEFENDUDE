import Phaser from "phaser";
import type { TrialCoinWallet } from "../coin/TrialCoinWallet";
import type { TrialWeaponRuntimeSnapshot } from "../combat/TrialCombatTypes";
import type { TrialWeaponFireController } from "../combat/TrialWeaponFireController";
import { trialWeaponOrder } from "../combat/TrialWeaponTuning";
import type { TrialPlayerHealth } from "../player/TrialPlayerHealth";
import { trialShopTextureKeys } from "../shop/TrialShopAssets";
import { trialHudTuning, trialTypographyTuning } from "../tuning/TrialGameplayTuning";
import { trialHeartHudTextureKeys } from "./TrialHeartHudAssets";
import { trialMainHudTextureKeys } from "./TrialMainHudAssets";

const canvas = { width: 2154, height: 402 };
const regions = {
  portrait: { x: 54, y: 46, width: 239, height: 245 },
  weaponSlots: [
    { x: 403, y: 141, width: 107, height: 109 },
    { x: 551, y: 132, width: 108, height: 120 },
    { x: 700, y: 132, width: 108, height: 120 },
    { x: 848, y: 132, width: 108, height: 120 },
    { x: 996, y: 132, width: 108, height: 120 }
  ],
  weaponAmmo: [
    { x: 408, y: 286, width: 99, height: 43 },
    { x: 555, y: 286, width: 103, height: 43 },
    { x: 704, y: 286, width: 103, height: 43 },
    { x: 853, y: 286, width: 102, height: 43 },
    { x: 1002, y: 286, width: 102, height: 43 }
  ],
  selectedAmmo: { x: 1302, y: 129, width: 278, height: 124 },
  hearts: { x: 1680, y: 128, width: 419, height: 62 },
  coin: { x: 1669, y: 265, width: 299, height: 100 }
} as const;

export class TrialMainHud {
  private readonly scene: Phaser.Scene;
  private readonly health: TrialPlayerHealth;
  private readonly wallet: TrialCoinWallet;
  private readonly weaponFireController: TrialWeaponFireController;
  private readonly panel: Phaser.GameObjects.Image;
  private readonly portrait?: Phaser.GameObjects.Image;
  private readonly weaponIcons: Phaser.GameObjects.Image[] = [];
  private readonly weaponAmmoTexts: Phaser.GameObjects.Text[] = [];
  private readonly heartIcons: Phaser.GameObjects.Image[] = [];
  private readonly selectedAmmoText: Phaser.GameObjects.Text;
  private readonly coinIcon: Phaser.GameObjects.Image;
  private readonly coinText: Phaser.GameObjects.Text;
  private readonly lastWeaponAmmoTexts: string[] = [];
  private lastSelectedAmmoText = "";
  private lastCoinText = "";
  private lastLayoutZoom = 0;
  private hudX = 0;
  private hudY = 0;
  private hudScale: number = trialHudTuning.scale;

  constructor(
    scene: Phaser.Scene,
    health: TrialPlayerHealth,
    wallet: TrialCoinWallet,
    weaponFireController: TrialWeaponFireController
  ) {
    this.scene = scene;
    this.health = health;
    this.wallet = wallet;
    this.weaponFireController = weaponFireController;
    this.panel = this.scene.add.image(0, 0, trialMainHudTextureKeys.panel)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100000);
    this.portrait = trialHudTuning.portraitVisible
      ? this.scene.add.image(0, 0, trialShopTextureKeys.pistol).setScrollFactor(0).setScale(trialHudTuning.portraitScale).setDepth(100001)
      : undefined;

    for (const weaponId of trialWeaponOrder) {
      this.weaponIcons.push(
        this.scene.add.image(0, 0, this.getWeaponShopTexture(weaponId))
          .setScrollFactor(0)
          .setScale(trialHudTuning.weaponIconScale)
          .setDepth(100001)
      );
    }

    for (let index = 0; index < trialWeaponOrder.length; index++) {
      this.weaponAmmoTexts.push(this.createText(trialHudTuning.weaponAmmoFontSizePixels, 100002));
    }

    const maxHearts = Math.ceil(this.health.getSnapshot().maxHalfHearts / 2);
    for (let index = 0; index < maxHearts; index++) {
      this.heartIcons.push(
        this.scene.add.image(0, 0, trialHeartHudTextureKeys.full)
          .setScrollFactor(0)
          .setScale(trialHudTuning.heartScale)
          .setDepth(100001)
      );
    }

    this.selectedAmmoText = this.createText(trialHudTuning.selectedWeaponAmmoFontSizePixels, 100002);
    this.coinIcon = this.scene.add.image(0, 0, trialShopTextureKeys.coin)
      .setScrollFactor(0)
      .setScale(trialHudTuning.coinIconScale)
      .setDepth(100001);
    this.coinText = this.createText(trialTypographyTuning.hudFontSizePixels, 100002).setOrigin(1, 0.5);

    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.layout();
    this.update();
  }

  update(): void {
    this.refreshLayoutWhenCameraZoomChanges();
    this.updateHearts();
    this.updateAmmo();
    this.updateCoin();
  }

  setVisible(isVisible: boolean): void {
    for (const item of [this.panel, ...this.weaponIcons, ...this.weaponAmmoTexts, ...this.heartIcons, this.selectedAmmoText, this.coinIcon, this.coinText]) {
      item.setVisible(isVisible);
    }
    this.portrait?.setVisible(isVisible);
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.panel.destroy();
    this.portrait?.destroy();
    for (const item of [...this.weaponIcons, ...this.weaponAmmoTexts, ...this.heartIcons]) {
      item.destroy();
    }
    this.selectedAmmoText.destroy();
    this.coinIcon.destroy();
    this.coinText.destroy();
  }

  private updateHearts(): void {
    const snapshot = this.health.getSnapshot();
    for (let index = 0; index < this.heartIcons.length; index++) {
      const remainingHalfHearts = snapshot.currentHalfHearts - index * 2;
      this.heartIcons[index].setTexture(
        remainingHalfHearts >= 2
          ? trialHeartHudTextureKeys.full
          : remainingHalfHearts === 1
            ? trialHeartHudTextureKeys.half
            : trialHeartHudTextureKeys.empty
      );
    }
  }

  private updateAmmo(): void {
    const snapshots = this.weaponFireController.getHudSnapshots();
    const activeWeaponId = this.weaponFireController.getActiveWeaponId();
    for (let index = 0; index < snapshots.length; index++) {
      const snapshot = snapshots[index];
      const text = this.getReserveMagazineText(snapshot);
      if (this.lastWeaponAmmoTexts[index] !== text) {
        this.weaponAmmoTexts[index].setText(text);
        this.lastWeaponAmmoTexts[index] = text;
      }
      this.weaponIcons[index].setAlpha(snapshot.weaponId === activeWeaponId ? 1 : 0.62);
    }

    const selected = this.weaponFireController.getHudSnapshot();
    const selectedText = this.getSelectedAmmoText(selected);
    if (this.lastSelectedAmmoText !== selectedText) {
      this.selectedAmmoText.setText(selectedText);
      this.lastSelectedAmmoText = selectedText;
    }
    this.selectedAmmoText.setAlpha(1);
  }

  private updateCoin(): void {
    const text = `${this.wallet.getTotal()}`;
    if (this.lastCoinText !== text) {
      this.coinText.setText(text);
      this.lastCoinText = text;
    }
    const coinRect = this.toScreenRect(regions.coin);
    const iconX = coinRect.x + coinRect.width * 0.80 + trialHudTuning.coinGroupOffsetPixels.x;
    const centerY = coinRect.y + coinRect.height * 0.52 + trialHudTuning.coinGroupOffsetPixels.y;
    this.coinIcon.setPosition(this.toWorldUiX(iconX), this.toWorldUiY(centerY));
    this.coinText.setPosition(this.toWorldUiX(iconX - trialHudTuning.coinTextOffsetFromIconPixels), this.toWorldUiY(centerY));
  }

  private layout(): void {
    const viewport = this.getViewportSize();
    const cameraZoom = this.getCameraZoom();
    this.hudScale = trialHudTuning.stretchToViewportWidth
      ? viewport.width / canvas.width
      : Math.min(trialHudTuning.scale, viewport.width / canvas.width);
    const width = canvas.width * this.hudScale;
    const height = canvas.height * this.hudScale;
    this.hudX = trialHudTuning.stretchToViewportWidth ? 0 : (viewport.width - width) / 2;
    this.hudX += trialHudTuning.marginPixels.x;
    this.hudY = viewport.height - height - trialHudTuning.marginPixels.y;
    this.panel.setPosition(this.toWorldUiX(this.hudX), this.toWorldUiY(this.hudY)).setScale(this.hudScale / cameraZoom);
    this.applyFixedUiScales();
    if (this.portrait) {
      this.layoutImageInRect(this.portrait, regions.portrait);
    }

    for (let index = 0; index < this.weaponIcons.length; index++) {
      this.layoutImageInRect(this.weaponIcons[index], regions.weaponSlots[index], trialHudTuning.weaponGroupOffsetPixels);
      this.layoutTextInRect(this.weaponAmmoTexts[index], regions.weaponAmmo[index], trialHudTuning.weaponAmmoGroupOffsetPixels);
    }

    this.layoutTextInRect(this.selectedAmmoText, regions.selectedAmmo, trialHudTuning.selectedAmmoOffsetPixels);
    const heartRect = this.toScreenRect(regions.hearts);
    const visibleHeartCount = Math.min(this.heartIcons.length, trialHudTuning.maxVisibleHearts);
    for (let index = 0; index < this.heartIcons.length; index++) {
      const row = Math.floor(index / trialHudTuning.heartsPerRow);
      const column = index % trialHudTuning.heartsPerRow;
      this.heartIcons[index]
        .setVisible(index < visibleHeartCount)
        .setPosition(
          this.toWorldUiX(heartRect.x + trialHudTuning.heartGroupOffsetPixels.x + column * trialHudTuning.heartSpacingPixels),
          this.toWorldUiY(heartRect.y + heartRect.height / 2 + trialHudTuning.heartGroupOffsetPixels.y + row * trialHudTuning.heartRowSpacingPixels)
        );
    }
    this.updateCoin();
    this.lastLayoutZoom = this.getCameraZoom();
  }

  private createText(fontSizePixels: number, depth: number): Phaser.GameObjects.Text {
    return this.scene.add.text(0, 0, "", {
      fontFamily: trialTypographyTuning.fontFamily,
      fontSize: `${fontSizePixels}px`,
      color: "#f2e6c9",
      stroke: "#130f0a",
      strokeThickness: 4
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(depth);
  }

  private layoutImageInRect(
    image: Phaser.GameObjects.Image,
    rect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
    offset: { readonly x: number; readonly y: number } = { x: 0, y: 0 }
  ): void {
    const screenRect = this.toScreenRect(rect);
    image.setPosition(
      this.toWorldUiX(screenRect.x + screenRect.width / 2 + offset.x),
      this.toWorldUiY(screenRect.y + screenRect.height / 2 + offset.y)
    );
  }

  private layoutTextInRect(
    text: Phaser.GameObjects.Text,
    rect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
    offset: { readonly x: number; readonly y: number } = { x: 0, y: 0 }
  ): void {
    const screenRect = this.toScreenRect(rect);
    text.setPosition(
      this.toWorldUiX(screenRect.x + screenRect.width / 2 + offset.x),
      this.toWorldUiY(screenRect.y + screenRect.height / 2 + offset.y)
    );
  }

  private toScreenRect(rect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }): { readonly x: number; readonly y: number; readonly width: number; readonly height: number } {
    return {
      x: this.hudX + rect.x * this.hudScale,
      y: this.hudY + rect.y * this.hudScale,
      width: rect.width * this.hudScale,
      height: rect.height * this.hudScale
    };
  }

  private applyFixedUiScales(): void {
    const cameraZoom = this.getCameraZoom();
    for (const icon of this.weaponIcons) {
      icon.setScale(trialHudTuning.weaponIconScale / cameraZoom);
    }
    for (const heart of this.heartIcons) {
      heart.setScale(trialHudTuning.heartScale / cameraZoom);
    }
    for (const text of this.weaponAmmoTexts) {
      text.setScale(1 / cameraZoom);
    }
    this.selectedAmmoText.setScale(1 / cameraZoom);
    this.coinText.setScale(1 / cameraZoom);
    this.coinIcon.setScale(trialHudTuning.coinIconScale / cameraZoom);
    this.portrait?.setScale(trialHudTuning.portraitScale / cameraZoom);
  }

  private getReserveMagazineText(snapshot: TrialWeaponRuntimeSnapshot): string {
    if (snapshot.reserveAmmo === "infinite") {
      return "inf";
    }

    if (snapshot.magazineCapacity === "infinite" || snapshot.magazineCapacity <= 0) {
      return `${snapshot.reserveAmmo}`;
    }

    return `${Math.ceil(snapshot.reserveAmmo / snapshot.magazineCapacity)}`;
  }

  private getSelectedAmmoText(snapshot: TrialWeaponRuntimeSnapshot): string {
    if (!snapshot.isReloading || snapshot.reloadDurationMs <= 0 || snapshot.magazineCapacity === "infinite") {
      return snapshot.ammoInMagazine === "infinite" ? "inf" : `${snapshot.ammoInMagazine}`;
    }

    if (snapshot.magazineCapacity <= 1) {
      return "0";
    }

    const progress = Phaser.Math.Clamp(1 - snapshot.reloadRemainingMs / snapshot.reloadDurationMs, 0, 1);
    const currentAmmo = typeof snapshot.ammoInMagazine === "number" ? snapshot.ammoInMagazine : 0;
    const targetAmmo = Math.max(currentAmmo, Math.floor(snapshot.magazineCapacity * progress));
    return `${Math.min(snapshot.magazineCapacity - 1, targetAmmo)}`;
  }

  private getViewportSize(): { readonly width: number; readonly height: number } {
    const camera = this.scene.cameras.main;
    return {
      width: camera.width || this.scene.scale.width,
      height: camera.height || this.scene.scale.height
    };
  }

  private getCameraZoom(): number {
    return this.scene.cameras.main.zoom || 1;
  }

  private refreshLayoutWhenCameraZoomChanges(): void {
    if (Math.abs(this.getCameraZoom() - this.lastLayoutZoom) > 0.0001) {
      this.layout();
    }
  }

  private toWorldUiX(screenX: number): number {
    return screenX / this.getCameraZoom();
  }

  private toWorldUiY(screenY: number): number {
    return screenY / this.getCameraZoom();
  }

  private getWeaponShopTexture(weaponId: string): string {
    switch (weaponId) {
      case "smg":
        return trialShopTextureKeys.smg;
      case "shotgun":
        return trialShopTextureKeys.shotgun;
      case "rifle":
        return trialShopTextureKeys.rifle;
      case "rocketLauncher":
        return trialShopTextureKeys.rocketLauncher;
      default:
        return trialShopTextureKeys.pistol;
    }
  }
}
