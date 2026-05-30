import Phaser from "phaser";
import { trialCoinTextureKeys } from "../coin/TrialCoinAssets";
import type { TrialCoinWallet } from "../coin/TrialCoinWallet";
import { trialTypographyTuning } from "../tuning/TrialGameplayTuning";

export class TrialCoinHud {
  private readonly scene: Phaser.Scene;
  private readonly wallet: TrialCoinWallet;
  private readonly icon: Phaser.GameObjects.Image;
  private readonly text: Phaser.GameObjects.Text;
  private readonly margin = 22;

  constructor(scene: Phaser.Scene, wallet: TrialCoinWallet) {
    this.scene = scene;
    this.wallet = wallet;
    this.icon = this.scene.add
      .image(0, 0, trialCoinTextureKeys.gold)
      .setScrollFactor(0)
      .setScale(0.035)
      .setDepth(100000);
    this.text = this.scene.add
      .text(0, 0, "0", {
        fontFamily: trialTypographyTuning.fontFamily,
        fontSize: `${trialTypographyTuning.hudFontSizePixels}px`,
        color: "#f7d86a",
        stroke: "#1b1305",
        strokeThickness: 4
      })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(100001);

    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.layout();
    this.update();
  }

  update(): void {
    this.text.setText(`${this.wallet.getTotal()}`);
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.icon.destroy();
    this.text.destroy();
  }

  private layout(): void {
    const x = this.scene.scale.width - this.margin;
    const y = this.scene.scale.height - 68;
    this.text.setPosition(x, y);
    this.icon.setPosition(x - this.text.width - 22, y);
  }
}
