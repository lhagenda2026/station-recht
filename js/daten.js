// Lädt data/*.json einmal und baut Nachschlage-Tabellen.
export const D = { regeln: [], faelle: [], glossar: [], regelMap: {}, fallMap: {}, faelleNachRegel: {}, glossarMap: {} };

export async function ladeDaten() {
  const [regeln, faelle, glossar] = await Promise.all(
    ['regeln', 'faelle', 'glossar'].map((n) => fetch(`data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); })),
  );
  Object.assign(D, { regeln, faelle, glossar });
  regeln.forEach((r) => { D.regelMap[r.id] = r; });
  faelle.forEach((f) => {
    D.fallMap[f.id] = f;
    (D.faelleNachRegel[f.regelId] ??= []).push(f);
  });
  glossar.forEach((g) => {
    [g.begriff, ...(g.formen ?? [])].forEach((w) => { D.glossarMap[w.toLowerCase()] = g; });
    D.glossarMap[g.id] = g;
  });
}
