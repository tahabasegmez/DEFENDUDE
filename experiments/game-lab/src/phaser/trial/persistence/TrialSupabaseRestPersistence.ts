import type { TrialAuthResult, TrialCheckpointData, TrialPersistencePort, TrialScoreEntry } from "./TrialPersistenceTypes";

const usernameKey = "defendude.trial.username";

interface SupabaseRpcResponse {
  readonly success?: boolean;
  readonly message?: string;
}

interface SupabaseCheckpointRow {
  readonly data: TrialCheckpointData;
}

interface SupabaseScoreRow {
  readonly username: string;
  readonly mode: TrialScoreEntry["mode"];
  readonly score: number;
  readonly label: string;
  readonly created_at: string;
}

export class TrialSupabaseRestPersistence implements TrialPersistencePort {
  private readonly baseUrl: string;
  private readonly publishableKey: string;

  constructor(baseUrl: string, publishableKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.publishableKey = publishableKey;
  }

  getUsername(): string {
    return this.normalizeUsername(localStorage.getItem(usernameKey) ?? "guest");
  }

  async register(username: string, pin: string): Promise<TrialAuthResult> {
    const normalized = this.normalizeUsername(username);
    if (!this.isValidPin(pin)) {
      return { success: false, message: "PIN must be 6 digits." };
    }

    const result = await this.rpc<SupabaseRpcResponse>("trial_register", {
      p_username: normalized,
      p_pin: pin
    });
    if (result.success) {
      localStorage.setItem(usernameKey, normalized);
    }
    return {
      success: Boolean(result.success),
      message: result.message ?? (result.success ? `Registered as ${normalized}.` : "Register failed.")
    };
  }

  async signIn(username: string, pin: string): Promise<TrialAuthResult> {
    const normalized = this.normalizeUsername(username);
    if (!this.isValidPin(pin)) {
      return { success: false, message: "PIN must be 6 digits." };
    }

    const result = await this.rpc<SupabaseRpcResponse>("trial_sign_in", {
      p_username: normalized,
      p_pin: pin
    });
    if (result.success) {
      localStorage.setItem(usernameKey, normalized);
    }
    return {
      success: Boolean(result.success),
      message: result.message ?? (result.success ? `Signed in as ${normalized}.` : "Player name or PIN is wrong.")
    };
  }

  async loadCheckpoint(username: string): Promise<TrialCheckpointData | null> {
    const normalized = this.normalizeUsername(username);
    const rows = await this.rest<SupabaseCheckpointRow[]>(
      `/rest/v1/trial_checkpoints?username=eq.${encodeURIComponent(normalized)}&select=data&limit=1`
    );
    return rows[0]?.data ?? null;
  }

  async saveCheckpoint(checkpoint: TrialCheckpointData): Promise<void> {
    await this.rest("/rest/v1/trial_checkpoints?on_conflict=username", {
      method: "POST",
      headers: {
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        username: this.normalizeUsername(checkpoint.username),
        data: checkpoint,
        updated_at: new Date().toISOString()
      })
    });
  }

  async addScore(entry: TrialScoreEntry): Promise<void> {
    const normalizedUsername = this.normalizeUsername(entry.username);
    const existingRows = await this.rest<SupabaseScoreRow[]>(
      `/rest/v1/trial_scores?username=eq.${encodeURIComponent(normalizedUsername)}&mode=eq.${entry.mode}&select=username,mode,score,label,created_at&order=score.desc,created_at.asc&limit=1`
    );
    const bestExistingScore = existingRows[0]?.score ?? -1;
    if (bestExistingScore >= entry.score) {
      return;
    }

    await this.rest("/rest/v1/trial_scores", {
      method: "POST",
      body: JSON.stringify({
        username: normalizedUsername,
        mode: entry.mode,
        score: entry.score,
        label: entry.label,
        created_at: entry.createdAtIso
      })
    });
  }

  async getScores(mode: TrialScoreEntry["mode"], limit: number): Promise<readonly TrialScoreEntry[]> {
    const rows = await this.rest<SupabaseScoreRow[]>(
      `/rest/v1/trial_scores?mode=eq.${mode}&select=username,mode,score,label,created_at&order=score.desc,created_at.asc&limit=${Math.max(limit * 5, 100)}`
    );
    return this.mergeBestScores(rows.map((row) => ({
      username: row.username,
      mode: row.mode,
      score: row.score,
      label: row.label,
      createdAtIso: row.created_at
    }))).slice(0, limit);
  }

  private async rpc<T>(name: string, payload: Record<string, unknown>): Promise<T> {
    return this.rest<T>(`/rest/v1/rpc/${name}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  private async rest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "apikey": this.publishableKey,
        "Authorization": `Bearer ${this.publishableKey}`,
        "Content-Type": "application/json",
        ...(options.headers ?? {})
      }
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Supabase request failed (${response.status}): ${message}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json() as T;
  }

  private normalizeUsername(username: string): string {
    const normalized = username.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
    return normalized.length > 0 ? normalized : "guest";
  }

  private isValidPin(pin: string): boolean {
    return /^\d{6}$/.test(pin);
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

    return [...bestByPlayerAndMode.values()].sort((left, right) => right.score - left.score || left.createdAtIso.localeCompare(right.createdAtIso));
  }
}
