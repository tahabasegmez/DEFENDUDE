import Phaser from "phaser";
import type { WorldMap } from "../../core/world/WorldMap";

export interface GroundSurfaceTransform {
  readonly scaleX: number;
  readonly scaleY: number;
  readonly rotationRadians: number;
}

export interface GroundSurfaceRendererOptions {
  readonly scene: Phaser.Scene;
  readonly map: WorldMap;
  readonly surfaceWidth: number;
  readonly surfaceHeight: number;
  readonly stride: number;
}

export class GroundSurfaceRenderer {
  private readonly scene: Phaser.Scene;
  private readonly map: WorldMap;
  private readonly surfaceWidth: number;
  private readonly surfaceHeight: number;
  private readonly stride: number;

  constructor(options: GroundSurfaceRendererOptions) {
    this.scene = options.scene;
    this.map = options.map;
    this.surfaceWidth = options.surfaceWidth;
    this.surfaceHeight = options.surfaceHeight;
    this.stride = options.stride;
  }

  render(): Phaser.GameObjects.Image {
    const tileSize = this.map.grid.tileSize;
    const width = this.surfaceWidth;
    const height = this.surfaceHeight;
    const surfaceCanvas = this.createCanvas(width, height);
    const surfaceContext = this.getContext(surfaceCanvas);

    for (const cell of this.map.cells) {
      const tileImage = this.scene.textures.get(cell.tileId).getSourceImage() as CanvasImageSource;
      surfaceContext.drawImage(
        tileImage,
        cell.coordinate.column * this.stride,
        cell.coordinate.row * this.stride,
        tileSize,
        tileSize
      );
    }

    const textureKey = `${this.map.id}:ground-surface`;

    if (this.scene.textures.exists(textureKey)) {
      this.scene.textures.remove(textureKey);
    }

    this.scene.textures.addCanvas(textureKey, surfaceCanvas);

    const surface = this.scene.add.image(width / 2, height / 2, textureKey);
    surface
      .setOrigin(0.5, 0.5)
      .setDepth(10);

    return surface;
  }

  private createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    return canvas;
  }

  private getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create 2D canvas context for ground surface rendering.");
    }

    context.imageSmoothingEnabled = false;
    return context;
  }
}
