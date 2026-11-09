/**
 * The storage backend in use. Today: local, device-only storage (development layer).
 * Swap these two lines for backend implementations to add real accounts and sync.
 */
import { LocalAuthAdapter, LocalProgressRepository } from './local';
import type { AuthAdapter, ProgressRepository } from './repository';

export const auth: AuthAdapter = new LocalAuthAdapter();
export const progressRepository: ProgressRepository = new LocalProgressRepository();

export type { AuthAdapter, Profile, ProgressRepository } from './repository';
