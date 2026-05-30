import type { TrialWeaponDefinition, TrialWeaponRuntimeSnapshot } from "./TrialCombatTypes";

export interface TrialWeaponRuntimeSaveData {
  readonly ammoInMagazine: number | "infinite";
  readonly reserveAmmo: number | "infinite";
}

export class TrialWeaponRuntime {
  private readonly definition: TrialWeaponDefinition;
  private cooldownRemainingMs = 0;
  private reloadRemainingMs = 0;
  private ammoInMagazine: number | "infinite";
  private reserveAmmo: number | "infinite";

  constructor(definition: TrialWeaponDefinition) {
    this.definition = definition;
    this.ammoInMagazine = definition.magazine ? definition.magazine.capacity : "infinite";
    this.reserveAmmo = definition.magazine ? definition.magazine.reserveAmmo : "infinite";
  }

  update(deltaMs: number): void {
    this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - deltaMs);

    if (this.reloadRemainingMs > 0) {
      this.reloadRemainingMs = Math.max(0, this.reloadRemainingMs - deltaMs);

      if (this.reloadRemainingMs === 0) {
        this.finishReload();
      }
    }
  }

  tryConsumeShot(): boolean {
    if (this.cooldownRemainingMs > 0 || this.reloadRemainingMs > 0) {
      return false;
    }

    if (this.ammoInMagazine === 0) {
      this.tryStartReload();
      return false;
    }

    if (typeof this.ammoInMagazine === "number") {
      this.ammoInMagazine -= 1;
    }

    this.cooldownRemainingMs = this.definition.cooldownMs;

    if (this.ammoInMagazine === 0) {
      this.tryStartReload();
    }

    return true;
  }

  getSnapshot(): TrialWeaponRuntimeSnapshot {
    return {
      weaponId: this.definition.id,
      magazineCapacity: this.definition.magazine?.capacity ?? "infinite",
      cooldownRemainingMs: this.cooldownRemainingMs,
      isReloading: this.reloadRemainingMs > 0,
      reloadRemainingMs: this.reloadRemainingMs,
      reloadDurationMs: this.definition.magazine?.reloadDurationMs ?? 0,
      ammoInMagazine: this.ammoInMagazine,
      reserveAmmo: this.reserveAmmo
    };
  }

  addReserveMagazine(amount = 1): void {
    const magazine = this.definition.magazine;
    if (!magazine || this.reserveAmmo === "infinite") {
      return;
    }

    this.reserveAmmo += magazine.capacity * amount;
  }

  addReserveAmmo(amount = 1): void {
    if (this.reserveAmmo === "infinite") {
      return;
    }

    this.reserveAmmo += amount;
  }

  getSaveData(): TrialWeaponRuntimeSaveData {
    return {
      ammoInMagazine: this.ammoInMagazine,
      reserveAmmo: this.reserveAmmo
    };
  }

  restore(saveData: TrialWeaponRuntimeSaveData): void {
    this.ammoInMagazine = saveData.ammoInMagazine;
    this.reserveAmmo = saveData.reserveAmmo;
    this.cooldownRemainingMs = 0;
    this.reloadRemainingMs = 0;
  }

  private tryStartReload(): void {
    if (!this.definition.magazine || this.reloadRemainingMs > 0) {
      return;
    }

    if (this.reserveAmmo === 0) {
      return;
    }

    this.reloadRemainingMs = this.definition.magazine.reloadDurationMs;
  }

  private finishReload(): void {
    const magazine = this.definition.magazine;

    if (!magazine) {
      return;
    }

    if (this.reserveAmmo === "infinite") {
      this.ammoInMagazine = magazine.capacity;
      return;
    }

    const neededAmmo = magazine.capacity - (typeof this.ammoInMagazine === "number" ? this.ammoInMagazine : 0);
    const loadedAmmo = Math.min(neededAmmo, this.reserveAmmo);
    this.ammoInMagazine = (typeof this.ammoInMagazine === "number" ? this.ammoInMagazine : 0) + loadedAmmo;
    this.reserveAmmo -= loadedAmmo;
  }
}
