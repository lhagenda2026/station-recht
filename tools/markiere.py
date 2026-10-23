# Setzt in jeder Leseeinheit (Regelkarte bzw. Fall) beim ersten Vorkommen jedes Glossarworts [[…]].
# Aufruf: python3 tools/markiere.py inhalte/stockwerk-1.json …
import json, re, sys, glob
glossar = []
for p in glob.glob('inhalte/*.json'):
    glossar += json.load(open(p)).get('glossar', [])
WB = 'A-Za-zÄÖÜäöüß'
def formen(g): return sorted([g['begriff']] + g.get('formen', []), key=len, reverse=True)
def markiert(text):
    ids = set()
    for m in re.finditer(r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]', text):
        ids.add((m.group(2) or m.group(1)).lower())
    return ids
def setze(text, wort, gid, begriff):
    spans = [m.span() for m in re.finditer(r'\[\[.*?\]\]', text)]
    for m in re.finditer(rf'(?<![{WB}-]){re.escape(wort)}(?![{WB}])', text):
        if any(a <= m.start() < b for a, b in spans): continue
        ziel = '' if m.group(0).lower() == begriff.lower() else f'|{gid}'
        return text[:m.start()] + f'[[{m.group(0)}{ziel}]]' + text[m.end():], True
    return text, False
def einheit(felder, eigener=''):
    # felder: Liste (objekt, schluessel) in Lesereihenfolge
    alles = ' '.join(str(o[k]) for o, k in felder if o.get(k))
    vorhanden = markiert(alles)
    for g in glossar:
        fs = formen(g)
        if g['id'] in vorhanden or any(f.lower() in vorhanden for f in fs): continue
        if g['begriff'].lower() in eigener.lower(): continue
        fertig = False
        for o, k in felder:
            if fertig or not isinstance(o.get(k), str): continue
            for w in fs:
                o[k], fertig = setze(o[k], w, g['id'], g['begriff'])
                if fertig: break
for p in sys.argv[1:]:
    d = json.load(open(p))
    for r in d['regeln']:
        erk = [{'t': e} for e in r['erkennen']]
        einheit([(r, 'einSatz'), (r, 'warum'), (r, 'alltag')] + [(e, 't') for e in erk] + [(r, 'merktrick')], f"{r['fachbegriff']} {r['titel']}")
        r['erkennen'] = [e['t'] for e in erk]
    for f in d['faelle']:
        felder = [(f, 'akte'), (f, 'frage')]
        for t in f.get('markierbar', []):
            if isinstance(t, dict): felder.append((t, 'warumNicht'))
        if f['format'] == 'F5': felder += [(o, 'text') for o in f.get('optionen', [])]
        felder += [(o, 'warumNicht') for o in f.get('optionen', [])]
        for k in (f.get('fachfaecher') or {}).get('karten', []): felder.append((k, 'warumNicht'))
        dw = [{'t': x} for x in f.get('denkweg', [])]
        felder += [(f, 'ergebnis'), (f, 'warum')] + [(x, 't') for x in dw] + [(f, 'rechnung')]
        einheit(felder)
        if dw: f['denkweg'] = [x['t'] for x in dw]
    json.dump(d, open(p, 'w'), ensure_ascii=False, indent=1)
    print('markiert', p)
