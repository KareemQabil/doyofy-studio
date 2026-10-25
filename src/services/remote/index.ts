/**
 * Opt-in Supabase adapter. NOT used by the app: src/services/index.ts still builds the browser mock.
 * See backend/README.md for how to switch, and tests/unit/remote.test.ts for the mocked contract tests.
 */
export { createRemoteServices, type RemoteServices } from './remoteServices';
export { remoteConfigFromEnv, validateRemoteConfig, type RemoteConfig, type RemoteEnv } from './config';
export { createSupabaseAuth, type AuthSession, type SupabaseAuth } from './supabaseAuth';
export { RemoteAppError } from './remoteErrors';
