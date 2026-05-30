import Phaser from "phaser";
import { trialInventoryHudTuning, trialTypographyTuning } from "../tuning/TrialGameplayTuning";
import { getShopTextureForInventoryItem, trialInventoryDisplayOrder } from "./TrialShopCatalog";
import { trialShopTextureKeys } from "./TrialShopAssets";
import type { TrialInventoryItemId, TrialInventoryModel } from "./TrialInventoryModel";

type TrialInventorySelectionHandler = (itemId: TrialInventoryItemId | null) => void;

const canvas = { width: 619, height: 1383 };
const rows = [
  { item: { x: 104, y: 69, width: 296, height: 118 }, count: { x: 431, y: 96, width: 83, height: 76 } },
  { item: { x: 104, y: 223, width: 296, height: 118 }, count: { x: 431, y: 250, width: 83, height: 76 } },
  { item: { x: 104, y: 377, width: 296, height: 119 }, count: { x: 431, y: 405, width: 83, height: 76 } },
  { item: { x: 104, y: 532, width: 296, height: 119 }, count: { x: 431, y: 559, width: 83, height: 77 } },
  { item: { x: 104, y: 686, width: 296, height: 119 }, count: { x: 431, y: 714, width: 83, height: 76 } },
  { item: { x: 104, y: 841, width: 296, height: 119 }, count: { x: 431, y: 869, width: 83, height: 76 } },
  { item: { x: 104, y: 1150, width: 296, height: 120 }, count: { x: 431, y: 1178, width: 83, height: 76 } }
] as const;

export class TrialInventoryHud {
  private readonly scene: Phaser.Scene;
  private readonly inventory: TrialInventoryModel;
  private readonly panel: Phaser.GameObjects.Image;
  private readonly icons: Array<Phaser.GameObjects.Image | Phaser.GameObjects.Text> = [];
  private readonly counts: Phaser.GameObjects.Text[] = [];
  private readonly hitZones: Phaser.GameObjects.Rectangle[] = [];
  private readonly selectionBackdrops: Phaser.GameObjects.Rectangle[] = [];
  private readonly lastCounts: string[] = [];
  private readonly onSelect?: TrialInventorySelectionHandler;
  private lastLayoutZoom = 0;
  private selectedItemId: TrialInventoryItemId | null = null;
  private hoveredItemId: TrialInventoryItemId | null = null;
  private isShown = true;
  private x = 0;
  private y = 0;
  private scale = trialInventoryHudTuning.scale;

  constructor(scene: Phaser.Scene, inventory: TrialInventoryModel, onSelect?: TrialInventorySelectionHandler) {
    this.scene = scene;
    this.inventory = inventory;
    this.onSelect = onSelect;
    this.panel = scene.add.image(0, 0, trialShopTextureKeys.inventoryPanel).setOrigin(0, 0).setScrollFactor(0).setDepth(100200);

    for (const itemId of trialInventoryDisplayOrder) {
      this.selectionBackdrops.push(scene.add.rectangle(0, 0, 1, 1, 0xf1c75b, 0).setScrollFactor(0).setDepth(100200));
      const textureKey = getShopTextureForInventoryItem(itemId);
      this.icons.push(textureKey
        ? scene.add.image(0, 0, textureKey).setScrollFactor(0).setScale(trialInventoryHudTuning.itemIconScale).setDepth(100201)
        : this.createText("MINE", trialInventoryHudTuning.countFontSizePixels, 100201));
      this.counts.push(this.createText("0", trialInventoryHudTuning.countFontSizePixels, 100202));
      const hitZone = scene.add.rectangle(0, 0, 1, 1, 0xffffff, 0).setScrollFactor(0).setDepth(100203).setInteractive({ useHandCursor: true });
      hitZone.on(Phaser.Input.Events.POINTER_OVER, () => {
        this.hoveredItemId = itemId;
        this.refreshSelection();
      });
      hitZone.on(Phaser.Input.Events.POINTER_OUT, () => {
        if (this.hoveredItemId === itemId) {
          this.hoveredItemId = null;
        }
        this.refreshSelection();
      });
      hitZone.on(Phaser.Input.Events.POINTER_DOWN, (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        if (!this.isShown || this.inventory.getCount(itemId) <= 0) {
          return;
        }

        this.selectedItemId = this.selectedItemId === itemId ? null : itemId;
        this.onSelect?.(this.selectedItemId);
        this.refreshSelection();
      });
      this.hitZones.push(hitZone);
    }

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.layout();
    this.update();
  }

