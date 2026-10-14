/** Anonymous handles and sigil seeds. */
const ADJ = [
  'Velvet', 'Midnight', 'Static', 'Copper', 'Lunar', 'Silent', 'Golden', 'Feral', 'Neon', 'Hollow', 'Crimson', 'Quiet',
  'Electric', 'Gilded', 'Wild', 'Distant', 'Molten', 'Indigo', 'Secret', 'Ember', 'Frosted', 'Restless', 'Sly', 'Opal',
];
const NOUN = [
  'Comet', 'Oracle', 'Lotus', 'Nebula', 'Fox', 'Moth', 'Tide', 'Siren', 'Orbit', 'Sphinx', 'Raven', 'Halo',
  'Quasar', 'Vesper', 'Jackal', 'Prism', 'Eclipse', 'Wren', 'Atlas', 'Mirage', 'Cipher', 'Lynx', 'Saint', 'Pulsar',
];

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function handleFromSeed(seed: number): string {
  return `${ADJ[seed % ADJ.length]} ${NOUN[Math.floor(seed / ADJ.length) % NOUN.length]}`;
}
