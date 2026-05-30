import type { TrialGameMode } from "../menu/TrialGameMenuController";
import type { TrialInventoryItemId } from "../shop/TrialInventoryModel";
import type { TrialWeaponRuntimeSaveData } from "../combat/TrialWeaponRuntime";

export interface TrialCheckpointData {
  readonly username: string;
  readonly mode: TrialGameMode;
  readonly completedWave: number;
  readonly coinTotal: number;
  readonly playerHealthHalfHearts: number;
  readonly generatorHealthHalfHearts: number;
  readonly inventory: Partial<Record<TrialInventoryItemId, number>>;
  readonly weapons: {
    readonly activeWeaponId: string;
    readonly weapons: Record<string, TrialWeaponRuntimeSaveData>;
  };
  readonly savedAtIso: string;
}

export interface TrialScoreEntry {
  readonly username: string;
  readonly mode: Extract<TrialGameMode, "waves" | "apocalypse">;
  readonly score: number;
  readonly label: string;
  readonly createdAtIso: string;
}

export interface TrialAuthResult {
  readonly success: boolean;
  readonly message: string;
}

export interface TrialPersistencePort {
  getUsername(): string;
  register(username: string, pin: string): TrialAuthResult;
  signIn(username: string, pin: string): TrialAuthResult;
  loadCheckpoint(username: string): TrialCheckpointData | null;
  saveCheckpoint(checkpoint: TrialCheckpointData): void;
  addScore(entry: TrialScoreEntry): void;
  getScores(mode: TrialScoreEntry["mode"], limit: number): readonly TrialScoreEntry[];
}
