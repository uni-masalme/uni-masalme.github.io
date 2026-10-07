/* ==================================================
   aufgaben.js — Aufgaben darstellen, einsammeln, bewerten
   Gemeinsam für Schülerseite und Auswertung.

   Antwortformen je Aufgabentyp
     freitext    "Text"
     mc          Index  bzw. [Indizes] bei mehrfach
     abstimmung  { wahl: Index, begruendung: "Text" }
     zuordnen    [Kategorie-Index je Element, in der Reihenfolge aus stationen.js]
================================================== */

export const MAX_ZEICHEN = 1500;

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* Alle Aufgaben einer Station in der Reihenfolge aus stationen.js */
export function alleAufgaben(station) {
  return station.aufgaben.map(a => ({ ...a }));
}

/* ── Reihenfolge der Zuordnen-Elemente: gemischt, aber stabil ── */

function zufall(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function reihenfolge(station, aufgabe) {
  const r = zufall(`${station.id}/${aufgabe.id}`);
  const idx = aufgabe.elemente.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/* Zuordnung als Liste mit einem Eintrag je Element (Index der Kategorie oder null).
   Die Realtime Database speichert Listen mit Lücken als Objekt { "1": 2, "4": 0 }
   und gibt sie auch so zurück — deshalb hier immer zurückverwandeln. */
export function zuordnung(wert, n) {
  const liste = Array.from({ length: n }, () => null);
  if (wert && typeof wert === 'object') {
    Object.entries(wert).forEach(([k, v]) => {
      const i = Number(k);
      if (Number.isInteger(i) && i >= 0 && i < n && Number.isInteger(v)) liste[i] = v;
    });
  }
  return liste;
}

/* ── Prüfen und bewerten ─────────────────────────── */

export function istBeantwortet(aufgabe, wert) {
  switch (aufgabe.typ) {
    case 'freitext':   return typeof wert === 'string' && wert.trim().length > 0;
    case 'mc':         return aufgabe.mehrfach ? Array.isArray(wert) && wert.length > 0 : Number.isInteger(wert);
    case 'abstimmung': return !!wert && Number.isInteger(wert.wahl) &&
                              (!aufgabe.begruendung || (wert.begruendung || '').trim().length > 0);
    case 'zuordnen':   return zuordnung(wert, aufgabe.elemente.length).every(Number.isInteger);
    default:           return false;
  }
}

/* Ids der Pflichtaufgaben, die noch fehlen */
export function fehlende(station, antworten) {
  return alleAufgaben(station)
    .filter(a => !a.optional && !istBeantwortet(a, antworten[a.id]))
    .map(a => a.id);
}

function bewertbar(aufgabe) {
  return aufgabe.typ === 'zuordnen' || (aufgabe.typ === 'mc' && aufgabe.richtig !== undefined);
}

export function bewerte(station, antworten) {
  let punkte = 0, max = 0;
  const je = {};
  for (const a of alleAufgaben(station)) {
    if (!bewertbar(a)) continue;
    const wert = antworten[a.id];
    if (a.typ === 'mc') {
      const soll = [].concat(a.richtig).sort().join(',');
      const ist  = [].concat(wert ?? []).sort().join(',');
      const ok = soll === ist;
      je[a.id] = { richtig: ok };
      punkte += ok ? 1 : 0; max += 1;
    } else {
      const ist = zuordnung(wert, a.elemente.length);
      const elemente = a.elemente.map((e, i) => ist[i] === e.richtig);
      const p = elemente.filter(Boolean).length;
      je[a.id] = { elemente, punkte: p, richtig: p === a.elemente.length };
      punkte += p; max += a.elemente.length;
    }
  }
  return { punkte, max, je };
}

/* Antwort als lesbarer Text (Auswertung, CSV) */
export function antwortText(aufgabe, wert) {
  if (wert === undefined || wert === null) return '';
  switch (aufgabe.typ) {
    case 'freitext':   return wert;
    case 'mc':         return [].concat(wert).map(i => aufgabe.optionen[i]).join(' | ');
    case 'abstimmung': return [aufgabe.optionen[wert.wahl], wert.begruendung].filter(Boolean).join('. ');
    case 'zuordnen': {
      const ist = zuordnung(wert, aufgabe.elemente.length);
      return aufgabe.elemente.map((e, i) => `${e.text} → ${aufgabe.kategorien[ist[i]] ?? '?'}`).join(' | ');
    }
    default:           return '';
  }
}

/* ── Darstellung ─────────────────────────────────── */

export function renderMaterial(station) {
  return station.material.map(m => {
    const label = m.label ? `<div class="label">${esc(m.label)}</div>` : '';
    if (m.typ === 'zitat') {
      return `<figure class="zitat"><blockquote>${esc(m.text)}</blockquote>
        ${m.quelle ? `<figcaption>${esc(m.quelle)}</figcaption>` : ''}</figure>`;
    }
    const inhalt = m.liste
      ? `<dl class="begriffe">${m.liste.map(([b, d]) => `<dt>${esc(b)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>`
      : `<p>${m.text}</p>`;   // Text aus stationen.js darf <b> und <i> enthalten
    return `<div class="karte ${m.typ}">${label}${inhalt}</div>`;
  }).join('');
}

/*  optionen.gesperrt  nur anzeigen (nach der Abgabe, in der Auswertung)
    optionen.ergebnis  Ergebnis aus bewerte() — zeigt richtig/falsch und Lösungen

    Auswählbares sind <button>, keine versteckten Radio-Inputs: Buttons
    reagieren auf dem iPad zuverlässig auf jeden Tipp und lassen sich wie
    im Heterogenität-Quiz durch erneutes Tippen wieder abwählen. */
export function renderAufgaben(station, antworten, optionen = {}) {
  let nr = 0;
  return alleAufgaben(station).map(a => {
    const nummer = a.optional && station.layout === 'quiz' ? '' : String(++nr);
    return renderAufgabe(station, a, nummer, antworten[a.id], optionen);
  }).join('');
}

const BUCHSTABEN = 'ABCDEFGH';

/* Gewählte Indizes einer Aufgabe (mc: Zahl oder Liste, abstimmung: { wahl }) */
function gewaehlteOptionen(a, wert) {
  return a.typ === 'abstimmung' ? [].concat(wert?.wahl ?? []) : [].concat(wert ?? []);
}

function renderOptionen(a, wert, gesperrt, bew) {
  const gewaehlt = gewaehlteOptionen(a, wert);
  const richtige = bew ? [].concat(a.richtig) : [];
  const rolle = a.mehrfach ? 'checkbox' : 'radio';
  const tag = gesperrt ? 'div' : 'button';
  return `<div class="options" role="${a.mehrfach ? 'group' : 'radiogroup'}" aria-label="${esc(a.auftrag)}">` +
    a.optionen.map((o, i) => {
      const an = gewaehlt.includes(i);
      const istRichtig = richtige.includes(i);
      let klasse = an ? ' selected' : '';
      let notiz = '';
      if (bew && istRichtig) { klasse = ' correct'; notiz = an ? '✓ deine Antwort' : 'richtig'; }
      else if (bew && an)    { klasse = ' wrong';   notiz = '✗ deine Antwort'; }
      const attr = gesperrt ? '' :
        `type="button" role="${rolle}" aria-checked="${an}" data-a="${a.id}" data-k="${a.typ}" data-w="${i}"`;
      return `<${tag} class="option${klasse}" ${attr}>` +
        `<span class="option-letter" aria-hidden="true">${BUCHSTABEN[i] || i + 1}</span>` +
        `<span class="option-text">${esc(o)}</span>` +
        (notiz ? `<span class="option-note">${notiz}</span>` : '') +
        `</${tag}>`;
    }).join('') + '</div>';
}

/* Rückmeldung wie im Lernmodus von Heterogenität */
function renderRueckmeldung(a, bew) {
  if (!bew) return '';
  const loesung = [].concat(a.richtig).map(i => a.optionen[i]);
  const erkl = a.erklaerung ? ` ${esc(a.erklaerung)}` : '';
  return bew.richtig
    ? `<div class="feedback-box correct-fb"><span class="fb-icon">✓</span><span><b>Richtig!</b>${erkl}</span></div>`
    : `<div class="feedback-box wrong-fb"><span class="fb-icon">✗</span><span>Nicht ganz. Richtig ist <strong>${esc(loesung.join(' / '))}</strong>${erkl ? '<br>' + erkl : ''}</span></div>`;
}

function renderAufgabe(station, a, nummer, wert, { gesperrt = false, ergebnis = null }) {
  const bew = ergebnis && ergebnis.je[a.id];
  const quiz = station.layout === 'quiz';

  /* Abschlussquiz: Fragenblöcke wie im Heterogenität-Test */
  if (quiz && a.typ === 'mc') {
    return `<section class="aufgabe question-block" id="aufgabe-${a.id}" data-aufgabe="${a.id}">
      ${a.thema ? `<div class="question-theme">${esc(a.thema)}</div>` : ''}
      <div class="question-text">${nummer}. ${esc(a.auftrag)}</div>
      ${renderOptionen(a, wert, gesperrt, bew)}${renderRueckmeldung(a, bew)}</section>`;
  }
  if (quiz && a.typ === 'freitext' && !a.optional) {
    return `<section class="aufgabe question-block" id="aufgabe-${a.id}" data-aufgabe="${a.id}">
      ${a.thema ? `<div class="question-theme">${esc(a.thema)}</div>` : ''}
      <div class="question-text">${nummer}. ${esc(a.auftrag)}</div>
      ${gesperrt ? textBlock(wert)
        : `<textarea class="schreib" data-a="${a.id}" data-k="text" rows="${Math.max(2, a.zeilen || 3)}"
             maxlength="${MAX_ZEICHEN}" aria-label="${esc(a.auftrag)}">${esc(wert || '')}</textarea>`}</section>`;
  }
  if (quiz && a.typ === 'freitext' && a.optional) {
    return `<section class="aufgabe offene-frage-wrap" id="aufgabe-${a.id}" data-aufgabe="${a.id}">
      <label class="offene-frage-label" for="feld-${a.id}">${esc(a.auftrag)} <span class="offene-frage-optional">(optional)</span></label>
      ${gesperrt ? textBlock(wert)
        : `<textarea id="feld-${a.id}" class="offene-frage-textarea" data-a="${a.id}" data-k="text" rows="${a.zeilen || 3}"
             maxlength="${MAX_ZEICHEN}">${esc(wert || '')}</textarea>`}</section>`;
  }

  const marke = bew && a.typ === 'zuordnen'
    ? `<span class="urteil ${bew.richtig ? 'ok' : 'nein'}">${bew.richtig ? '✓ alles richtig' : `${bew.punkte} von ${a.elemente.length} richtig`}</span>`
    : '';
  const kopf = `<div class="a-kopf"><span class="nr">${nummer}</span><p class="a-text">${esc(a.auftrag)}${a.mehrfach ? ' <span class="hinweis">(mehrere Antworten möglich)</span>' : ''}</p>${marke}</div>`;

  let koerper = '';

  if (a.typ === 'freitext') {
    koerper = gesperrt
      ? textBlock(wert)
      : `<textarea class="schreib" data-a="${a.id}" data-k="text" rows="${Math.max(2, a.zeilen || 3)}"
           maxlength="${MAX_ZEICHEN}" aria-label="${esc(a.auftrag)}">${esc(wert || '')}</textarea>`;
  }

  if (a.typ === 'mc' || a.typ === 'abstimmung') {
    koerper = renderOptionen(a, wert, gesperrt, bew);
    if (a.typ === 'abstimmung' && a.begruendung) {
      koerper += `<div class="begruendung"><div class="label">${esc(a.begruendung)}</div>` +
        (gesperrt
          ? textBlock(wert?.begruendung)
          : `<textarea class="schreib" data-a="${a.id}" data-k="begruendung" rows="3" maxlength="${MAX_ZEICHEN}"
               aria-label="${esc(a.begruendung)}">${esc(wert?.begruendung || '')}</textarea>`) +
        '</div>';
    }
    koerper += renderRueckmeldung(a, bew);
  }

  if (a.typ === 'zuordnen') {
    const tag = gesperrt ? 'span' : 'button';
    const gewaehlt = zuordnung(wert, a.elemente.length);
    koerper = '<div class="zuordnen">' + reihenfolge(station, a).map(i => {
      const e = a.elemente[i];
      const ist = gewaehlt[i];
      const ok = bew ? bew.elemente[i] : null;
      const rueck = bew
        ? `<div class="z-rueck ${ok ? 'ok' : 'nein'}">${ok ? '✓ richtig' : `✗ richtig wäre <b>${esc(a.kategorien[e.richtig])}</b>`}</div>`
        : '';
      return `<div class="z-element${bew ? (ok ? ' ok' : ' nein') : ''}">
        <p class="z-text">${esc(e.text)}</p>
        <div class="chips" role="radiogroup" aria-label="${esc(e.text)}">` +
        a.kategorien.map((k, ki) => {
          const attr = gesperrt ? '' :
            `type="button" role="radio" aria-checked="${ist === ki}" data-a="${a.id}" data-k="zuordnen" data-i="${i}" data-w="${ki}"`;
          return `<${tag} class="chip${ist === ki ? ' selected' : ''}" ${attr}>${esc(k)}</${tag}>`;
        }).join('') +
        `</div>${rueck}</div>`;
    }).join('') + '</div>';
  }

  return `<section class="aufgabe" id="aufgabe-${a.id}" data-aufgabe="${a.id}">${kopf}${koerper}</section>`;
}

function textBlock(text) {
  return text && String(text).trim()
    ? `<div class="antwort-text">${esc(text)}</div>`
    : '<div class="antwort-text leer">keine Antwort</div>';
}

/* ── Eingaben einsammeln ─────────────────────────── */

export function bindeEingaben(container, station, antworten, beiAenderung) {
  const aufgaben = Object.fromEntries(alleAufgaben(station).map(a => [a.id, a]));

  // Texte
  container.addEventListener('input', e => {
    const el = e.target;
    const a = aufgaben[el.dataset.a];
    if (!a || el.tagName !== 'TEXTAREA') return;
    if (el.dataset.k === 'begruendung') antworten[a.id] = { ...(antworten[a.id] || {}), begruendung: el.value };
    else antworten[a.id] = el.value;
    el.closest('.aufgabe')?.classList.remove('fehlt');
    beiAenderung(a.id);
  });

  // Antwortkacheln und Zuordnungs-Chips; erneutes Tippen wählt ab
  container.addEventListener('click', e => {
    const knopf = e.target.closest('button[data-a]');
    if (!knopf) return;
    const a = aufgaben[knopf.dataset.a];
    if (!a) return;
    const w = Number(knopf.dataset.w);
    let gruppe;

    if (a.typ === 'mc') {
      if (a.mehrfach) {
        const liste = Array.isArray(antworten[a.id]) ? antworten[a.id] : [];
        const neu = liste.includes(w) ? liste.filter(x => x !== w) : [...liste, w].sort();
        if (neu.length) antworten[a.id] = neu; else delete antworten[a.id];
      } else if (antworten[a.id] === w) delete antworten[a.id];
      else antworten[a.id] = w;
      const ist = [].concat(antworten[a.id] ?? []);
      gruppe = [...container.querySelectorAll(`button[data-a="${a.id}"]`)].map(b => [b, ist.includes(Number(b.dataset.w))]);
    }

    if (a.typ === 'abstimmung') {
      const alt = antworten[a.id] || {};
      antworten[a.id] = { ...alt, wahl: alt.wahl === w ? null : w };
      gruppe = [...container.querySelectorAll(`button[data-a="${a.id}"][data-k="abstimmung"]`)]
        .map(b => [b, Number(b.dataset.w) === antworten[a.id].wahl]);
    }

    if (a.typ === 'zuordnen') {
      const i = Number(knopf.dataset.i);
      const liste = zuordnung(antworten[a.id], a.elemente.length);
      liste[i] = liste[i] === w ? null : w;
      antworten[a.id] = liste;
      gruppe = [...container.querySelectorAll(`button[data-a="${a.id}"][data-i="${i}"]`)]
        .map(b => [b, Number(b.dataset.w) === liste[i]]);
    }

    (gruppe || []).forEach(([b, an]) => {
      b.classList.toggle('selected', an);
      b.setAttribute('aria-checked', String(an));
    });
    knopf.closest('.aufgabe')?.classList.remove('fehlt');
    beiAenderung(a.id);
  });
}
