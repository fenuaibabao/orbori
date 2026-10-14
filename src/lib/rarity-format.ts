/** Client-safe rarity formatting (no data import). */
export const formatShare = (share: number) => `${parseFloat((share * 100).toPrecision(2))}%`;

/** 12345 → "12,000" (two significant digits, grouped). */
export const formatOneIn = (n: number) => {
  const mag = 10 ** Math.max(0, Math.floor(Math.log10(n)) - 1);
  return (Math.round(n / mag) * mag).toLocaleString('en-US');
};
