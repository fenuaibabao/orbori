# Orbori

**Where the stars agree.** Western, Vedic, Chinese zodiac, Numerology and Mayan Tzolk'in in one Cosmic Council.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000 (builds the city index on first run)
npm test         # engine + council tests
```

## What's here

| Path | What it does |
| --- | --- |
| `src/lib/astro/` | Calculation engine: tropical + sidereal (Lahiri) planets, Ascendant/MC, nakshatras, Chinese zodiac with true Lunar New Year boundaries, Life Path, Tzolk'in (GMT 584283). |
| `src/lib/council/` | Daily Cosmic Council: one signal per system (transits, Tara Bala/Chandrashtama, day pillar, Personal Day, Tzolk'in day), Convergence Score, agree/dissent. |
| `src/lib/rarity.ts` + `src/data/rarity.json` | Chart Rarity: estimated share of people (born 1940–2012) with the same Sun + Moon + animal + Life Path, and tier cutoffs (rarest 5% Mythic, next 15% Rare, next 30% Uncommon). Rebuild with `npx tsx scripts/build-rarity.ts`. |
| `src/lib/progress.ts` | Oracle Levels, XP, streaks and badges. |
| `src/app/api/card/[kind]` | 1080×1920 story share cards (`rarity`, `score`, `match`, `level`). |
| `src/lib/compat/` | Five-system compatibility incl. Vedic Guna Milan (gender-neutral). |
| `src/lib/invite.ts` | "See your side" invite tokens, AES-256-GCM with `INVITE_SECRET` (set in Vercel → Settings → Environment Variables). |
| `src/app/api/cities` | Birth-city search with time zones (GeoNames, CC BY 4.0). |

Live at **https://orbori.vercel.app** (deploys automatically from `main`).

Profiles and check-ins are stored on the device for now (`src/lib/store.ts`); accounts come next.

## Accuracy

`scripts/verify_swe.py` compares 400 random births against Swiss Ephemeris (used only as a test reference, not shipped). Planets agree within ~20″, the Ascendant within ~2″.
