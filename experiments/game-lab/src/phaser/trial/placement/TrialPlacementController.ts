import Phaser from "phaser";
import type { GridCoordinate } from "../../../core/grid/GridCoordinate";
import type { GroundSurfaceLayout } from "../../rendering/GroundSurfaceLayout";
import type { TrialCharacterController } from "../character/TrialCharacterController";
import type { TrialDefenseManager } from "../defense/TrialDefenseManager";
import { trialDefenseTextureKeys } from "../defense/TrialDefenseAssets";
import type { TrialInventoryItemId, TrialInventoryModel } from "../shop/TrialInventoryModel";
import { trialShopTextureKeys } from "../shop/TrialShopAssets";
import { trialPlacementTuning } from "../tuning/TrialGameplayTuning";

export interface TrialPlacementControllerOptions {
  readonly scene: Phaser.Scene;
  readonly surfaceLayout: GroundSurfaceLayout;
  readonly character: TrialCharacterController;
  readonly inventory: TrialInventoryModel;
  readonly defenseManager: TrialDefenseManager;
  readonly onSelectionCleared?: () => void;
}

export class TrialPlacementController {
  private readonly scene: Phaser.Scene;
  private readonly surfaceLayout: GroundSurfaceLayout;
  private readonly character: TrialCharacterController;
  private readonly inventory: TrialInventoryModel;
  private readonly defenseManager: TrialDefenseManager;
  private readonly onSelectionCleared?: () => void;
  private readonly preview: Phaser.GameObjects.Image;
  private selectedItemId: TrialInventoryItemId | null = null;
  private isEnabled = true;
  private suppressNextPointerDown = false;
  private wasPointerDown = false;
  private previewCell: GridCoordinate | null = null;
  private previewIsValid = false;

  constructor(options: TrialPlacementControllerOptions) {
    this.scene = options.scene;
    this.surfaceLayout = options.surfaceLayout;
    this.character = options.character;
    this.inventory = options.inventory;
    this.defenseManager = options.defenseManager;
    this.onSelectionCleared = options.onSelectionCleared;
    this.preview = this.scene.add
      .image(0, 0, trialShopTextureKeys.mine)
      .setOrigin(0.5, 0.5)
      .setAlpha(trialPlacementTuning.previewAlpha)
      .setVisible(false)
      .setDepth(4000);
  }

  setEnabled(isEnabled: boolean): void {
    this.isEnabled = isEnabled;
    if (!isEnabled) {
      this.clearSelection();
    }
  }

  setSelectedItem(itemId: TrialInventoryItemId | null): void {
    this.selectedItemId = itemId;
    this.suppressNextPointerDown = this.scene.input.activePointer.isDown;
    this.preview.setVisible(Boolean(itemId) && this.isEnabled);
    if (itemId) {
      this.refreshPreviewTexture(itemId);
    }
  }

  hasSelection(): boolean {
    return this.isEnabled && Boolean(this.selectedItemId);
  }

  clearSelection(): void {
    this.selectedItemId = null;
    this.preview.setVisible(false);
    this.previewCell = null;
    this.onSelectionCleared?.();
  }

  update(): void {
    if (!this.isEnabled || !this.selectedItemId || this.inventory.getCount(this.selectedItemId) <= 0) {
      this.preview.setVisible(false);
      return;
    }

    this.updatePreview();
    if (!this.scene.input.activePointer.isDown) {
      this.suppressNextPointerDown = false;
    }
    const pointer = this.scene.input.activePointer;
    const isPointerDown = pointer.isDown;
    const didPointerPress = isPointerDown && !this.wasPointerDown;
    this.wasPointerDown = isPointerDown;
    if (didPointerPress) {
      if (this.suppressNextPointerDown) {
        this.suppressNextPointerDown = false;
        return;
      }

      if (pointer.rightButtonDown()) {
        if (!this.previewIsValid) {
          return;
        }
        this.placeSelectedItem();
        return;
      }

      if (pointer.leftButtonDown()) {
        this.clearSelection();
        return;
      }
    }
  }

  private updatePreview(): void {
    const itemId = this.selectedItemId;
    if (!itemId) {
      return;
    }

    const cell = this.getPointerNeighborCell();
    if (!cell) {
      this.preview.setVisible(false);
      this.previewCell = null;
      return;
    }

    this.previewCell = cell;
    this.previewIsValid = this.defenseManager.canPlaceAt(cell);
    const position = this.surfaceLayout.gridCellCenterToWorld(cell);
    this.preview
      .setVisible(true)
      .setPosition(position.x, position.y)
      .setDepth(4000 + position.y)
      .setTint(this.previewIsValid ? trialPlacementTuning.validTint : trialPlacementTuning.invalidTint);
  }

  private placeSelectedItem(): void {
    if (!this.selectedItemId || !this.previewCell) {
      return;
    }

    if (!this.inventory.tryRemove(this.selectedItemId)) {
      return;
    }

    if (!this.defenseManager.placeInventoryItem(this.selectedItemId, this.previewCell)) {
      this.inventory.add(this.selectedItemId);
      return;
    }

    if (this.inventory.getCount(this.selectedItemId) <= 0) {
      this.clearSelection();
    }
  }

  private getPointerNeighborCell(): GridCoordinate | null {
    const pointer = this.scene.input.activePointer;
    const camera = this.scene.cameras.main;
    const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
    const characterCell = this.character.getCurrentGridCell();
    const characterPosition = this.surfaceLayout.gridCellCenterToWorld(characterCell);
    const dx = worldPoint.x - characterPosition.x;
    const dy = worldPoint.y - characterPosition.y;
    const max = Math.max(Math.abs(dx), Math.abs(dy));

    if (max < 1) {
      return null;
    }

    return {
      column: characterCell.column + Math.round(dx / max),
      row: characterCell.row + Math.round(dy / max)
    };
  }

  private refreshPreviewTexture(itemId: TrialInventoryItemId): void {
    const textureKey = this.getPreviewTextureKey(itemId);
    this.preview.setTexture(textureKey);
    this.preview.setDisplaySize(this.surfaceLayout.stride, this.surfaceLayout.stride);

    if (itemId === "mine") {
      this.preview.setScale(trialPlacementTuning.mineScale);
    }
  }

  private getPreviewTextureKey(itemId: TrialInventoryItemId): string {
    switch (itemId) {
      case "woodenFence":
        return trialDefenseTextureKeys.fenceWooden;
      case "metalFence":
        return trialDefenseTextureKeys.fenceMetal;
      case "electricFence":
        return trialDefenseTextureKeys.fenceElectric;
      case "lightTurret":
        return trialDefenseTextureKeys.turretBaseLight;
      case "machinegunTurret":
        return trialDefenseTextureKeys.turretBaseMachinegun;
      case "heavyTurret":
        return trialDefenseTextureKeys.turretBaseHeavy;
      default:
        return trialShopTextureKeys.mine;
    }
  }
}
