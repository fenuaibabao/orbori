'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useSync } from '@/lib/sync-provider';

export default function Home() {
  const router = useRouter();
  const store = useStore();
  const { ready: synced } = useSync();
  const ready = store.ready && synced;
  const { state } = store;
  useEffect(() => {
    if (ready) router.replace(state.profile ? '/today' : '/welcome');
  }, [ready, state.profile, router]);
  return <div className="min-h-dvh" />;
}
