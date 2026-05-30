import Phaser from "phaser";
import { trialDayNightTuning } from "../tuning/TrialGameplayTuning";

export type TrialDayNightMode = "day" | "night";

export interface TrialLightSource {
  readonly x: number;
  readonly y: number;
  readonly radiusPixels: number;
  readonly intensity: number;
}

export class TrialDayNightController {
  private readonly scene: Phaser.Scene;
  private readonly generator: { readonly x: number; readonly y: number };
  private readonly textureKey = "trial:lighting:overlay";
  private overlay?: Phaser.GameObjects.Image;
  private mode: TrialDayNightMode = trialDayNightTuning.initialMode as TrialDayNightMode;
  private targetNightStrength = this.mode === "night" ? 1 : 0;
  private nightStrength = this.targetNightStrength;
  private previousMode: TrialDayNightMode = this.mode;
  private changedThisFrame = false;

  constructor(scene: Phaser.Scene, generator: { readonly x: number; readonly y: number }) {
    this.scene = scene;
    this.generator = generator;
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.recreateOverlay, this);
    this.recreateOverlay();
  }

  update(lightSources: readonly TrialLightSource[] = []): void {
    this.changedThisFrame = false;

    this.updateNightStrength();
    this.changedThisFrame = this.mode !== this.previousMode;
    this.previousMode = this.mode;
    this.syncOverlayToCamera();
    if (this.nightStrength <= 0.001) {
      return;
    }

    this.renderTexture(lightSources);
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.recreateOverlay, this);
    this.overlay?.destroy();
    this.scene.textures.remove(this.textureKey);
  }

  getMode(): TrialDayNightMode {
    return this.mode;
  }

  isNight(): boolean {
    return this.mode === "night";
  }

  setMode(mode: TrialDayNightMode): void {
    this.mode = mode;
    this.targetNightStrength = mode === "night" ? 1 : 0;
  }

  didModeChangeThisFrame(): boolean {
    return this.changedThisFrame;
  }

  private recreateOverlay(): void {
    this.overlay?.destroy();
    if (this.scene.textures.exists(this.textureKey)) {
      this.scene.textures.remove(this.textureKey);
    }

    const size = this.getTextureSize();
    this.scene.textures.createCanvas(this.textureKey, size.width, size.height);
    this.overlay = this.scene.add
      .image(0, 0, this.textureKey)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(90000);
    this.syncOverlayToCamera();
    this.renderTexture([]);
  }

  private syncOverlayToCamera(): void {
    if (!this.overlay) {
      return;
    }

    const camera = this.scene.cameras.main;
    const size = this.getTextureSize();
    const overflowX = (size.width - this.scene.scale.width) / 2;
    const overflowY = (size.height - this.scene.scale.height) / 2;
    this.overlay
      .setPosition(-overflowX / camera.zoom, -overflowY / camera.zoom)
      .setDisplaySize(size.width / camera.zoom, size.height / camera.zoom)
      .setVisible(this.nightStrength > 0.001);
  }

  private renderTexture(lightSources: readonly TrialLightSource[]): void {
    const texture = this.scene.textures.get(this.textureKey) as Phaser.Textures.CanvasTexture;
    const context = texture.getContext();
    const size = this.getTextureSize();
    const width = size.width;
    const height = size.height;

    context.clearRect(0, 0, width, height);

    context.fillStyle = `rgba(0, 1, 4, ${trialDayNightTuning.nightOverlayAlpha * this.nightStrength})`;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = "destination-out";
    this.carveLight(context, {
      x: this.generator.x,
      y: this.generator.y,
      radiusPixels: trialDayNightTuning.generatorLightRadiusPixels,
      intensity: 1
    });

    for (const lightSource of lightSources) {
      this.carveLight(context, lightSource);
    }

    context.globalCompositeOperation = "source-over";
    texture.refresh();
  }

  private carveLight(context: CanvasRenderingContext2D, lightSource: TrialLightSource): void {
    const camera = this.scene.cameras.main;
    const screen = this.worldToScreen(lightSource.x, lightSource.y);
    const radius = lightSource.radiusPixels * camera.zoom;
    const outerRadius = radius + trialDayNightTuning.generatorLightFadePixels * camera.zoom;
    const gradient = context.createRadialGradient(
      screen.x,
      screen.y,
      Math.max(1, radius * 0.1),
      screen.x,
      screen.y,
      outerRadius
    );
    gradient.addColorStop(0, `rgba(0, 0, 0, ${Phaser.Math.Clamp(lightSource.intensity, 0, 1)})`);
    gradient.addColorStop(0.62, `rgba(0, 0, 0, ${Phaser.Math.Clamp(lightSource.intensity * 0.45, 0, 1)})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(screen.x - outerRadius, screen.y - outerRadius, outerRadius * 2, outerRadius * 2);
    context.globalCompositeOperation = "source-over";
    const tint = trialDayNightTuning.lightTint;
    const tintGradient = context.createRadialGradient(screen.x, screen.y, 1, screen.x, screen.y, outerRadius);
    tintGradient.addColorStop(0, `rgba(${tint.red}, ${tint.green}, ${tint.blue}, ${tint.alpha * lightSource.intensity * this.nightStrength})`);
    tintGradient.addColorStop(1, `rgba(${tint.red}, ${tint.green}, ${tint.blue}, 0)`);
    context.fillStyle = tintGradient;
    context.fillRect(screen.x - outerRadius, screen.y - outerRadius, outerRadius * 2, outerRadius * 2);
    context.globalCompositeOperation = "destination-out";
  }

  private worldToScreen(x: number, y: number): { readonly x: number; readonly y: number } {
    const camera = this.scene.cameras.main;
    return {
      x: (x - camera.scrollX) * camera.zoom + this.getTexturePadding().x,
      y: (y - camera.scrollY) * camera.zoom + this.getTexturePadding().y
    };
  }

  private updateNightStrength(): void {
    const deltaSeconds = this.scene.game.loop.delta;
    const step = deltaSeconds / trialDayNightTuning.transitionDurationMs;

    if (this.nightStrength < this.targetNightStrength) {
      this.nightStrength = Math.min(this.targetNightStrength, this.nightStrength + step);
    }
    else if (this.nightStrength > this.targetNightStrength) {
      this.nightStrength = Math.max(this.targetNightStrength, this.nightStrength - step);
    }
  }

  private getTextureSize(): { readonly width: number; readonly height: number } {
    return {
      width: Math.ceil(this.scene.scale.width * trialDayNightTuning.overlayOverscanMultiplier),
      height: Math.ceil(this.scene.scale.height * trialDayNightTuning.overlayOverscanMultiplier)
    };
  }

  private getTexturePadding(): { readonly x: number; readonly y: number } {
    const size = this.getTextureSize();
    return {
      x: (size.width - this.scene.scale.width) / 2,
      y: (size.height - this.scene.scale.height) / 2
    };
  }
}
