/**
 * Resources: who Orbori learned from, and where to go deeper, for each tradition.
 * Living traditions lead with voices from inside the tradition.
 */
export interface Resource { title: string; by: string; href: string }
export interface TraditionResources { id: string; name: string; learnedFrom?: Resource[]; inside?: Resource[]; deeper?: Resource[] }

export const RESOURCES: TraditionResources[] = [
  {
    id: 'mayan', name: "Mayan calendar (Chol Q'ij)",
    learnedFrom: [{ title: 'Mark Elmy · The Four Pillars', by: "Day-keeper trained by K'iche' elders. Orbori's daily count matches his published calendar.", href: 'https://thefourpillars.net/' }],
    inside: [
      { title: 'Tat Erick Gonzalez · Earth Peoples United', by: "Kaqchikel Maya daykeeper and Aj Q'ij from Guatemala · ceremonies, teachings and the School of Earth Wisdom", href: 'https://www.earthpeoplesunited.org/' },
      { title: 'The Book of Destiny', by: "Carlos Barrios, Maya Ajq'ij (spiritual guide) from Guatemala · the nawales and the count", href: 'https://riponbookstore.com/products/the-book-of-destiny-unlocking-the-secrets-of-the-ancient-mayans-and-the-prophecy-of-2012-9780061833830' },
      { title: "Saq' B'e", by: 'The Maya spiritual-studies circle Carlos Barrios helped found, carrying on his teaching', href: 'https://sacredroad.org/' },
    ],
  },
  {
    id: 'hawaiian', name: 'Hawaiian moon calendar',
    inside: [
      { title: 'Kaulana Mahina', by: 'Haunani Miyasato, Hilo · moon calendars and books in ʻōlelo Hawaiʻi', href: 'https://kaulanamahina.com' },
      { title: 'Ke Ala o ka Mahina', by: 'Kamehameha Publishing · Hawaiian moon calendar', href: 'https://beta.kamehamehapublishing.org/mooncalendar/' },
    ],
  },
  {
    id: 'chinese', name: 'Chinese zodiac',
    deeper: [
      { title: 'Purple Heaven', by: 'An app that goes far deeper into Chinese astrology than Orbori', href: 'https://purpleheaven.app' },
      { title: 'BaZi: The Destiny Code', by: "Joey Yap, Malaysian Chinese BaZi master · a beginner's guide to the Four Pillars", href: 'https://www.goodreads.com/book/show/2664161' },
    ],
  },
  {
    id: 'vedic', name: 'Vedic (Indian) astrology',
    inside: [
      { title: 'How to Judge a Horoscope', by: 'B. V. Raman, Bangalore · a classic of Indian astrology, from Motilal Banarsidass', href: 'https://www.mlbd.com/products/how-to-judge-a-horoscope-vol-1-b-v-raman-hb-mlbd-publications' },
      { title: 'The Nakshatras: The Stars Beyond the Zodiac', by: "Komilla Sutton, raised in Delhi · the 27 lunar stars, including your Moon's", href: 'https://www.goodreads.com/book/show/24700503' },
    ],
  },
  {
    id: 'islamic', name: 'Arabic lunar mansions',
    inside: [
      { title: 'The Book of Instruction in the Elements of the Art of Astrology', by: 'al-Bīrūnī, 1029 · the classic Islamic-era guide, with the 28 manāzil', href: 'https://catalog.hathitrust.org/Record/009239555' },
      { title: 'The Qatari Almanac', by: 'Sheikh Abdullah al-Ansari · a living Gulf star calendar that still tracks the lunar stations', href: 'https://en.wikipedia.org/wiki/Qatari_Almanac' },
    ],
  },
  {
    id: 'western', name: 'Western astrology',
    deeper: [
      { title: 'The Astrology Podcast', by: 'Chris Brennan · free episodes, plus his list of the best beginner books', href: 'https://theastrologypodcast.com/2021/11/15/top-8-best-astrology-books-for-beginners' },
      { title: 'Hellenistic Astrology', by: 'Chris Brennan · where Western astrology comes from', href: 'https://riponbookstore.com/products/hellenistic-astrology-the-study-of-fate-and-fortune-9780998588902' },
    ],
  },
  {
    id: 'numerology', name: 'Numerology',
    deeper: [{ title: 'The Complete Book of Numerology', by: 'Joyce & Jack Keller · history, systems and life path numbers', href: 'https://us.macmillan.com/books/9781250102553' }],
  },
];
