import Phaser from "phaser";

export interface WorldCameraControllerOptions {
  readonly scene: Phaser.Scene;
  readonly camera: Phaser.Cameras.Scene2D.Camera;
  readonly target: Phaser.GameObjects.GameObject;
  readonly boundsProvider: () => Phaser.Geom.Rectangle;
  readonly zoom: number;
  readonly followLerp?: number;
}

export class WorldCameraController {
  private readonly scene: Phaser.Scene;
  private readonly camera: Phaser.Cameras.Scene2D.Camera;
  private readonly target: Phaser.GameObjects.GameObject;
  private readonly boundsProvider: () => Phaser.Geom.Rectangle;
  private readonly zoom: number;
  private readonly followLerp: number;

  constructor(options: WorldCameraControllerOptions) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.target = options.target;
    this.boundsProvider = options.boundsProvider;
    this.zoom = options.zoom;
    this.followLerp = options.followLerp ?? 0.12;
  }

  start(): void {
    this.applyBounds();
    this.camera.setZoom(this.zoom);
    this.camera.roundPixels = true;
    this.camera.startFollow(this.target, true, this.followLerp, this.followLerp);
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.refresh, this);
  }

  refresh(): void {
    this.applyBounds();
    this.clampScrollToBounds();
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.refresh, this);
    this.camera.stopFollow();
  }

  private applyBounds(): void {
    const bounds = this.boundsProvider();

    this.camera.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  private clampScrollToBounds(): void {
    const bounds = this.boundsProvider();
    const viewportWorldWidth = this.scene.scale.width / this.camera.zoom;
    const viewportWorldHeight = this.scene.scale.height / this.camera.zoom;
    const minScrollX = bounds.x;
    const minScrollY = bounds.y;
    const maxScrollX = bounds.x + bounds.width - viewportWorldWidth;
    const maxScrollY = bounds.y + bounds.height - viewportWorldHeight;

    this.camera.scrollX = Phaser.Math.Clamp(this.camera.scrollX, minScrollX, Math.max(minScrollX, maxScrollX));
    this.camera.scrollY = Phaser.Math.Clamp(this.camera.scrollY, minScrollY, Math.max(minScrollY, maxScrollY));
  }
}
