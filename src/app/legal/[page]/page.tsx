import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { LEGAL } from '@/lib/legal';

export function generateStaticParams() { return LEGAL.map((l) => ({ page: l.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const l = LEGAL.find((x) => x.slug === page);
  return { title: l ? `${l.title} · Orbori` : 'Orbori' };
}

export default async function Legal({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const l = LEGAL.find((x) => x.slug === page);
  if (!l) notFound();
  const updated = new Date(`${l.updated}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-6 pb-16 pt-[calc(env(safe-area-inset-top)+40px)]">
      <Link href="/" className="self-start"><Logo size={36} /></Link>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-[30px] font-bold leading-tight">{l.title}</h1>
        <p className="font-mono text-xs tracking-[0.08em] text-gold-lite">UPDATED {updated.toUpperCase()}</p>
        <p className="text-[15px] leading-relaxed text-muted">{l.intro}</p>
      </header>
      {l.sections.map((s) => (
        <section key={s.h} className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">{s.h}</h2>
          {s.p.map((p, i) => <p key={i} className="text-[15px] leading-relaxed text-muted">{p}</p>)}
        </section>
      ))}
      <nav className="flex flex-wrap gap-4 border-t border-line pt-6 text-sm text-dim">
        {LEGAL.filter((x) => x.slug !== l.slug).map((x) => <Link key={x.slug} href={`/legal/${x.slug}`} className="hover:text-starlight">{x.title}</Link>)}
        <Link href="/" className="hover:text-starlight">Back to Orbori</Link>
      </nav>
    </main>
  );
}
