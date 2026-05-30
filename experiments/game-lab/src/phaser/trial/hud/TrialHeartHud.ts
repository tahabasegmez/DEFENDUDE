import Phaser from "phaser";
import type { TrialPlayerHealth } from "../player/TrialPlayerHealth";
import { trialHeartHudTextureKeys } from "./TrialHeartHudAssets";

export class TrialHeartHud {
  private readonly scene: Phaser.Scene;
  private readonly health: TrialPlayerHealth;
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private readonly heartScale = 0.075;
  private readonly spacing = 32;
  private readonly margin = 22;

  constructor(scene: Phaser.Scene, health: TrialPlayerHealth) {
    this.scene = scene;
    this.health = health;

    const maxHearts = Math.ceil(this.health.getSnapshot().maxHalfHearts / 2);
    for (let index = 0; index < maxHearts; index++) {
      this.hearts.push(
        this.scene.add
          .image(0, 0, trialHeartHudTextureKeys.full)
          .setScrollFactor(0)
          .setScale(this.heartScale)
          .setDepth(100000)
      );
    }

    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.layout();
    this.update();
  }

  update(): void {
    const snapshot = this.health.getSnapshot();

    for (let index = 0; index < this.hearts.length; index++) {
      const remainingHalfHearts = snapshot.currentHalfHearts - index * 2;
      const textureKey = remainingHalfHearts >= 2
        ? trialHeartHudTextureKeys.full
        : remainingHalfHearts === 1
          ? trialHeartHudTextureKeys.half
          : trialHeartHudTextureKeys.empty;

      this.hearts[index].setTexture(textureKey);
    }
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    for (const heart of this.hearts) {
      heart.destroy();
    }
  }

  private layout(): void {
    const totalWidth = (this.hearts.length - 1) * this.spacing;
    const startX = this.scene.scale.width - this.margin - totalWidth;
    const y = this.scene.scale.height - this.margin;

    for (let index = 0; index < this.hearts.length; index++) {
      this.hearts[index].setPosition(startX + index * this.spacing, y);
    }
  }
}
