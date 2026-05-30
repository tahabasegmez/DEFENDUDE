export class TrialCoinWallet {
  private total = 0;

  add(amount: number): void {
    this.total += amount;
  }

  setTotal(amount: number): void {
    this.total = Math.max(0, Math.floor(amount));
  }

  trySpend(amount: number): boolean {
    if (this.total < amount) {
      return false;
    }

    this.total -= amount;
    return true;
  }

  getTotal(): number {
    return this.total;
  }
}
