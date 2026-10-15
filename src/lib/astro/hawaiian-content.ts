/**
 * The 30 nights in Orbori's words, following the guidance Hawaiian cultural
 * practitioners publish for planting, fishing and daily life. Each night carries a
 * Council verdict: speak, act, connect, build, slow or release.
 */
import type { Advice } from '../council/types';

export interface NightMeaning {
  /** What the night means, used for the birth night. */
  born: string;
  /** Guidance for the night itself, used for today. */
  today: string;
  advice: Advice;
  /** -1 … +1 */
  polarity: number;
}

export const NIGHT_MEANING: NightMeaning[] = [
  { born: 'Hilo, the first thread of light. You are a beginner at heart: quiet starts, fresh twists, the courage of the first sliver.', today: 'Hilo: the new moon\'s first sliver. Plant what you want to grow; begin quietly, without announcing it.', advice: 'build', polarity: 0.4 },
  { born: 'Hoaka, the crescent that casts the first shadow. You notice what others miss and sense the mood of a room before it speaks.', today: 'Hoaka: the crescent casts shadows and spirits are said to wander. Watch, listen, keep the fire small.', advice: 'slow', polarity: -0.1 },
  { born: 'Kūkahi, the first standing night. Upright, decisive, built to rise. You start things and stand behind them.', today: 'Kūkahi, the first Kū night: a rising night for things that grow upright. Act; set the first stake.', advice: 'act', polarity: 0.7 },
  { born: 'Kūlua, the second standing night. Steady strength that keeps rising after the first push.', today: 'Kūlua: the second Kū night. Momentum builds; keep planting, keep moving.', advice: 'act', polarity: 0.7 },
  { born: 'Kūkolu, the third standing night. Persistence is your gift; you finish what others only begin.', today: 'Kūkolu: the third Kū night. Good for sturdy work and honest effort; the sea gives freely.', advice: 'build', polarity: 0.6 },
  { born: 'Kūpau, the last standing night. You carry the full strength of a rising cycle, and know when a push is complete.', today: 'Kūpau: the last Kū night. Finish the rising work before the ʻOle nights ask you to pause.', advice: 'build', polarity: 0.5 },
  { born: 'ʻOlekūkahi, the first ʻOle night. "Nothing" nights make patient people: you know that rest is also work.', today: 'ʻOlekūkahi: the first ʻOle night. Nothing planted now takes root. Mend nets, rest hands, don\'t launch.', advice: 'slow', polarity: -0.5 },
  { born: 'ʻOlekūlua, the second ʻOle night. Reflective and inward; you restore before you rebuild.', today: 'ʻOlekūlua: an ʻOle night. Low tide for new ventures. Tidy, repair, reconsider.', advice: 'slow', polarity: -0.5 },
  { born: 'ʻOlekūkolu, the third ʻOle night. A deep thinker who waits for the right tide.', today: 'ʻOlekūkolu: an ʻOle night. Keep expectations small; the moon is gathering itself.', advice: 'slow', polarity: -0.4 },
  { born: 'ʻOlepau, the last ʻOle night. You know how to end a quiet spell and step back into the light.', today: 'ʻOlepau: the last ʻOle night. The pause is almost over; prepare, don\'t push.', advice: 'slow', polarity: -0.2 },
  { born: 'Huna, the hidden night. Mystery and modesty: your best work happens out of sight, like roots.', today: 'Huna: the hidden night, good for root crops and quiet, covered work. Build what no one sees yet.', advice: 'build', polarity: 0.5 },
  { born: 'Mohalu, the unfolding night, sacred to Kāne. Beauty and grace; you open like a flower and draw people in.', today: 'Mohalu: a night of unfolding, sacred to Kāne. Plant flowers, give thanks, connect with care.', advice: 'connect', polarity: 0.6 },
  { born: 'Hua, the night of fruit and egg. Fertile, generous, productive; things ripen around you.', today: 'Hua: the fruit night. Fertile and abundant; a fine night for fishing, planting and asking.', advice: 'act', polarity: 0.8 },
  { born: 'Akua, the night of the gods, nearly full. Devotion and abundance; a sense of the sacred runs through your life.', today: 'Akua: a sacred, nearly full night of prayer and abundance. Gather, give thanks, be generous.', advice: 'connect', polarity: 0.7 },
  { born: 'Hoku, the full moon. Radiant, visible, whole: you light the room without trying.', today: 'Hoku: the full moon. Everything flourishes. Harvest, celebrate, reach out.', advice: 'connect', polarity: 0.9 },
  { born: 'Māhealani, the fullest night. Clarity and completeness; you see the whole picture and help others see it.', today: 'Māhealani: the moon at its fullest. The best night of the month for almost everything. Go.', advice: 'act', polarity: 0.9 },
  { born: 'Kulu, the night of dropping. You know how to let ripe things fall; endings come gracefully to you.', today: 'Kulu: the first ripe fruit drops. Harvest what is ready and let the rest go.', advice: 'release', polarity: 0.2 },
  { born: 'Lāʻaukūkahi, the first Lāʻau night. Plants, medicine, healing; you grow things that heal.', today: 'Lāʻaukūkahi: the first Lāʻau night, for plants and medicine. Tend, gather, nourish.', advice: 'build', polarity: 0.5 },
  { born: 'Lāʻaukūlua, the second Lāʻau night. Practical and green-fingered; steady care is your love language.', today: 'Lāʻaukūlua: a Lāʻau night. Good for planting and for steady, careful work.', advice: 'build', polarity: 0.5 },
  { born: 'Lāʻaupau, the last Lāʻau night. You bring growing things to completion.', today: 'Lāʻaupau: the last Lāʻau night. Finish the tending before the waning ʻOle nights.', advice: 'build', polarity: 0.4 },
  { born: 'ʻOlekūkahi of the waning moon. Thoughtful and self-contained; you need your quiet nights.', today: 'ʻOlekūkahi (waning): an ʻOle night. Rough seas, little growth. Rest and repair.', advice: 'slow', polarity: -0.5 },
  { born: 'ʻOlekūlua of the waning moon. Introspective; you learn in the dark and bring it back to the light.', today: 'ʻOlekūlua (waning): an ʻOle night. Hold back; let plans ripen on their own.', advice: 'slow', polarity: -0.5 },
  { born: 'ʻOlepau of the waning moon. You close quiet chapters cleanly and come back ready.', today: 'ʻOlepau (waning): the last ʻOle night. Prepare for the Kāloa nights ahead.', advice: 'slow', polarity: -0.3 },
  { born: 'Kāloakūkahi, the first long night, sacred to Kanaloa. Depth and reach; you plant things that run long.', today: 'Kāloakūkahi: the first Kāloa night, sacred to Kanaloa. Plant long vines; good fishing; think long-term.', advice: 'build', polarity: 0.6 },
  { born: 'Kāloakūlua, the second long night. Endurance and stretch; what you start keeps going.', today: 'Kāloakūlua: a Kāloa night. Long projects advance; the sea is generous.', advice: 'act', polarity: 0.6 },
  { born: 'Kāloapau, the last long night. You know how to bring a long effort home.', today: 'Kāloapau: the last Kāloa night. Wrap up the long work; good fishing continues.', advice: 'act', polarity: 0.5 },
  { born: 'Kāne, the night of the creator god. Sacred and still; prayer, water and life itself are your themes.', today: 'Kāne: a sacred night of prayer and rest. No heavy work, no fishing; tend the inner life.', advice: 'slow', polarity: 0.1 },
  { born: 'Lono, the night of peace and the harvest god. Generous, peaceful, a natural host.', today: 'Lono: a sacred night of peace, prayer and gratitude. Ask for blessings; make peace.', advice: 'connect', polarity: 0.4 },
  { born: 'Mauli, the fading night. Old soul; you understand that every light rests before it returns.', today: 'Mauli: the moon fades. Finish, forgive, clear the ground for the next moon.', advice: 'release', polarity: -0.1 },
  { born: 'Muku, the dark night, when the moon is cut off. Deep, private, renewing; you are at home in beginnings that nobody sees.', today: 'Muku: the dark night. Let the old moon go. Rest; tomorrow the light returns.', advice: 'release', polarity: -0.3 },
];

