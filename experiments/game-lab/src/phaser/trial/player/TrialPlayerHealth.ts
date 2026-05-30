export class TrialPlayerHealth {
  private readonly maxHalfHearts: number;
  private currentHalfHearts: number;

  constructor(maxHalfHearts: number) {
    this.maxHalfHearts = maxHalfHearts;
    this.currentHalfHearts = maxHalfHearts;
  }

  applyDamage(halfHearts: number): void {
    this.currentHalfHearts = Math.max(0, this.currentHalfHearts - halfHearts);
  }

  setCurrentHalfHearts(halfHearts: number): void {
    this.currentHalfHearts = Math.max(0, Math.min(this.maxHalfHearts, halfHearts));
  }

  isDead(): boolean {
    return this.currentHalfHearts <= 0;
  }

  getSnapshot(): { readonly currentHalfHearts: number; readonly maxHalfHearts: number } {
    return {
      currentHalfHearts: this.currentHalfHearts,
      maxHalfHearts: this.maxHalfHearts
    };
  }
}
