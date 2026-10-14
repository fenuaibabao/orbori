import { Eyebrow } from './ui';

export function ComingSoon({ title, blurb, bullets }: { title: string; blurb: string; bullets: string[] }) {
  return (
    <div className="flex flex-col gap-5 lg:max-w-2xl">
      <h1 className="font-display text-[26px] font-bold">{title}</h1>
      <section className="flex flex-col gap-3 rounded-[22px] border border-gold bg-night p-5">
        <Eyebrow>COMING SOON</Eyebrow>
        <p className="text-[15px] leading-relaxed">{blurb}</p>
        <ul className="flex flex-col gap-2 text-sm text-muted">
          {bullets.map((b) => <li key={b} className="flex gap-2"><span className="text-gold-lite">✦</span>{b}</li>)}
        </ul>
      </section>
    </div>
  );
}