export const ANAHULU_LINE: Record<string, string> = {
  'Hoʻonui': 'the growing nights, when the moon swells and the world leans toward beginnings',
  'Poepoe': 'the round nights, when the moon is full or nearly so and everything is at its height',
  'Hoʻēmi': 'the waning nights, when the moon shrinks and the work is finishing, resting and clearing',
};

export const MONTH_LINE: Record<string, string> = {
  'Welehu': 'the first moon of Makahiki, when Makaliʻi (the Pleiades) rises at dusk and the season of rest and games begins',
  'Makaliʻi': 'the Pleiades moon, deep in Makahiki: feasting, games, no war',
  'Kāʻelo': 'the wet moon of heavy rains, still within Makahiki',
  'Kaulua': 'the moon of two currents, when Makahiki closes and work resumes',
  'Nana': 'the moon of animation, when the land stirs and growth quickens',
  'Welo': 'the moon of tails, the last of the wet season',
  'Ikiiki': 'the warm, humid moon that opens Kau, the dry season',
  'Kaʻaona': 'the fragrant moon of mild weather and full growth',
  'Hinaiaʻeleʻele': 'the dark-cloud moon of summer heat',
  'Māhoe Mua': 'the first twin moon, high summer',
  'Māhoe Hope': 'the second twin moon, the harvest ripening',
  'ʻIkuwā': 'the noisy moon of surf and storms, the year turning toward Makahiki',
  'ʻIkuwā (second)': 'a second ʻIkuwā, the extra moon some years need before Makahiki',
};
