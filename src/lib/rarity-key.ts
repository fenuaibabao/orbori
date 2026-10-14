/** Compact key for a Sun sign index, Moon sign index, Chinese animal and Life Path. */
export const rarityKey = (sun: number, moon: number, animal: string, lifePath: number) =>
  `${sun}.${moon}.${animal}.${lifePath}`;
