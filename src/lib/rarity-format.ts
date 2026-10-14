/** Client-safe rarity formatting (no data import). Numbers are deliberately rounded: they are estimates. */

/** 9,434 → "9,000"; 14,200 → "14,000"; 940 → "900". */
export const formatOneIn = (n: number) => {
  const digits = Math.floor(Math.log10(n));
  const sig = String(n)[0] === '1' ? 2 : 1;
  const mag = 10 ** Math.max(0, digits - sig + 1);
  return (Math.round(n / mag) * mag).toLocaleString('en-US');
};

/** 0.0731 → "7%"; 0.006 → "0.6%"; 0.0004 → "under 0.1%". */
export const formatPct = (p: number) => {
  const x = p * 100;
  if (x < 0.1) return 'under 0.1%';
  if (x < 1) return `${x.toFixed(1)}%`;
  return `${Math.round(x)}%`;
};

/** The two lines shown wherever rarity appears, honest for every tier. */
export function rarityLines(r: { pct: number; oneIn: number }) {
  const exact = `About 1 in ${formatOneIn(r.oneIn)} people share your exact Sun, Moon, animal and Life Path.`;
  if (r.pct <= 0.5) return { main: `Only ${formatPct(r.pct)} of people have a chart this rare.`, sub: exact };
  return { main: 'A classic combo. The cosmos ordered extra.', sub: exact };
}

export const rarityFootnote = (population: string) =>
  `Estimate across every birth day ${population} (today's 18–65 year-olds), assuming births are spread evenly.`;
