# Erzeugt Material für den Laien-Test (Qualitätstor 3): Regelkarten ohne Klausurformel, Glossar, 25 zufällige
# Stufe-0/1-Fälle mit GEMISCHTEN Antworten, und einen Schlüssel. Aufruf: python3 tools/laientest.py <ordner> <seed>
import json, random, re, sys
out, seed = sys.argv[1], int(sys.argv[2])
klar = lambda s: re.sub(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', r'\1', re.sub(r'\*\*(.+?)\*\*', r'\1', s or ''))
R = json.load(open('data/regeln.json')); F = json.load(open('data/faelle.json')); G = json.load(open('data/glossar.json'))
rnd = random.Random(seed)
pool = [f for f in F if f['stufe'] in (0, 1) and f['format'] in ('F1', 'F2', 'F4', 'F5') and not f.get('kombiRegeln')]
wahl = rnd.sample(pool, 25)
karten = ['# Regelkarten\nIm Spiel: Du arbeitest am Schalter einer Krankenkasse. Ole ist der Praktikant, Frau Brandt die Chefin.\n']
for r in R:
    karten.append(f"## {klar(r['titel'])} ({klar(r['fachbegriff'])})\n{klar(r['einSatz'])}\nWarum: {klar(r['warum'])}\nAlltag: {klar(r['alltag'])}\n"
                  f"So erkennst du es: {' / '.join(klar(e) for e in r['erkennen'])}\nMerktrick: {klar(r['merktrick'])}\n")
karten.append('\n# Glossar (im Spiel antippbar)\n' + '\n'.join(f"- {g['begriff']}: {klar(g['erklaerung'])} Beispiel: {klar(g.get('beispiel'))}" for g in G))
aufg, key = ['# 25 Fälle\n'], {}
for i, f in enumerate(wahl, 1):
    t = f"## Fall {i}\n{klar(f.get('akte'))}\n"
    if f['format'] == 'F2':
        teile = [x for x in f['markierbar'] if isinstance(x, dict)]
        t += 'Schreiben (antippbare Stellen):\n' + '\n'.join(f'  [{chr(65 + j)}] {klar(x["text"])}' for j, x in enumerate(teile))
        key[i] = ''.join(chr(65 + j) for j, x in enumerate(teile) if x['fehler'])
        if f.get('optionen'):
            ops = rnd.sample(f['optionen'], len(f['optionen']))
            t += '\nDanach Fehlerart: ' + ' / '.join(f'({j + 1}) {klar(o["text"])}' for j, o in enumerate(ops))
            key[i] += str([o['richtig'] for o in ops].index(True) + 1)
    else:
        if f['format'] == 'F4': t += f"{f['datumA']['label']}: {f['datumA']['datum']} / {f['datumB']['label']}: {f['datumB']['datum']}\n"
        ops = rnd.sample(f['optionen'], len(f['optionen']))
        t += 'Antworten: ' + ' / '.join(f'[{chr(65 + j)}] {klar(o["text"])}' for j, o in enumerate(ops))
        key[i] = chr(65 + [o['richtig'] for o in ops].index(True))
    aufg.append(t + f"\nFrage: {klar(f['frage'])}\n")
open(f'{out}/laie_regeln.md', 'w').write('\n'.join(karten))
open(f'{out}/laie_faelle.md', 'w').write('\n'.join(aufg))
json.dump({'key': key, 'ids': [f['id'] for f in wahl]}, open(f'{out}/laie_key.json', 'w'))
print('Schlüssel:', ' '.join(f'{k}={v}' for k, v in key.items()))
