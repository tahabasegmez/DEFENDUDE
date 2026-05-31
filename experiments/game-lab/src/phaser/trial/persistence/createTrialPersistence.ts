import { TrialLocalStoragePersistence } from "./TrialLocalStoragePersistence";
import type { TrialPersistencePort } from "./TrialPersistenceTypes";
import { TrialSupabaseRestPersistence } from "./TrialSupabaseRestPersistence";

export function createTrialPersistence(): TrialPersistencePort {
  const mode = import.meta.env.VITE_TRIAL_PERSISTENCE_MODE ?? "local";
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (mode === "supabase" && typeof supabaseUrl === "string" && supabaseUrl.length > 0 && typeof publishableKey === "string" && publishableKey.length > 0) {
    return new TrialSupabaseRestPersistence(supabaseUrl, publishableKey);
  }

  if (mode === "supabase") {
    console.warn("Supabase persistence mode is enabled, but Supabase env values are missing. Falling back to localStorage.");
  }

  return new TrialLocalStoragePersistence();
}
