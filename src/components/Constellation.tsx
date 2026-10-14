import { Sigil } from './Sigil';

export interface Star { id: string; label: string; seed: number; score?: number }

/** You in the center, matches orbiting, open slots up to 5. */
export function Constellation({ me, stars, onAdd, onPick, selected }: {
  me: number;
  stars: Star[];
  onAdd: () => void;
  onPick: (id: string) => void;
  selected: string | null;
}) {
  const W = 320, H = 290, cx = W / 2, cy = H / 2, R = 118;
  const slots = Math.max(5, stars.length + 1);
  const pos = (i: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / slots + 0.35;
    return { x: cx + R * Math.cos(a), y: cy + R * 0.92 * Math.sin(a) };
  };
  const label = `Constellation: you in the center with ${stars.length} ${stars.length === 1 ? 'match' : 'matches'}`;
  return (
    <div className="relative mx-auto" style={{ width: W, height: H }} role="group" aria-label={label}>
      <svg width={W} height={H} className="absolute inset-0" aria-hidden="true">
        <ellipse cx={cx} cy={cy} rx={R * 0.6} ry={R * 0.55} fill="none" stroke="#2A2670" />
        <ellipse cx={cx} cy={cy} rx={R} ry={R * 0.92} fill="none" stroke="#1E1A5C" />
        {Array.from({ length: slots }, (_, i) => {
          const p = pos(i);
          const filled = i < stars.length;
          return (
            <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
              stroke={filled ? '#D4A24C' : '#343E9F'} strokeWidth={filled ? 1.4 : 1} strokeDasharray={filled ? undefined : '3 5'} />
          );
        })}
      </svg>
      <div className="absolute flex flex-col items-center" style={{ left: cx - 32, top: cy - 32 }}>
        <Sigil seed={me} size={64} />
        <span className="mt-1 text-[11px] font-semibold">You</span>
      </div>
      {Array.from({ length: slots }, (_, i) => {
        const p = pos(i);
        const s = stars[i];
        if (s) {
          return (
            <button key={s.id} type="button" onClick={() => onPick(s.id)} aria-pressed={selected === s.id}
              className="absolute flex w-[76px] flex-col items-center gap-0.5" style={{ left: p.x - 38, top: p.y - 24 }}>
              <span className={`rounded-full ${selected === s.id ? 'ring-2 ring-gold-lite ring-offset-2 ring-offset-night' : ''}`}><Sigil seed={s.seed} size={44} /></span>
              <span className="max-w-[76px] truncate text-[11px] font-semibold">{s.label}</span>
              {s.score !== undefined && <span className="font-mono text-[11px] text-gold-lite">{s.score.toFixed(1)}</span>}
            </button>
          );
        }
        return (
          <button key={`open-${i}`} type="button" onClick={onAdd} aria-label="Add a match"
            className="absolute flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-dashed border-royal bg-space text-xl text-dim hover:border-gold-lite hover:text-gold-lite"
            style={{ left: p.x - 20, top: p.y - 20 }}>
            +
          </button>
        );
      })}
    </div>
  );
}
