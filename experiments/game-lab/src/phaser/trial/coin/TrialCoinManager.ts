import Phaser from "phaser";
import type { TrialCharacterController } from "../character/TrialCharacterController";
import { trialCoinTuning, trialTypographyTuning } from "../tuning/TrialGameplayTuning";
import { trialCoinTextureKeys } from "./TrialCoinAssets";
import type { TrialCoinWallet } from "./TrialCoinWallet";

interface CoinStack {
  readonly sprite: Phaser.GameObjects.Image;
  readonly label: Phaser.GameObjects.Text;
  baseX: number;
  baseY: number;
  value: number;
  magnetSpeed: number;
  isMagnetizing: boolean;
}

export class TrialCoinManager {
  private readonly scene: Phaser.Scene;
  private readonly wallet: TrialCoinWallet;
  private readonly stacks: CoinStack[] = [];

  constructor(scene: Phaser.Scene, wallet: TrialCoinWallet) {
    this.scene = scene;
    this.wallet = wallet;
  }

  dropCoins(x: number, y: number, value: number): void {
    const existingStack = this.findMergeStack(x, y);
    if (existingStack) {
      this.animateMergeCoin(existingStack, x, y, value);
      return;
    }

    const sprite = this.scene.add
      .image(x, y, trialCoinTextureKeys.gold)
      .setOrigin(0.5, 0.5)
      .setScale(trialCoinTuning.scale)
      .setDepth(25000 + y);
    const label = this.scene.add
      .text(x + 18, y + 17, "", {
        fontFamily: trialTypographyTuning.fontFamily,
        fontSize: `${trialTypographyTuning.coinStackFontSizePixels}px`,
        color: "#ffffff",
        stroke: "#191005",
        strokeThickness: 4
      })
      .setOrigin(0, 0.5)
      .setDepth(sprite.depth + 1);
    const stack: CoinStack = {
      sprite,
      label,
      baseX: x,
      baseY: y,
      value,
      magnetSpeed: trialCoinTuning.magnetStartSpeedPixelsPerSecond,
      isMagnetizing: false
    };
    this.stacks.push(stack);
    this.refreshLabel(stack);
    this.scene.tweens.add({
      targets: sprite,
      y: y - trialCoinTuning.bobAmplitudePixels,
      yoyo: true,
      repeat: -1,
      duration: trialCoinTuning.bobDurationMs / 2,
      ease: "Sine.inOut"
    });
  }

  update(deltaMs: number, character: TrialCharacterController): void {
    const characterPoint = character.getCoinPickupTargetWorldPosition();
    const pickupDistance = trialCoinTuning.pickupDistancePixels;

    for (let index = this.stacks.length - 1; index >= 0; index--) {
      const stack = this.stacks[index];
      const distance = Phaser.Math.Distance.Between(stack.sprite.x, stack.sprite.y, characterPoint.x, characterPoint.y);

      if (!stack.isMagnetizing && distance <= pickupDistance) {
        stack.isMagnetizing = true;
        this.scene.tweens.killTweensOf(stack.sprite);
      }

      if (stack.isMagnetizing) {
        this.updateMagnetStack(stack, characterPoint, deltaMs);
      }

      stack.sprite.setDepth(25000 + stack.sprite.y);
      stack.label
        .setPosition(stack.sprite.x + 18, stack.sprite.y + 17)
        .setDepth(stack.sprite.depth + 1);

      if (distance <= trialCoinTuning.collectDistancePixels) {
        this.wallet.add(stack.value);
        stack.sprite.destroy();
        stack.label.destroy();
        this.stacks.splice(index, 1);
      }
    }
  }

  private updateMagnetStack(stack: CoinStack, target: { readonly x: number; readonly y: number }, deltaMs: number): void {
    const deltaSeconds = deltaMs / 1000;
    stack.magnetSpeed += trialCoinTuning.magnetAccelerationPixelsPerSecondSquared * deltaSeconds;
    const angle = Phaser.Math.Angle.Between(stack.sprite.x, stack.sprite.y, target.x, target.y);
    const distance = stack.magnetSpeed * deltaSeconds;
    stack.sprite.x += Math.cos(angle) * distance;
    stack.sprite.y += Math.sin(angle) * distance;
  }

  private findMergeStack(x: number, y: number): CoinStack | null {
    return this.stacks.find((stack) => {
      const distance = Phaser.Math.Distance.Between(stack.baseX, stack.baseY, x, y);
      return distance <= trialCoinTuning.stackMergeDistancePixels;
    }) ?? null;
  }

  private refreshLabel(stack: CoinStack): void {
    stack.label.setText(stack.value > 1 ? `x${stack.value}` : "");
  }

  private animateMergeCoin(targetStack: CoinStack, x: number, y: number, value: number): void {
    const incoming = this.scene.add
      .image(x, y, trialCoinTextureKeys.gold)
      .setOrigin(0.5, 0.5)
      .setScale(trialCoinTuning.scale)
      .setDepth(25000 + y + 2);

    this.scene.tweens.add({
      targets: incoming,
      x: targetStack.sprite.x,
      y: targetStack.sprite.y,
      scale: trialCoinTuning.scale * 0.72,
      duration: 320,
      ease: "Quad.easeIn",
      onUpdate: () => incoming.setDepth(25000 + incoming.y + 2),
      onComplete: () => {
        incoming.destroy();
        targetStack.value += value;
        targetStack.baseX = targetStack.sprite.x;
        targetStack.baseY = targetStack.sprite.y;
        this.refreshLabel(targetStack);
        this.scene.tweens.add({
          targets: targetStack.sprite,
          scale: trialCoinTuning.scale * 1.2,
          yoyo: true,
          duration: 120,
          ease: "Sine.easeOut"
        });
      }
    });
  }
}
