import { trialDifficultyTuning } from "../tuning/TrialGameplayTuning";

export type TrialDifficultyId = keyof typeof trialDifficultyTuning.difficulties;

export interface TrialDifficultySettings {
  readonly id: TrialDifficultyId;
  readonly friendlyProjectileDamagesStructures: boolean;
  readonly zombieSpawnRateMultiplier: number;
  readonly zombieHealthMultiplier: number;
  readonly zombieDamageMultiplier: number;
}

export function getActiveTrialDifficulty(): TrialDifficultySettings {
  const id = trialDifficultyTuning.activeDifficulty as TrialDifficultyId;
  return {
    id,
    ...trialDifficultyTuning.difficulties[id]
  };
}
