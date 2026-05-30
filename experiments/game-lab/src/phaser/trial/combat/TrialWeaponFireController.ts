import Phaser from "phaser";
import type { TrialPistolArmAttachment } from "../character/TrialPistolArmAttachment";
import { trialProjectileDefinitions, trialWeaponDefinitions, trialWeaponOrder } from "./TrialWeaponTuning";
import { TrialProjectileManager } from "./TrialProjectileManager";
import { TrialWeaponRuntime, type TrialWeaponRuntimeSaveData } from "./TrialWeaponRuntime";

export class TrialWeaponFireController {
  private readonly scene: Phaser.Scene;
  private readonly armAttachment: TrialPistolArmAttachment;
  private readonly projectileManager: TrialProjectileManager;
  private readonly weaponRuntimes = new Map<string, TrialWeaponRuntime>();
  private readonly weaponSwitchKeys: Phaser.Input.Keyboard.Key[];
  private readonly canDamageStructures: boolean;
  private activeWeaponId = "pistol";

  constructor(
    scene: Phaser.Scene,
    armAttachment: TrialPistolArmAttachment,
    projectileManager: TrialProjectileManager,
    canDamageStructures = false
  ) {
    this.scene = scene;
    this.armAttachment = armAttachment;
    this.projectileManager = projectileManager;
    this.canDamageStructures = canDamageStructures;
    this.weaponSwitchKeys = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
      Phaser.Input.Keyboard.KeyCodes.FOUR,
      Phaser.Input.Keyboard.KeyCodes.FIVE
    ].map((keyCode) => this.scene.input.keyboard!.addKey(keyCode));

    for (const weaponId of trialWeaponOrder) {
      this.weaponRuntimes.set(weaponId, new TrialWeaponRuntime(trialWeaponDefinitions[weaponId]));
    }
  }

  update(deltaMs: number): void {
    this.updateWeaponSwitchInput();

    for (const runtime of this.weaponRuntimes.values()) {
      runtime.update(deltaMs);
    }

    if (!this.scene.input.activePointer.leftButtonDown()) {
      return;
    }

    const weaponDefinition = trialWeaponDefinitions[this.activeWeaponId];
    const weaponRuntime = this.getActiveRuntime();

    if (!weaponRuntime.tryConsumeShot()) {
      return;
    }

    const projectileDefinition = trialProjectileDefinitions[weaponDefinition.projectileId];
    const muzzle = this.armAttachment.getMuzzleWorldPosition();

    for (const angleOffset of weaponDefinition.projectileAngleOffsetsRadians) {
      this.projectileManager.spawn({
        definition: projectileDefinition,
        x: muzzle.x,
        y: muzzle.y,
        angleRadians: this.armAttachment.getAimAngleRadians() + angleOffset,
        canDamageStructures: this.canDamageStructures
      });
    }
  }

  getHudSnapshot() {
    return this.getActiveRuntime().getSnapshot();
  }

  getHudSnapshots() {
    return trialWeaponOrder.map((weaponId) => this.weaponRuntimes.get(weaponId)!.getSnapshot());
  }

  getActiveWeaponId(): string {
    return this.activeWeaponId;
  }

  addPurchasedAmmo(weaponId: string): void {
    const runtime = this.weaponRuntimes.get(weaponId);
    if (!runtime) {
      return;
    }

    if (weaponId === "rocketLauncher") {
      runtime.addReserveAmmo(1);
      return;
    }

    runtime.addReserveMagazine(1);
  }

  getSaveData(): {
    readonly activeWeaponId: string;
    readonly weapons: Record<string, TrialWeaponRuntimeSaveData>;
  } {
    const weapons: Record<string, TrialWeaponRuntimeSaveData> = {};
    for (const [weaponId, runtime] of this.weaponRuntimes.entries()) {
      weapons[weaponId] = runtime.getSaveData();
    }

    return {
      activeWeaponId: this.activeWeaponId,
      weapons
    };
  }

  restore(saveData: {
    readonly activeWeaponId?: string;
    readonly weapons?: Partial<Record<string, TrialWeaponRuntimeSaveData>>;
  }): void {
    for (const [weaponId, runtimeSaveData] of Object.entries(saveData.weapons ?? {})) {
      const runtime = this.weaponRuntimes.get(weaponId);
      if (runtime && runtimeSaveData) {
        runtime.restore(runtimeSaveData);
      }
    }

    if (saveData.activeWeaponId && this.weaponRuntimes.has(saveData.activeWeaponId)) {
      this.activeWeaponId = saveData.activeWeaponId;
      this.armAttachment.setWeapon(saveData.activeWeaponId);
    }
  }

  private updateWeaponSwitchInput(): void {
    for (let index = 0; index < this.weaponSwitchKeys.length; index++) {
      if (!Phaser.Input.Keyboard.JustDown(this.weaponSwitchKeys[index])) {
        continue;
      }

      const nextWeaponId = trialWeaponOrder[index];
      if (!nextWeaponId) {
        continue;
      }

      this.activeWeaponId = nextWeaponId;
      this.armAttachment.setWeapon(nextWeaponId);
    }
  }

  private getActiveRuntime(): TrialWeaponRuntime {
    const runtime = this.weaponRuntimes.get(this.activeWeaponId);

    if (!runtime) {
      throw new Error(`Weapon runtime is missing for "${this.activeWeaponId}".`);
    }

    return runtime;
  }
}
