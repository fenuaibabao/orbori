/** Terms, privacy and commitments, in plain language. Last updated dates are set when the text changes. */

export interface LegalPage { slug: string; title: string; updated: string; intro: string; sections: { h: string; p: string[] }[] }

export const LEGAL: LegalPage[] = [
  {
    slug: 'terms', title: 'Terms of use', updated: '2026-10-15',
    intro: 'Orbori is an astrology app for entertainment and reflection. These terms explain what you can expect from us and what we ask of you. They are written in plain language on purpose.',
    sections: [
      { h: 'What Orbori is', p: ['Orbori calculates charts and daily readings from seven traditions (Western, Vedic, Chinese, Numerology, Mayan, Hawaiian and Islamic) and presents them side by side. It is entertainment and a doorway into those traditions. It is not advice. Do not make medical, legal, financial or safety decisions because of something Orbori says.'] },
      { h: 'Who can use it', p: ['You must be 18 or older. By using Orbori you confirm that you are.'] },
      { h: 'Your account', p: ['You can use Orbori without an account; your data then stays on your device. If you sign in, your chart, check-ins and matches are saved to your account so they follow you between devices. Keep your email secure; sign-in links are as good as a password.'] },
      { h: 'Orbori Plus', p: ['Plus is a paid subscription, billed monthly or yearly through Stripe. It renews automatically until you cancel. Cancel any time from your Profile; you keep Plus until the end of the period you paid for. We do not offer partial refunds for unused time, except where the law requires it. Prices are shown before you pay and may change for future periods with notice.'] },
      { h: 'Your content', p: ['Birth details, names you type into calculators and anything you share belong to you. Names typed into the numerology and Abjad calculators are processed on your device and never sent to us.'] },
      { h: 'Fair use', p: ['Please do not scrape, resell, reverse-engineer or overload the service, or use it to harass anyone. We may suspend accounts that do.'] },
      { h: 'Accuracy', p: ['We work hard to make the astronomy and calendar calculations correct and we test them against published references. Interpretations are ours, written in our words, and traditions vary between communities and practitioners. Things can still be wrong; tell us and we will fix them.'] },
      { h: 'Changes and contact', p: ['We may update these terms; the date at the top tells you when. Questions: hello@orbori.app.'] },
    ],
  },
  {
    slug: 'privacy', title: 'Privacy', updated: '2026-10-15',
    intro: 'The short version: we store as little as we can, we never sell your data, and you can delete everything yourself.',
    sections: [
      { h: 'What we collect', p: [
        'Birth details (date, time if you have it, and birth city) to calculate your charts. Your daily check-ins and the matches you add. If you sign in, your email address. If you subscribe, Stripe handles your payment details; we never see your card number.',
        'Names typed into the name-number and Abjad calculators stay on your device and are never sent to our servers.',
        'The Cosmos places you in Circles worked out from your chart (like Fire Suns or Fire Horses). Circles only ever show counts and percentages, never names, and only once at least 10 people are in a Circle. You can stop being counted from The Cosmos page.',
        'Your journal is private. It is stored on your device and, if you are signed in, in your account so it follows you between devices. It is never shown to linked people and never used for anything else. It is never sent to the AI, with one exception you control: Celestials can ask for a monthly reflection, which sends that month\'s entries to Anthropic once, only when you tick the box and press the button.',
      ] },
      { h: 'Where it lives', p: [
        'Without an account, everything is stored in your browser on your device. With an account, it is stored in our database (Supabase, hosted in the United States), protected so that only you can read your rows.',
        'We use Vercel to run the site, Supabase for accounts and storage, Stripe for payments, Resend to send sign-in emails, Anthropic (Claude) to write the daily readings for Plus members, and OpenAI to paint Cosmic Visions (it receives only a description of your signs and colors, never your name, email or birth details). Anthropic receives only the calculated reading for the day and your Sun, Moon and Rising signs, never your name, email or exact birth details, and does not train on it. Each provider only receives what it needs to do its job.',
        'If you turn on the nightly reminder, we keep the address your phone or browser gives us for notifications, the time you picked and your time zone, and send one reminder a night through your browser\'s push service (Apple, Google or Mozilla). The reminder never contains your chart or journal. Turn it off in Me at any time and the address is deleted.',
        'If you add your Convergence Calendar to a calendar app, it uses a private link made just for you. The link only carries dates and the Council\'s advice, never your birth details, name or journal. You can make a new link at any time, which switches the old one off.',
        'You can delete your account at any time in Me → Account → Delete my account. That cancels any paid plan straight away and permanently deletes your chart, check-ins, journal, matches, Visions and rewards. If you sign in with Apple or Google, we receive only your email address (Apple may give us a private relay address instead).',
      ] },
      { h: 'What we do not do', p: ['We do not sell or rent your data. We do not show ads. We do not use your birth details for anything except your own charts and the features you use. Invite links and share cards never include your birth details.'] },
      { h: 'Deleting your data', p: ['"Start over" in your Profile erases your chart, check-ins, matches and journal from your device and, if you are signed in, from your account. To delete your account and email entirely, write to hello@orbori.app and we will do it within 30 days.'] },
      { h: 'Cookies', p: ['We use only the cookies needed to keep you signed in. No tracking cookies.'] },
      { h: 'Children', p: ['Orbori is for adults. We do not knowingly collect data from anyone under 18.'] },
      { h: 'Contact', p: ['Questions about your data: hello@orbori.app.'] },
    ],
  },
  {
    slug: 'commitments', title: 'Our commitments', updated: '2026-10-15',
    intro: 'Orbori brings together seven living traditions. None of them are ours to own. These are the commitments we hold ourselves to, written so you can hold us to them too.',
    sections: [
      { h: 'Get it right', p: ['We use the real names, the real counts and the real methods. Our Chol Q\'ij count matches the one kept by K\'iche\' day-keepers; our Hawaiian moon nights are anchored to the real Moon; our Vedic positions are checked against the Swiss Ephemeris. Interpretations are written in our own words, following each tradition, never copied from practitioners without permission.'] },
      { h: 'Credit the sources', p: ['Where a living practitioner or community shapes what we do, we say so and we link to them. Orbori is a doorway: if a tradition speaks to you, go to its people.'] },
      { h: 'Share the benefit', p: ['A fixed share of Orbori Plus revenue goes to organizations rooted in the traditions we draw on, including Hawaiian cultural and ʻāina organizations and K\'iche\' Maya community organizations in Guatemala. We publish who receives it and how much, here, once a year.'] },
      { h: 'Ask practitioners', p: ['We pay practitioners from each tradition to review what Orbori says in their tradition, and we credit them. They can veto. If something in Orbori misrepresents a tradition, it is because we have not yet been corrected, and we want to be.'] },
      { h: 'Respect what is closed', p: ['Calendars, star names and counts that communities teach publicly are what Orbori works with. Prayers, chants, ceremony and the sacred are not content. We will never gamify them.'] },
      { h: 'Get the languages right', p: ['Hawaiian with its ʻokina and kahakō, K\'iche\' spellings as day-keepers write them, Arabic in Arabic script. When we get it wrong, we fix it.'] },
      { h: 'Listen', p: ['If you belong to one of these communities and something here should change or go, write to hello@orbori.app. We will respond, and if asked by a community we will change or remove the content. We do not argue intent.'] },
    ],
  },
];
