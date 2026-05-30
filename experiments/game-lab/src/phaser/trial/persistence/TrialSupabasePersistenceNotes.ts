/*
Supabase integration point for the trial lab.

The game currently uses TrialLocalStoragePersistence so the lab works without
network keys. When the backend is ready, implement TrialPersistencePort here
with Supabase REST or @supabase/supabase-js and keep scene/menu code unchanged.

Suggested tables:
- trial_users(username text primary key, pin_hash text not null, created_at timestamptz default now())
- trial_checkpoints(username text primary key references trial_users(username), data jsonb not null, updated_at timestamptz default now())
- trial_scores(id bigint generated always as identity primary key, username text references trial_users(username), mode text check (mode in ('waves', 'apocalypse')), score int, label text, created_at timestamptz default now())

For production, do not store the plain 6 digit PIN. Use a small API endpoint,
Supabase Edge Function, or Postgres crypt extension to hash/verify it.
*/
export {};
