'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { ready, state } = useStore();
  useEffect(() => {
    if (ready) router.replace(state.profile ? '/today' : '/welcome');
  }, [ready, state.profile, router]);
  return <div className="min-h-dvh" />;
}
