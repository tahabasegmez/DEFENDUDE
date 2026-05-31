import type { TrialAuthResult, TrialCheckpointData, TrialPersistencePort, TrialScoreEntry } from "./TrialPersistenceTypes";

const usernameKey = "defendude.trial.username";
const usersKey = "defendude.trial.users";
const checkpointPrefix = "defendude.trial.checkpoint.";
const scoreboardKey = "defendude.trial.scoreboard";

export class TrialLocalStoragePersistence implements TrialPersistencePort {
  getUsername(): string {
    return this.normalizeUsername(localStorage.getItem(usernameKey) ?? "guest");
  }

  async register(username: string, pin: string): Promise<TrialAuthResult> {
    const normalized = this.normalizeUsername(username);
    if (!this.isValidPin(pin)) {
      return { success: false, message: "PIN must be 6 digits." };
    }

    const users = this.getUsers();
    if (users[normalized]) {
      return { success: false, message: "This player name is already taken." };
    }

    users[normalized] = pin;
    this.saveUsers(users);
    localStorage.setItem(usernameKey, normalized);
    return { success: true, message: `Registered as ${normalized}.` };
  }

  async signIn(username: string, pin: string): Promise<TrialAuthResult> {
    const normalized = this.normalizeUsername(username);
    const users = this.getUsers();
    if (!users[normalized] || users[normalized] !== pin) {
      return { success: false, message: "Player name or PIN is wrong." };
    }

    localStorage.setItem(usernameKey, normalized);
    return { success: true, message: `Signed in as ${normalized}.` };
  }

  async loadCheckpoint(username: string): Promise<TrialCheckpointData | null> {
    const raw = localStorage.getItem(this.getCheckpointKey(username));
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as TrialCheckpointData;
    }
    catch {
      return null;
    }
  }

  async saveCheckpoint(checkpoint: TrialCheckpointData): Promise<void> {
    localStorage.setItem(this.getCheckpointKey(checkpoint.username), JSON.stringify(checkpoint));
  }

  async addScore(entry: TrialScoreEntry): Promise<void> {
    const scores = this.mergeBestScores([...this.getAllScores(), entry])
      .sort((left, right) => right.score - left.score)
      .slice(0, 300);
    localStorage.setItem(scoreboardKey, JSON.stringify(scores));
  }

  async getScores(mode: TrialScoreEntry["mode"], limit: number): Promise<readonly TrialScoreEntry[]> {
    const scores = this.mergeBestScores(this.getAllScores());
    localStorage.setItem(scoreboardKey, JSON.stringify(scores));
    return scores
      .filter((score) => score.mode === mode)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }

  private getAllScores(): readonly TrialScoreEntry[] {
    const raw = localStorage.getItem(scoreboardKey);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as TrialScoreEntry[];
    }
    catch {
      return [];
    }
  }

  private getCheckpointKey(username: string): string {
    return `${checkpointPrefix}${this.normalizeUsername(username)}`;
  }

  private normalizeUsername(username: string): string {
    const normalized = username.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
    return normalized.length > 0 ? normalized : "guest";
  }

  private isValidPin(pin: string): boolean {
    return /^\d{6}$/.test(pin);
  }

  private getUsers(): Record<string, string> {
    const raw = localStorage.getItem(usersKey);
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Record<string, string>;
    }
    catch {
      return {};
    }
  }

  private saveUsers(users: Record<string, string>): void {
    localStorage.setItem(usersKey, JSON.stringify(users));
  }

  private mergeBestScores(scores: readonly TrialScoreEntry[]): TrialScoreEntry[] {
    const bestByPlayerAndMode = new Map<string, TrialScoreEntry>();
    for (const score of scores) {
      const key = `${this.normalizeUsername(score.username)}:${score.mode}`;
      const current = bestByPlayerAndMode.get(key);
      if (!current || score.score > current.score || (score.score === current.score && score.createdAtIso < current.createdAtIso)) {
        bestByPlayerAndMode.set(key, {
          ...score,
          username: this.normalizeUsername(score.username)
        });
      }
    }

    return [...bestByPlayerAndMode.values()];
  }
}
