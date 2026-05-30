import Phaser from "phaser";
import { trialTypographyTuning, trialWaveTuning } from "../tuning/TrialGameplayTuning";

export interface TrialWaveControllerOptions {
  readonly scene: Phaser.Scene;
  readonly onWaveIntroStart: (waveNumber: number) => void;
  readonly onWaveIntroComplete: (waveNumber: number) => void;
}

export class TrialWaveController {
  private readonly scene: Phaser.Scene;
  private readonly onWaveIntroStart: (waveNumber: number) => void;
  private readonly onWaveIntroComplete: (waveNumber: number) => void;
  private readonly indicatorText: Phaser.GameObjects.Text;
  private readonly playButton: Phaser.GameObjects.Text;
  private readonly introText: Phaser.GameObjects.Text;
  private currentWave: number = trialWaveTuning.startWave;
  private isDay = true;
  private isIntroPlaying = false;
  private isEnabled = true;

  constructor(options: TrialWaveControllerOptions) {
    this.scene = options.scene;
    this.onWaveIntroStart = options.onWaveIntroStart;
    this.onWaveIntroComplete = options.onWaveIntroComplete;
    this.indicatorText = this.createText("", trialWaveTuning.indicatorFontSizePixels, 100500).setOrigin(1, 0);
    this.playButton = this.createText(">", trialWaveTuning.indicatorFontSizePixels, 100501)
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.introText = this.createText("", 72, 100600).setOrigin(0.5, 0.5).setVisible(false);
    this.playButton.on(Phaser.Input.Events.POINTER_DOWN, () => this.tryStartNextWave());
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.layout();
    this.updateVisibility();
  }

  update(): void {
    if (!this.isEnabled) {
      return;
    }
    this.layout();
  }

  setEnabled(isEnabled: boolean): void {
    this.isEnabled = isEnabled;
    for (const item of [this.indicatorText, this.playButton, this.introText]) {
      item.setVisible(isEnabled && item.visible);
    }
    if (isEnabled) {
      this.updateVisibility();
    }
  }

  completeWave(): void {
    this.isDay = true;
    this.updateVisibility();
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getCompletedWave(): number {
    return this.isDay ? this.currentWave : Math.max(0, this.currentWave - 1);
  }

  setCompletedWave(waveNumber: number): void {
    this.currentWave = Math.max(0, Math.floor(waveNumber));
    this.isDay = true;
    this.isIntroPlaying = false;
    this.updateVisibility();
  }

  isIntroActive(): boolean {
    return this.isIntroPlaying;
  }

  isWaveNightActive(): boolean {
    return !this.isDay && !this.isIntroPlaying;
  }

  private tryStartNextWave(): void {
    if (!this.isDay || this.isIntroPlaying) {
      return;
    }

    this.currentWave += 1;
    this.isDay = false;
    this.isIntroPlaying = true;
    this.updateVisibility();
    this.onWaveIntroStart(this.currentWave);
    this.playIntroAnimation();
  }

  private playIntroAnimation(): void {
    this.introText
      .setText(`WAVE ${this.currentWave}`)
      .setAlpha(1)
      .setScale(trialWaveTuning.introStartScale)
      .setVisible(true);
    this.centerIntroText();
    this.scene.tweens.killTweensOf(this.introText);
    this.scene.tweens.add({
      targets: this.introText,
      scale: trialWaveTuning.introEndScale,
      alpha: 0,
      duration: trialWaveTuning.introDurationMs,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.introText.setVisible(false);
        this.isIntroPlaying = false;
        this.updateVisibility();
        this.onWaveIntroComplete(this.currentWave);
      }
    });
  }

  private updateVisibility(): void {
    this.indicatorText.setText(`WAVE ${this.getDisplayedWaveNumber()}`);
    this.indicatorText.setVisible(this.isEnabled && !this.isIntroPlaying);
    this.playButton.setVisible(this.isEnabled && this.isDay && !this.isIntroPlaying);
  }

  private layout(): void {
    const cameraZoom = this.getCameraZoom();
    const width = this.scene.cameras.main.width || this.scene.scale.width;
    const margin = trialWaveTuning.indicatorMarginPixels;
    const y = margin.y / cameraZoom;
    const indicatorX = (width - margin.x) / cameraZoom;
    this.indicatorText.setPosition(indicatorX, y).setScale(1 / cameraZoom);
    this.playButton
      .setPosition(indicatorX - (this.indicatorText.width + trialWaveTuning.playButtonGapPixels) / cameraZoom, y)
      .setScale(1 / cameraZoom);
    this.centerIntroText();
  }

  private centerIntroText(): void {
    const cameraZoom = this.getCameraZoom();
    const width = this.scene.cameras.main.width || this.scene.scale.width;
    const height = this.scene.cameras.main.height || this.scene.scale.height;
    this.introText.setPosition(
      (width / 2 + trialWaveTuning.introOffsetPixels.x) / cameraZoom,
      (height / 2 + trialWaveTuning.introOffsetPixels.y) / cameraZoom
    );
  }

  private getDisplayedWaveNumber(): number {
    return Math.max(1, this.isDay ? this.currentWave + 1 : this.currentWave);
  }

  private createText(text: string, fontSize: number, depth: number): Phaser.GameObjects.Text {
    return this.scene.add.text(0, 0, text, {
      fontFamily: trialTypographyTuning.fontFamily,
      fontSize: `${fontSize}px`,
      color: "#f2e6c9",
      stroke: "#130f0a",
      strokeThickness: 6
    }).setScrollFactor(0).setDepth(depth);
  }

  private getCameraZoom(): number {
    return this.scene.cameras.main.zoom || 1;
  }
}
