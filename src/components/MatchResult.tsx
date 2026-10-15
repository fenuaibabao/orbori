import type { Compatibility } from '@/lib/compat';
import { Sigil } from './Sigil';
import { Tag } from './ui';

/** Score card + system-by-system rows. `side` decides whose half is open. */
export function MatchResult({ compat, me, them, theirHalfLocked, children }: {
  compat: Compatibility;
  me: { label: string; seed: number };
  them: { label: string; seed: number };
  theirHalfLocked: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Match score" className="relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl border border-gold bg-night p-[22px] text-center">
        <div className="flex items-center">
          <Sigil seed={me.seed} size={56} label={`${me.label} sigil`} />
          <span className="-ml-3"><Sigil seed={them.seed} size={56} label={`${them.label} sigil`} /></span>
        </div>
        <p className="text-sm text-muted">{me.label} + {them.label}</p>
        <p className="font-mono font-bold leading-none text-gold-lite"><span className="text-[64px]">{compat.score.toFixed(1)}</span><span className="text-lg text-dim"> /10</span></p>
        <p className="font-display text-[19px] font-bold">{compat.headline}</p>
        <p className="text-[13px] text-muted">{compat.agreeCount} of {compat.systems.length} systems approve · <span className="text-starlight">orbori</span> · Where the stars agree.</p>
        <div className="grid w-full grid-cols-2 gap-2 text-left">
          <div className="rounded-[14px] border border-gold bg-deep p-3">
            <p className="font-mono text-[10px] tracking-[0.06em] text-gold-lite">YOUR SIDE</p>
            <p className="mt-1 text-[13px] leading-snug">{compat.sides.a}</p>
          </div>
          {theirHalfLocked ? (
            <div className="flex flex-col gap-1.5 rounded-[14px] border border-dashed border-mauve bg-deep p-3">
              <p className="font-mono text-[10px] tracking-[0.06em] text-mauve-lite">{them.label.toUpperCase()}&apos;S SIDE</p>
              <div aria-hidden="true" className="flex flex-col gap-1.5"><span className="h-[7px] w-[90%] rounded bg-[#2A2670]" /><span className="h-[7px] w-[70%] rounded bg-[#2A2670]" /></div>
              <p className="text-[11px] text-muted">Unlocks for them when they open your invite</p>
            </div>
          ) : (
            <div className="rounded-[14px] border border-mauve bg-deep p-3">
              <p className="font-mono text-[10px] tracking-[0.06em] text-mauve-lite">{them.label.toUpperCase()}&apos;S SIDE</p>
              <p className="mt-1 text-[13px] leading-snug">{compat.sides.b}</p>
            </div>
          )}
        </div>
        {children}
      </section>

      <section aria-labelledby="bysys" className="flex flex-col gap-2.5">
        <h2 id="bysys" className="font-display text-[19px] font-bold">System by system</h2>
        {compat.systems.map((s) => (
          <div key={s.system} className="flex flex-col gap-2 rounded-2xl bg-night p-3.5">
            <div className="flex items-center justify-between"><Tag>{s.label}</Tag><span className="font-mono text-[15px] font-bold text-gold-lite">{s.display}</span></div>
            <div aria-hidden="true" className="h-1.5 overflow-hidden rounded bg-line"><div className="h-full bg-gold" style={{ width: `${s.score * 10}%` }} /></div>
            <p className="text-sm leading-snug"><strong className="font-semibold">{s.head}</strong> <span className="text-muted">{s.body}</span></p>
          </div>
        ))}
      </section>
    </div>
  );
}