  update(): void {
    this.refreshLayoutWhenCameraZoomChanges();
    for (let index = 0; index < trialInventoryDisplayOrder.length; index++) {
      const text = `${this.inventory.getCount(trialInventoryDisplayOrder[index])}`;
      if (this.lastCounts[index] !== text) {
        this.counts[index].setText(text);
        this.lastCounts[index] = text;
      }
    }
    this.refreshSelection();
  }

  setDayMode(isDay: boolean): void {
    this.isShown = isDay;
    for (const item of [this.panel, ...this.selectionBackdrops, ...this.icons, ...this.counts, ...this.hitZones]) {
      item.setVisible(isDay);
    }
    if (!isDay) {
      this.selectedItemId = null;
      this.hoveredItemId = null;
    }
  }

  getSelectedItemId(): TrialInventoryItemId | null {
    return this.isShown ? this.selectedItemId : null;
  }

  setVisible(isVisible: boolean): void {
    for (const item of [this.panel, ...this.selectionBackdrops, ...this.icons, ...this.counts, ...this.hitZones]) {
      item.setVisible(isVisible && this.isShown);
    }
  }

  clearSelection(): void {
    this.selectedItemId = null;
    this.refreshSelection();
  }

  isPointerOverInteractiveArea(): boolean {
    if (!this.isShown) {
      return false;
    }

    const pointer = this.scene.input.activePointer;
    return this.hitZones.some((zone) => zone.visible && zone.getBounds().contains(pointer.x / this.getCameraZoom(), pointer.y / this.getCameraZoom()));
  }

  private layout(): void {
    const viewport = this.getViewportSize();
    const cameraZoom = this.getCameraZoom();
    const width = canvas.width * this.scale;
    const height = canvas.height * this.scale;
    this.x = viewport.width - width - trialInventoryHudTuning.marginPixels.x;
    this.y = (viewport.height - height) / 2 + trialInventoryHudTuning.marginPixels.y;
    this.panel.setPosition(this.toWorldUiX(this.x), this.toWorldUiY(this.y)).setScale(this.scale / cameraZoom);
    for (const icon of this.icons) {
      icon.setScale(("setTexture" in icon ? trialInventoryHudTuning.itemIconScale : 1) / cameraZoom);
    }
    for (const count of this.counts) {
      count.setScale(1 / cameraZoom);
    }

    for (let index = 0; index < rows.length; index++) {
      this.placeRectangle(this.selectionBackdrops[index], rows[index].item);
      this.placeRectangle(this.hitZones[index], this.expandRect(rows[index].item, trialInventoryHudTuning.itemHitAreaPaddingPixels));
      this.placeInRect(this.icons[index], rows[index].item);
      this.placeInRect(this.counts[index], rows[index].count);
    }
    this.lastLayoutZoom = this.getCameraZoom();
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

  private placeInRect(target: Phaser.GameObjects.Components.Transform, rect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }): void {
    target.setPosition(
      this.toWorldUiX(this.x + (rect.x + rect.width / 2) * this.scale),
      this.toWorldUiY(this.y + (rect.y + rect.height / 2) * this.scale)
    );
  }

  private placeRectangle(rectangle: Phaser.GameObjects.Rectangle, rect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }): void {
    rectangle
      .setPosition(
        this.toWorldUiX(this.x + (rect.x + rect.width / 2) * this.scale),
        this.toWorldUiY(this.y + (rect.y + rect.height / 2) * this.scale)
      )
      .setSize(rect.width * this.scale / this.getCameraZoom(), rect.height * this.scale / this.getCameraZoom());
  }

  private refreshSelection(): void {
    for (let index = 0; index < trialInventoryDisplayOrder.length; index++) {
      const itemId = trialInventoryDisplayOrder[index];
      const isSelected = this.selectedItemId === itemId;
      const isHovered = this.hoveredItemId === itemId && this.inventory.getCount(itemId) > 0;
      this.selectionBackdrops[index]
        .setFillStyle(isSelected ? 0xf1c75b : 0x000000)
        .setAlpha(isSelected ? trialInventoryHudTuning.selectionAlpha : isHovered ? trialInventoryHudTuning.hoverDimAlpha : 0);
    }
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
}
