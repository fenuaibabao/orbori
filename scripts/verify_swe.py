"""Cross-check Orbori engine output against the Swiss Ephemeris (Moshier mode).

Usage: npx tsx scripts/dump-cases.ts > /tmp/cases.json && python verify_swe.py /tmp/cases.json
"""
import json
import sys
from datetime import datetime

import swisseph as swe

BODIES = {
    'sun': swe.SUN, 'moon': swe.MOON, 'mercury': swe.MERCURY, 'venus': swe.VENUS,
    'mars': swe.MARS, 'jupiter': swe.JUPITER, 'saturn': swe.SATURN, 'uranus': swe.URANUS,
    'neptune': swe.NEPTUNE, 'pluto': swe.PLUTO, 'node': swe.MEAN_NODE,
}
FLAGS = swe.FLG_MOSEPH | swe.FLG_SPEED
SIGNS = 'Ari Tau Gem Can Leo Vir Lib Sco Sag Cap Aqu Pis'.split()


def diff(a, b):
    d = (a - b + 180) % 360 - 180
    return abs(d) * 3600  # arcseconds


def main(path):
    cases = json.load(open(path))
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    worst = {}
    sign_mismatch = []
    retro_mismatch = []
    for c in cases:
        dt = datetime.fromisoformat(c['utc'].replace('Z', '+00:00'))
        jd = swe.julday(dt.year, dt.month, dt.day, dt.hour + dt.minute / 60 + dt.second / 3600)
        for key, body in BODIES.items():
            ref, _ = swe.calc_ut(jd, body, FLAGS)
            refs, _ = swe.calc_ut(jd, body, FLAGS | swe.FLG_SIDEREAL)
            for label, ours, theirs in (('trop', c['tropical'][key], ref[0]), ('sid', c['sidereal'][key], refs[0])):
                e = diff(ours, theirs)
                k = f'{label}:{key}'
                worst[k] = max(worst.get(k, 0), e)
                if int(ours // 30) != int(theirs // 30):
                    sign_mismatch.append((c['date'], c['time'], c['tz'], k, round(ours, 4), round(theirs, 4)))
            if key != 'node' and key not in ('sun', 'moon') and (ref[3] < 0) != c['retro'][key]:
                if abs(ref[3]) > 0.01:  # ignore stations
                    retro_mismatch.append((c['date'], key, ref[3]))
        cusps, ascmc = swe.houses(jd, c['lat'], c['lon'], b'P')
        for label, ours, theirs in (('asc', c['asc'], ascmc[0]), ('mc', c['mc'], ascmc[1])):
            e = diff(ours, theirs)
            worst[label] = max(worst.get(label, 0), e)
            if int(ours // 30) != int(theirs // 30):
                sign_mismatch.append((c['date'], c['time'], c['tz'], label, round(ours, 4), round(theirs, 4)))
        ay = swe.get_ayanamsa_ut(jd)
        sid_asc = (ascmc[0] - ay) % 360
        e = diff(c['sidAsc'], sid_asc)
        worst['sidAsc'] = max(worst.get('sidAsc', 0), e)

    print(f'{len(cases)} births checked. Worst error per quantity (arcseconds):')
    for k in sorted(worst):
        print(f'  {k:14s} {worst[k]:8.1f}')
    print(f'sign mismatches: {len(sign_mismatch)}')
    for m in sign_mismatch[:20]:
        print('  ', m)
    print(f'retrograde mismatches: {len(retro_mismatch)}')
    for m in retro_mismatch[:10]:
        print('  ', m)


if __name__ == '__main__':
    main(sys.argv[1])
