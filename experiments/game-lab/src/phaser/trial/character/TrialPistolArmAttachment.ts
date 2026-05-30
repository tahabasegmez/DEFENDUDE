import Phaser from "phaser";
import type { TrialWeaponArmDefinition } from "../combat/TrialCombatTypes";
import { trialWeaponArmDefinitions } from "../combat/TrialWeaponTuning";
import { trialCharacterAnimationKeys } from "./TrialCharacterAssets";

const idleBodySocketFromCharacterTopLeft = {
  x: 54,
  y: 66
};

const walkBodySocketFromCharacterTopLeft = {
  x: 61,
  y: 71
};

export interface TrialPistolArmAttachmentOptions {
  readonly scene: Phaser.Scene;
  readonly body: Phaser.GameObjects.Sprite;
}

export class TrialPistolArmAttachment {
  private readonly scene: Phaser.Scene;
  private readonly body: Phaser.GameObjects.Sprite;
  private readonly arm: Phaser.GameObjects.Image;
  private currentWeaponId = "pistol";
  private currentArmDefinition: TrialWeaponArmDefinition = trialWeaponArmDefinitions.pistol;
  private aimAngleRadians = 0;
  private isMirroredRight = false;

  constructor(options: TrialPistolArmAttachmentOptions) {
    this.scene = options.scene;
    this.body = options.body;
    this.arm = this.scene.add.image(0, 0, this.currentArmDefinition.textureKey);
    this.applyArmOrigin(false);
    this.arm.setDepth(this.body.depth + 1);
  }

  setWeapon(weaponId: string): void {
    const definition = trialWeaponArmDefinitions[weaponId];

    if (!definition || definition.weaponId === this.currentWeaponId) {
      return;
    }

    this.currentWeaponId = definition.weaponId;
    this.currentArmDefinition = definition;
    this.arm.setTexture(definition.textureKey);
    this.applyArmOrigin(this.isMirroredRight);
  }

  getCurrentWeaponId(): string {
    return this.currentWeaponId;
  }

  update(): void {
    if (this.body.anims.currentAnim?.key === trialCharacterAnimationKeys.death) {
      this.arm.setVisible(false);
      return;
    }

    this.arm.setVisible(true);
    const pointerWorld = this.scene.input.activePointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
    const isPointerOnCharacterRight = pointerWorld.x >= this.body.x;
    this.isMirroredRight = isPointerOnCharacterRight;
    this.body.setFlipX(isPointerOnCharacterRight);

    const socketWorld = this.getBodySocketWorldPosition(isPointerOnCharacterRight);
    const aimAngle = Phaser.Math.Angle.Between(socketWorld.x, socketWorld.y, pointerWorld.x, pointerWorld.y);
    this.aimAngleRadians = aimAngle;

    this.applyArmOrigin(isPointerOnCharacterRight);
    this.arm.setPosition(socketWorld.x, socketWorld.y);
    this.arm.setRotation(aimAngle - this.currentArmDefinition.artworkForwardRadians);
    this.arm.setFlipY(isPointerOnCharacterRight);
    this.arm.setScale(
      Math.abs(this.body.scaleX) * this.currentArmDefinition.scale,
      Math.abs(this.body.scaleY) * this.currentArmDefinition.scale
    );
    this.arm.setDepth(this.body.depth + 1);
  }

  getAimAngleRadians(): number {
    return this.aimAngleRadians;
  }

  getMuzzleWorldPosition(): Phaser.Math.Vector2 {
    return this.armLocalPointToWorld(this.currentArmDefinition.muzzleFromArmTopLeft);
  }

  private getBodySocketWorldPosition(isFacingRight: boolean): Phaser.Math.Vector2 {
    const scaleX = Math.abs(this.body.scaleX);
    const scaleY = Math.abs(this.body.scaleY);
    const frameWidth = this.body.frame.realWidth;
    const frameHeight = this.body.frame.realHeight;
    const untrimmedLeft = this.body.x - frameWidth * scaleX * this.body.originX;
    const untrimmedTop = this.body.y - frameHeight * scaleY * this.body.originY;
    const socket = this.getActiveBodySocket();
    const socketX = isFacingRight
      ? (frameWidth - socket.x) * scaleX
      : socket.x * scaleX;
    const socketY = socket.y * scaleY;

    return new Phaser.Math.Vector2(untrimmedLeft + socketX, untrimmedTop + socketY);
  }

  private applyArmOrigin(isMirroredRight: boolean): void {
    const pivot = this.currentArmDefinition.pivotFromArmTopLeft;
    const pivotY = isMirroredRight
      ? this.arm.height - pivot.y
      : pivot.y;

    this.arm.setOrigin(
      pivot.x / this.arm.width,
      pivotY / this.arm.height
    );
  }

  private armLocalPointToWorld(pointFromArmTopLeft: { readonly x: number; readonly y: number }): Phaser.Math.Vector2 {
    const pivot = this.currentArmDefinition.pivotFromArmTopLeft;
    const pivotY = this.isMirroredRight
      ? this.arm.height - pivot.y
      : pivot.y;
    const pointY = this.isMirroredRight
      ? this.arm.height - pointFromArmTopLeft.y
      : pointFromArmTopLeft.y;
    const scaleX = Math.abs(this.arm.scaleX);
    const scaleY = Math.abs(this.arm.scaleY);
    const localX = (pointFromArmTopLeft.x - pivot.x) * scaleX;
    const localY = (pointY - pivotY) * scaleY;
    const cos = Math.cos(this.arm.rotation);
    const sin = Math.sin(this.arm.rotation);

    return new Phaser.Math.Vector2(
      this.arm.x + localX * cos - localY * sin,
      this.arm.y + localX * sin + localY * cos
    );
  }

  private getActiveBodySocket(): { readonly x: number; readonly y: number } {
    if (this.body.anims.currentAnim?.key === trialCharacterAnimationKeys.walk) {
      return walkBodySocketFromCharacterTopLeft;
    }

    return idleBodySocketFromCharacterTopLeft;
  }
}
