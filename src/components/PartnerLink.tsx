/** A plain outbound recommendation. No birth details are passed to the other site. */
export function PartnerLink({ href, eyebrow, title, body }: { href: string; eyebrow: string; title: string; body: string }) {
  const url = new URL(href);
  url.searchParams.set('ref', 'orbori');
  return (
    <a href={url.toString()} target="_blank" rel="noopener"
      className="flex items-center gap-4 rounded-[22px] border border-mauve bg-night p-[18px] hover:border-mauve-lite">
      <span className="flex-1">
        <span className="block font-mono text-[11px] tracking-[0.08em] text-mauve-lite">{eyebrow}</span>
        <span className="mt-1 block font-display text-[17px] font-bold">{title}</span>
        <span className="mt-1 block text-sm leading-snug text-muted">{body}</span>
      </span>
      <span aria-hidden="true" className="text-xl text-mauve-lite">↗</span>
    </a>
  );
}
