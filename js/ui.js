// Kleine DOM- und Darstellungshelfer.

export function h(tag, attrs = {}, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kinder.flat()) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : document.createTextNode(c));
  return el;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

// Minimal-Markdown: Absätze, **fett**, Listen (- / 1.), Tabellen
export function md(src = '') {
  const lines = src.split('\n');
  let out = '';
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = (r) => r.split('|').slice(1, -1).map((c) => c.trim());
      const [kopf, , ...rest] = rows;
      out += '<div class="tabelle"><table><thead><tr>' + cells(kopf).map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>'
        + rest.map((r) => '<tr>' + cells(r).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>';
      continue;
    }
    if (/^(- |\d+\. )/.test(l)) {
      const ordered = /^\d+\. /.test(l);
      const items = [];
      while (i < lines.length && /^(- |\d+\. )/.test(lines[i])) items.push(lines[i++].replace(/^(- |\d+\. )/, ''));
      const tag = ordered ? 'ol' : 'ul';
      out += `<${tag}>` + items.map((t) => `<li>${inline(t)}</li>`).join('') + `</${tag}>`;
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(- |\d+\. |\|)/.test(lines[i])) para.push(lines[i++]);
    out += `<p>${para.map(inline).join('<br>')}</p>`;
  }
  return out;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const ZUSTAND = {
  kritisch: { label: 'kritisch', icon: '▲' },
  wackelt: { label: 'wackelt', icon: '◆' },
  stabil: { label: 'stabil', icon: '●' },
  entlassen: { label: 'entlassen', icon: '✓' },
  neu: { label: 'neu', icon: '○' },
};

export function toast(text) {
  const t = h('div', { class: 'toast', role: 'status' }, text);
  document.body.append(t);
  setTimeout(() => t.classList.add('weg'), 1800);
  setTimeout(() => t.remove(), 2300);
}

export function konfetti(n = 70) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = h('div', { class: 'konfetti', 'aria-hidden': 'true' });
  const farben = ['var(--hf)', 'var(--spo2)', 'var(--af)', 'var(--nibp)', 'var(--text)'];
  for (let i = 0; i < n; i++) {
    const s = h('i');
    s.style.left = Math.random() * 100 + '%';
    s.style.background = farben[i % farben.length];
    s.style.animationDelay = Math.random() * 0.4 + 's';
    s.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
    s.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    box.append(s);
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 2600);
}

// EKG-Kurve als SVG-Pfad; Puls/Amplitude spiegeln den Zustand
export function ekgPfad(breite, hoehe, vital, phase = 0) {
  const mitte = hoehe * 0.62;
  if (vital === null) return `M0 ${mitte} L${breite} ${mitte}`;
  const amp = (0.25 + 0.75 * vital / 100) * hoehe * 0.55;
  const schlag = 64 - Math.round(vital / 100 * 18);
  let d = `M0 ${mitte}`;
  for (let x = -phase; x < breite; x += schlag) {
    const p = (dx) => Math.max(0, Math.min(breite, x + dx)).toFixed(1);
    d += ` L${p(schlag * 0.35)} ${mitte} L${p(schlag * 0.42)} ${mitte - amp * 0.12} L${p(schlag * 0.48)} ${mitte}`
      + ` L${p(schlag * 0.55)} ${mitte + amp * 0.18} L${p(schlag * 0.6)} ${mitte - amp} L${p(schlag * 0.66)} ${mitte + amp * 0.32}`
      + ` L${p(schlag * 0.72)} ${mitte} L${p(schlag * 0.84)} ${mitte - amp * 0.2} L${p(schlag * 0.94)} ${mitte}`;
  }
  return d + ` L${breite} ${mitte}`;
}
