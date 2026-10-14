/** "orbori" wordmark; the i's dot is three overlapping gold orbs. */
export function Logo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="orbori"
      className={`inline-block font-display font-extrabold leading-none tracking-[-0.03em] text-starlight ${className}`}
      style={{ fontSize: size }}
    >
      orbor
      <span className="relative inline-block">
        ı
        <Orbs className="absolute left-1/2 -translate-x-1/2" style={{ top: '0.02em', width: '0.42em', height: '0.26em' }} />
      </span>
    </span>
  );
}

export function Orbs({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 26 16" aria-hidden="true" className={className} style={{ overflow: 'visible', ...style }}>
      <circle cx="7" cy="9" r="5.5" fill="#A2752C" />
      <circle cx="13" cy="6" r="5.5" fill="#D4A24C" fillOpacity="0.9" />
      <circle cx="19" cy="9" r="5.5" fill="#A2752C" fillOpacity="0.85" />
    </svg>
  );
}
