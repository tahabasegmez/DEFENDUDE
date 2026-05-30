import Phaser from "phaser";
import type { TrialPlayerHealth } from "../player/TrialPlayerHealth";
import { trialHeartHudTextureKeys } from "./TrialHeartHudAssets";

export interface TrialWorldHeartBarOptions {
  readonly scene: Phaser.Scene;
  readonly health: TrialPlayerHealth;
  readonly scale: number;
  readonly spacingPixels: number;
  readonly depth: number;
}

export class TrialWorldHeartBar {
  private readonly health: TrialPlayerHealth;
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private readonly spacingPixels: number;

  constructor(options: TrialWorldHeartBarOptions) {
    this.health = options.health;
    this.spacingPixels = options.spacingPixels;

    const maxHearts = Math.ceil(this.health.getSnapshot().maxHalfHearts / 2);
    for (let index = 0; index < maxHearts; index++) {
      this.hearts.push(
        options.scene.add
          .image(0, 0, trialHeartHudTextureKeys.full)
          .setScale(options.scale)
          .setDepth(options.depth)
      );
    }
  }

  update(centerX: number, y: number): void {
    const snapshot = this.health.getSnapshot();
    const totalWidth = (this.hearts.length - 1) * this.spacingPixels;
    const startX = centerX - totalWidth / 2;

    for (let index = 0; index < this.hearts.length; index++) {
      const remainingHalfHearts = snapshot.currentHalfHearts - index * 2;
      const textureKey = remainingHalfHearts >= 2
        ? trialHeartHudTextureKeys.full
        : remainingHalfHearts === 1
          ? trialHeartHudTextureKeys.half
          : trialHeartHudTextureKeys.empty;

      this.hearts[index]
        .setTexture(textureKey)
        .setPosition(startX + index * this.spacingPixels, y);
    }
  }

  destroy(): void {
    for (const heart of this.hearts) {
      heart.destroy();
    }
  }
}
