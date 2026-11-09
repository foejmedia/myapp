/**
 * Persistence seams. The app talks only to these interfaces, so a real backend
 * (a database behind API routes, Supabase, Firebase…) can replace the local
 * implementations in ./local.ts without touching any component.
 */
import type { UserData } from './model';

export type Profile = { id: string; name: string; createdAt: string };

/** Where a profile's learning progress lives. */
export interface ProgressRepository {
  load(profileId: string): Promise<UserData | null>;
  save(profileId: string, data: UserData): Promise<void>;
  remove(profileId: string): Promise<void>;
  /** Called when the data changes elsewhere (another tab, another device). Returns an unsubscribe. */
  subscribe(profileId: string, onChange: (data: UserData) => void): () => void;
}

/** Who is learning. */
export interface AuthAdapter {
  /** A short description shown to users, e.g. "Saved on this device". */
  readonly kind: string;
  listProfiles(): Promise<Profile[]>;
  currentProfile(): Promise<Profile | null>;
  signIn(profileId: string): Promise<Profile>;
  signUp(name: string): Promise<Profile>;
  signOut(): Promise<void>;
  rename(profileId: string, name: string): Promise<Profile>;
  deleteProfile(profileId: string): Promise<void>;
}
