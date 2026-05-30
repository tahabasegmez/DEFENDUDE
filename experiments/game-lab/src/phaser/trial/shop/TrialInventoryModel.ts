export type TrialInventoryItemId =
  | "pistolMagazine"
  | "smgMagazine"
  | "shotgunMagazine"
  | "rifleMagazine"
  | "rocket"
  | "woodenFence"
  | "metalFence"
  | "electricFence"
  | "lightTurret"
  | "machinegunTurret"
  | "heavyTurret"
  | "mine";

export class TrialInventoryModel {
  private readonly counts = new Map<TrialInventoryItemId, number>();

  constructor(initialCounts: Partial<Record<TrialInventoryItemId, number>> = {}) {
    for (const [itemId, count] of Object.entries(initialCounts) as Array<[TrialInventoryItemId, number]>) {
      this.counts.set(itemId, count);
    }
  }

  add(itemId: TrialInventoryItemId, amount = 1): void {
    this.counts.set(itemId, this.getCount(itemId) + amount);
  }

  tryRemove(itemId: TrialInventoryItemId, amount = 1): boolean {
    const current = this.getCount(itemId);
    if (current < amount) {
      return false;
    }

    this.counts.set(itemId, current - amount);
    return true;
  }

  getCount(itemId: TrialInventoryItemId): number {
    return this.counts.get(itemId) ?? 0;
  }

  getSnapshot(): Partial<Record<TrialInventoryItemId, number>> {
    return Object.fromEntries(this.counts.entries()) as Partial<Record<TrialInventoryItemId, number>>;
  }

  restore(snapshot: Partial<Record<TrialInventoryItemId, number>>): void {
    this.counts.clear();
    for (const [itemId, count] of Object.entries(snapshot) as Array<[TrialInventoryItemId, number]>) {
      this.counts.set(itemId, Math.max(0, Math.floor(count)));
    }
  }
}
