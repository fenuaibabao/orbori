'use client';
import type { User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase/client';
import { accountsEnabled } from './supabase/config';

export interface Auth {
  /** false until the first session check finishes */
  ready: boolean;
  user: User | null;
  enabled: boolean;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  /** Sign in with the code from the email (works inside the Home Screen app, where the link opens Safari instead). */
  verifyEmailCode: (email: string, code: string) => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  /** Sign in with Apple is switched on once it's set up with Apple. */
  appleEnabled: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

const siteUrl = () => (typeof window !== 'undefined' ? window.location.origin : '');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!accountsEnabled);

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => { setUser(data.user ?? null); setReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    const sb = supabase();
    if (!sb) return { error: 'Accounts are not set up yet.' };
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${siteUrl()}/auth/callback` } });
    return { error: error ? friendly(error.message) : null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const sb = supabase();
    if (!sb) return { error: 'Accounts are not set up yet.' };
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${siteUrl()}/auth/callback` } });
    return { error: error ? friendly(error.message) : null };
  }, []);

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    const sb = supabase();
    if (!sb) return { error: 'Accounts are not set up yet.' };
    const { error } = await sb.auth.verifyOtp({ email, token: code.replace(/\D/g, ''), type: 'email' });
    return { error: error ? (/expired|invalid/i.test(error.message) ? 'That code didn\'t work. Check it, or request a new email.' : friendly(error.message)) : null };
  }, []);

  const signInWithApple = useCallback(async () => {
    const sb = supabase();
    if (!sb) return { error: 'Accounts are not set up yet.' };
    const { error } = await sb.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: `${siteUrl()}/auth/callback` } });
    return { error: error ? friendly(error.message) : null };
  }, []);

  const signOut = useCallback(async () => { await supabase()?.auth.signOut(); }, []);

  const value = useMemo<Auth>(() => ({ ready, user, enabled: accountsEnabled, signInWithEmail, signInWithGoogle, verifyEmailCode, signInWithApple, appleEnabled: process.env.NEXT_PUBLIC_APPLE_SIGNIN === '1', signOut }),
    [ready, user, signInWithEmail, signInWithGoogle, verifyEmailCode, signInWithApple, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const a = useContext(AuthContext);
  if (!a) throw new Error('useAuth must be used inside AuthProvider');
  return a;
}

function friendly(msg: string) {
  if (/rate limit|too many/i.test(msg)) return 'Too many sign-in emails just now. Try again in a little while.';
  if (/invalid.*email/i.test(msg)) return 'That email address looks off.';
  return msg;
}
