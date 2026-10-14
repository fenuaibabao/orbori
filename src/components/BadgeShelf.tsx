import type { Badge } from '@/lib/progress';
import { BadgeGlyph } from './icons';

export function BadgeItem({ b, size = 64, showHow = false }: { b: Badge; size?: number; showHow?: boolean }) {
  return (
    <div className="flex w-[84px] shrink-0 flex-col items-center gap-1.5 text-center">
      <div
        className={`flex items-center justify-center rounded-full ${b.earned ? 'border-[1.5px] border-gold-lite bg-[#221B45] text-gold-lite' : 'border-[1.5px] border-dashed border-[#3A3672] text-[#5E5A92]'}`}
        style={{ width: size, height: size }}
      >
        <BadgeGlyph d={b.icon} size={size * 0.44} />
      </div>
      <span className={`text-xs font-semibold leading-tight ${b.earned ? '' : 'text-dim'}`}>{b.name}</span>
      <span className="font-mono text-[10px] text-dim">{showHow && !b.earned ? `${b.how} · ${b.status}` : b.status}</span>
    </div>
  );
}

export function BadgeShelf({ badges }: { badges: Badge[] }) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 py-1 lg:mx-0 lg:flex-wrap lg:px-0">
      {badges.map((b) => <BadgeItem key={b.id} b={b} />)}
    </div>
  );
}
