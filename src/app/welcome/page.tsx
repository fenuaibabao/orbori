import { Logo } from '@/components/Logo';
import { LinkButton, Screen } from '@/components/ui';
import { accountsEnabled } from '@/lib/supabase/config';

export default function Welcome() {
  return (
    <Screen className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[18%] h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-line" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[26%] h-[380px] w-[380px] -translate-x-1/2 rounded-full border border-[#2A2670]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[34%] h-[240px] w-[240px] -translate-x-1/2 rounded-full border border-royal bg-night" />

      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Logo size={64} />
        <p className="font-display text-xl font-semibold">Where the stars agree.</p>
        <p className="font-mono text-xs tracking-[0.12em] text-gold-lite">CONVENE YOUR COSMIC COUNCIL</p>
        <p className="max-w-[270px] text-[15px] leading-relaxed text-muted">
          Western, Vedic, Chinese, Numerology, Mayan, Hawaiian and Islamic, seven traditions in one room, finally talking to each other.
        </p>
      </div>

      <div className="relative flex flex-col gap-3">
        <LinkButton href="/onboarding/birth">Map my cosmos</LinkButton>
        {accountsEnabled && <LinkButton href="/signin" variant="ghost">I already have an account</LinkButton>}
        <p className="mt-1.5 text-center text-xs text-dim">18+ only. Entertainment, not destiny.</p>
      </div>
    </Screen>
  );
}
