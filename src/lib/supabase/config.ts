export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
/** Accounts switch on once the two public Supabase keys are set in Vercel. Until then the app works on-device only. */
export const accountsEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === '1';
