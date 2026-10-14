type P = { size?: number; className?: string };
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });

export const SunIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const ChartIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v5M12 16v5M3 12h5M16 12h5" /></svg>
);
export const CosmosIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="5" /><ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(-20 12 12)" /></svg>
);
export const VisionsIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 16l5-5 4 4 3-3 6 6" /><path d="M16 7.5v2M15 8.5h2" /></svg>
);
export const ProfileIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const ShareIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" /></svg>
);
export const BackIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg>
);
export const CheckIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}><path d="M5 12l5 5L19 7" /></svg>
);
export const ChevronIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
);
export const SearchIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
export const FlameIcon = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="13" r="8" stroke="#343E9F" strokeWidth="1.4" />
    <path d="M12 4c1 3 4.5 4.5 4.5 9a4.5 4.5 0 01-9 0c0-2.2 1.2-3.4 2.2-4.4 0 2 1 3 2.3 3.2 0-3-1-5.3 0-7.8z" fill="#A2752C" stroke="#D4A24C" strokeWidth="1" />
  </svg>
);
export const BadgeGlyph = ({ d, size = 26 }: { d: string; size?: number }) => (
  <svg {...base(size)} strokeWidth={1.6}><path d={d} /></svg>
);
