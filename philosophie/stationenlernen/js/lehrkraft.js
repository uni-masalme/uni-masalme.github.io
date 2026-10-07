/* ==================================================
   lehrkraft.js — Auswertung für die Lehrkraft
   Live-Übersicht (wer ist wo, wer hat was abgegeben),
   Auswertung je Station, alle Antworten je Person,
   QR-Code für den Beamer, CSV-Export, Löschen.
================================================== */

import { oeffneSpeicher } from './speicher.js';
import { KURS, REGELN, STATIONEN } from './stationen.js';
import { alleAufgaben, antwortText, bewerte, renderAufgaben, renderMaterial, zuordnung, esc } from './aufgaben.js';
import { toast, frage } from './ui.js';

const app = document.getElementById('app');
const banner = document.getElementById('banner');

let speicher = null;
let stand = null;           // { teilnehmer: [], abgaben: [] }
let stopDaten = null;
let anonym = lese('stl-anonym') === '1';

function lese(k) { try { return localStorage.getItem(k); } catch { return null; } }
function merke(k, v) { try { localStorage.setItem(k, v); } catch { /* egal */ } }

const stationNr = id => STATIONEN.findIndex(s => s.id === id) + 1;
const schuelerLink = () => new URL('./', location.href).href;

/* ── Start und Anmeldung ── */
async function start() {
  try {
    speicher = await oeffneSpeicher();
  } catch (err) {
    console.error(err);
    app.innerHTML = '<div class="banner fehler">Firebase konnte nicht geladen werden. Netz prüfen und neu laden.</div>';
    return;
  }
  if (speicher.modus === 'demo') {
    banner.hidden = false;
    banner.textContent = 'Demo-Modus. Angezeigt wird nur, was in diesem Browser auf der Schülerseite eingegeben wurde. Ohne ?demo in der Adresse siehst du die echten Ergebnisse.';
  }
  window.addEventListener('hashchange', zeichne);
  speicher.lehrkraftStatus(user => {
    stopDaten?.(); stopDaten = null; stand = null;
    if (!user) return zeigeAnmeldung();
    app.innerHTML = '<p class="laden">Lade Ergebnisse …</p>';
    stopDaten = speicher.beobachteAlles(daten => {
      // Punkte hier neu rechnen statt dem Browser der Schüler zu glauben;
      // so wirkt auch eine nachträglich korrigierte Lösung in stationen.js
      const abgaben = daten.abgaben.filter(a => STATIONEN.some(s => s.id === a.stationId)).map(a => {
        const { punkte, max } = bewerte(STATIONEN.find(s => s.id === a.stationId), a.antworten || {});
        return { ...a, punkte, maxPunkte: max };
      });
      // Zwischenstände nur für Stationen, die noch nicht abgegeben sind
      const fertig = new Set(abgaben.map(a => `${a.uid}_${a.stationId}`));
      const entwuerfe = (daten.entwuerfe || []).filter(e =>
        STATIONEN.some(s => s.id === e.stationId) && !fertig.has(`${e.uid}_${e.stationId}`));
      stand = { teilnehmer: daten.teilnehmer, abgaben, entwuerfe };
      zeichne();
    }, err => {
      console.error(err);
      app.innerHTML = err.code === 'permission-denied'
        ? `<div class="banner fehler">Dieses Konto darf die Ergebnisse nicht lesen. Seine UID steht nicht in den Datenbank-Regeln.</div>
           <div class="karte"><div class="label">Angemeldet als</div>
             <p>${esc(user.email || '(ohne E-Mail)')}</p>
             <div class="label abstand-oben">UID dieses Kontos</div>
             <p><code class="uid">${esc(user.uid)}</code></p>
             <p class="hinweis abstand-oben">Diese UID muss in den Regeln stehen (Realtime Database → Regeln, siehe README).
               Oder abmelden und mit dem Konto anmelden, dessen UID schon eingetragen ist.</p></div>
           <button class="knopf hell" id="raus">Abmelden</button>`
        : `<div class="banner fehler">Verbindung unterbrochen. Seite neu laden.</div>
           <button class="knopf hell" id="raus">Abmelden</button>`;
      document.getElementById('raus').onclick = () => speicher.lehrkraftAbmelden();
    });
  });
}

function zeigeAnmeldung() {
  app.innerHTML = `
    <div class="anmeldung">
      <p class="eyebrow">${esc(KURS.eyebrow)}</p>
      <h1 class="titel">Auswertung</h1>
      <div class="login-google">
        <button class="knopf" id="google" type="button">Mit Google anmelden</button>
        <p class="hinweis trenner">oder mit E-Mail und Passwort</p>
      </div>
      <form id="login">
        <label for="email">E-Mail</label>
        <input id="email" type="email" class="feld-eingabe" autocomplete="username" required>
        <label for="pw">Passwort</label>
        <input id="pw" type="password" class="feld-eingabe" autocomplete="current-password" required>
        <button class="knopf hell" type="submit">Anmelden</button>
      </form>
    </div>`;
  document.getElementById('google').addEventListener('click', async e => {
    const knopf = e.currentTarget;
    knopf.disabled = true;
    try {
      await speicher.lehrkraftGoogle();
    } catch (err) {
      console.error(err);
      const meldung = {
        'auth/popup-blocked': 'Das Anmeldefenster wurde blockiert. Pop-ups für diese Seite erlauben und noch einmal versuchen.',
        'auth/popup-closed-by-user': 'Anmeldung abgebrochen.',
        'auth/cancelled-popup-request': 'Anmeldung abgebrochen.',
        'auth/unauthorized-domain': 'Diese Adresse ist in Firebase nicht freigegeben (Authentication → Einstellungen → Autorisierte Domains).',
        'auth/operation-not-allowed': 'Google-Anmeldung ist in Firebase nicht aktiviert (Authentication → Sign-in method).',
      }[err.code] || 'Anmelden mit Google fehlgeschlagen.';
      toast(meldung, 'fehler');
      knopf.disabled = false;
    }
  });
  document.getElementById('login').addEventListener('submit', async e => {
    e.preventDefault();
    const knopf = e.target.querySelector('button');
    knopf.disabled = true;
    try {
      await speicher.lehrkraftAnmelden(document.getElementById('email').value.trim(), document.getElementById('pw').value);
    } catch (err) {
      console.error(err);
      toast(['auth/configuration-not-found', 'auth/operation-not-allowed'].includes(err.code)
        ? 'E-Mail/Passwort-Anmeldung ist in Firebase noch nicht aktiviert (Authentication → Sign-in method).'
        : 'Anmelden fehlgeschlagen. E-Mail und Passwort prüfen.', 'fehler');
      knopf.disabled = false;
    }
  });
}

/* ── Daten aufbereiten ── */
function personen() {
  const map = new Map();
  stand.teilnehmer.forEach(t => map.set(t.uid, { ...t, abgaben: {}, entwuerfe: {} }));
  // Abgaben von Personen, deren Teilnehmer-Eintrag fehlt, trotzdem zeigen
  stand.abgaben.forEach(a => {
    if (!map.has(a.uid)) map.set(a.uid, { uid: a.uid, name: a.name, aktuelleStation: null, zuletzt: null, abgaben: {}, entwuerfe: {} });
    map.get(a.uid).abgaben[a.stationId] = a;
  });
  stand.entwuerfe.forEach(e => { if (map.has(e.uid)) map.get(e.uid).entwuerfe[e.stationId] = e; });
  const liste = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  liste.forEach((p, i) => { p.anzeige = anonym ? `Person ${i + 1}` : p.name; });
  // Wer sich ab- und mit anderem Namen wieder anmeldet, behält den Gerätecode
  liste.forEach(p => {
    p.selbesGeraet = p.geraet ? liste.filter(q => q !== p && q.geraet === p.geraet) : [];
  });
  return liste;
}

function laufzettelStand(p) {
  const pflicht = STATIONEN.filter(s => s.art === 'pflicht');
  const pflichtFertig = pflicht.filter(s => p.abgaben[s.id]).length;
  const wahl = STATIONEN.filter(s => s.art !== 'pflicht' && p.abgaben[s.id]).length;
  return { pflicht: pflicht.length, pflichtFertig, wahl,
           fertig: pflichtFertig === pflicht.length && wahl >= REGELN.mindestWahl };
}
const laufzettel = p => laufzettelStand(p).fertig;

const uhrzeit = ms => ms ? new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
function vorMinuten(ms) {
  if (!ms) return '';
  const min = Math.round((Date.now() - ms) / 60000);
  return min < 1 ? 'gerade eben' : min === 1 ? 'vor 1 Min.' : min < 60 ? `vor ${min} Min.` : `um ${uhrzeit(ms)} Uhr`;
}

/* ── Rahmen ── */
function zeichne() {
  if (!stand) return;
  const m = location.hash.match(/^#\/(station|person|besprechung)(?:\/([\w-]+))?/);
  const liste = personen();
  let inhalt;
  if (m && m[1] === 'besprechung') inhalt = besprechungsAnsicht(m[2], liste);
  else if (m && m[1] === 'station' && STATIONEN.some(s => s.id === m[2])) inhalt = stationsAnsicht(STATIONEN.find(s => s.id === m[2]), liste);
  else if (m && m[1] === 'person' && liste.some(p => p.uid === m[2])) inhalt = personenAnsicht(liste.find(p => p.uid === m[2]));
  else inhalt = uebersicht(liste);

  // Live-Updates zeichnen neu: aufgeklappte Bereiche und Scrollposition behalten
  const offen = new Set([...app.querySelectorAll('details[open][data-key]')].map(d => d.dataset.key));
  const y = window.scrollY;
  app.innerHTML = `
    <div class="kopfzeile">
      <span><a class="link" href="./${location.search}">‹ Schülerseite</a> · <span class="live">● live</span></span>
      <span class="werkzeuge">
        <label class="schalter"><input type="checkbox" id="anonym" ${anonym ? 'checked' : ''}> Namen ausblenden</label>
        <a class="knopf hell klein" href="#/besprechung">Besprechung</a>
        <button class="knopf hell klein" id="qr">Link &amp; QR-Code</button>
        <button class="knopf hell klein" id="csv">CSV</button>
        <button class="knopf gefahr klein" id="loeschen">Alles löschen</button>
        ${speicher.modus === 'firebase' ? '<button class="link" id="abmelden">Abmelden</button>' : ''}
      </span>
    </div>
    ${inhalt}`;
  app.querySelectorAll('details[data-key]').forEach(d => { if (offen.has(d.dataset.key)) d.open = true; });
  window.scrollTo(0, y);

  document.getElementById('anonym').onchange = e => { anonym = e.target.checked; merke('stl-anonym', anonym ? '1' : '0'); zeichne(); };
  document.getElementById('qr').onclick = zeigeQr;
  document.getElementById('csv').onclick = exportiereCsv;
  document.getElementById('loeschen').onclick = allesLoeschen;
  document.getElementById('abmelden')?.addEventListener('click', () => speicher.lehrkraftAbmelden());
  app.querySelector('[data-loesche]')?.addEventListener('click', e => eintragLoeschen(e.currentTarget.dataset.loesche));
}

/* ── Übersicht ── */
function uebersicht(liste) {
  const fertig = liste.filter(laufzettel).length;
  const quiz = STATIONEN.find(s => s.id === 'quiz');
  const quizAbgaben = stand.abgaben.filter(a => a.stationId === 'quiz' && a.maxPunkte);
  const quizSchnitt = quizAbgaben.length
    ? (quizAbgaben.reduce((n, a) => n + a.punkte, 0) / quizAbgaben.length).toFixed(1).replace('.', ',')
    : 'offen';

  const kopfZellen = STATIONEN.map((s, i) =>
    `<th class="mitte"><a href="#/station/${s.id}" title="${esc(s.titel)}">${i + 1}${s.art === 'pflicht' ? '<small>P</small>' : ''}</a></th>`).join('');

  const zeilen = liste.map(p => {
    const zellen = STATIONEN.map(s => {
      const a = p.abgaben[s.id];
      const e = p.entwuerfe[s.id];
      const hier = p.aktuelleStation === s.id;
      if (a) return `<td class="mitte zelle ok" title="${esc(s.titel)}, abgegeben">✓${a.maxPunkte ? `<small>${a.punkte}/${a.maxPunkte}</small>` : ''}</td>`;
      if (e) return `<td class="mitte zelle arbeit${hier ? ' hier' : ''}" title="${esc(s.titel)}, in Arbeit, ${e.beantwortet} von ${e.von} Aufgaben">${hier ? '●' : '✎'}<small>${e.beantwortet}/${e.von}</small></td>`;
      if (hier) return `<td class="mitte zelle hier" title="${esc(s.titel)}, gerade geöffnet">●</td>`;
      return '<td class="mitte zelle"></td>';
    }).join('');
    const lz = laufzettelStand(p);
    const nr = stationNr(p.aktuelleStation);
    return `<tr>
      <td><a href="#/person/${p.uid}">${esc(p.anzeige)}</a>
        <small class="zuletzt">${p.geraet ? `Gerät ${esc(p.geraet)} · ` : ''}${nr ? `bei Station ${nr}` : 'Übersicht'} · ${vorMinuten(p.zuletzt)}</small>
        ${p.selbesGeraet.length && !anonym ? `<small class="warnung">⚠ Auf diesem Gerät auch angemeldet als ${p.selbesGeraet.map(q => esc(q.name)).join(', ')}</small>` : ''}</td>
      ${zellen}
      <td class="mitte">${Object.keys(p.abgaben).length}/${STATIONEN.length}</td>
      <td class="mitte">${lz.fertig ? '<b>✓ erfüllt</b>' : `<small>P ${lz.pflichtFertig}/${lz.pflicht} · W ${Math.min(lz.wahl, REGELN.mindestWahl)}/${REGELN.mindestWahl}</small>`}</td></tr>`;
  }).join('');

  return `
    <header class="kopf"><h1 class="titel">Auswertung</h1>
      <p class="untertitel">${esc(KURS.titel)} · ${STATIONEN.length} Stationen</p></header>
    <div class="kennzahlen">
      <div class="karte"><div class="label">Angemeldet</div><div class="zahl">${liste.length}</div></div>
      <div class="karte"><div class="label">Abgaben</div><div class="zahl">${stand.abgaben.length}</div></div>
      <div class="karte"><div class="label">In Arbeit</div><div class="zahl">${stand.entwuerfe.length}</div></div>
      <div class="karte"><div class="label">Laufzettel erfüllt</div><div class="zahl">${fertig}<small> / ${liste.length}</small></div></div>
      ${quiz ? `<div class="karte"><div class="label">Abschlussquiz Ø</div><div class="zahl">${quizSchnitt}<small> / ${bewerte(quiz, {}).max}</small></div></div>` : ''}
    </div>
    ${liste.length ? `
    <div class="karte tabelle-rahmen">
      <table class="matrix">
        <thead><tr><th>Name</th>${kopfZellen}<th class="mitte">Abgegeben</th><th class="mitte">Laufzettel</th></tr></thead>
        <tbody>${zeilen}</tbody>
      </table>
      <p class="hinweis legende">✓ abgegeben (mit Punkten, wo es welche gibt) · ✎ angefangen, noch nicht abgegeben (bearbeitete Aufgaben) · ● gerade geöffnet · P Pflichtstation. Ein Klick auf einen Namen zeigt alle Eingaben dieser Person, ein Klick auf eine Stationsnummer die Auswertung der Station.</p>
    </div>` : `<div class="karte"><p>Noch niemand angemeldet. Über <b>Link &amp; QR-Code</b> kommt die Klasse auf die Seite.</p></div>`}
    <h2 class="abschnitt">Stationen</h2>
    <div class="raster">${STATIONEN.map((s, i) => {
      const n = stand.abgaben.filter(a => a.stationId === s.id).length;
      return `<a class="station-karte" href="#/station/${s.id}">
        <div class="oben"><span class="nr">${i + 1}</span><span class="marke ${s.art}">${s.art === 'pflicht' ? 'Pflicht' : 'Wahl'}</span></div>
        <h3>${esc(s.titel)}</h3><div class="unten"><span>${n} Abgabe${n === 1 ? '' : 'n'}</span><span>Auswertung ›</span></div></a>`;
    }).join('')}</div>`;
}

/* ── Station auswerten ── */
function balken(text, anzahl, gesamt, markiert = false) {
  const pct = gesamt ? Math.round(anzahl / gesamt * 100) : 0;
  return `<div class="balken-zeile${markiert ? ' loesung' : ''}">
    <div class="b-text">${markiert ? '<b>✓</b> ' : ''}${esc(text)}</div>
    <div class="b-spur"><i style="width:${pct}%"></i></div>
    <div class="b-zahl">${anzahl} <small>(${pct} %)</small></div></div>`;
}

function stationsAnsicht(station, liste, { besprechung = false } = {}) {
  const nameVon = new Map(liste.map(p => [p.uid, p.anzeige]));
  const abg = stand.abgaben.filter(a => a.stationId === station.id)
    .sort((a, b) => (nameVon.get(a.uid) || '').localeCompare(nameVon.get(b.uid) || '', 'de'));
  const n = abg.length;
  const nr = stationNr(station.id);
  const vor = STATIONEN[nr - 2], nach = STATIONEN[nr];
  // In der Besprechung nie Namen zeigen
  const wer = a => anonym || besprechung ? '' : `<b>${esc(nameVon.get(a.uid) || a.name)}</b> · `;

  let aufgabenNr = 0;
  const bloecke = alleAufgaben(station).map(a => {
    const nummer = ++aufgabenNr;
    const werte = abg.map(x => ({ x, w: (x.antworten || {})[a.id] }));
    let koerper = '';

    if (a.typ === 'mc' || a.typ === 'abstimmung') {
      const zaehl = a.optionen.map(() => 0);
      let beantwortet = 0;
      werte.forEach(({ w }) => {
        const gew = a.typ === 'abstimmung' ? [].concat(w?.wahl ?? []) : [].concat(w ?? []);
        if (gew.length) beantwortet++;
        gew.forEach(i => { if (zaehl[i] !== undefined) zaehl[i]++; });
      });
      const richtige = a.richtig !== undefined ? [].concat(a.richtig) : [];
      koerper = a.optionen.map((o, i) => balken(o, zaehl[i], beantwortet, richtige.includes(i))).join('');
      if (richtige.length && n) {
        const ok = abg.filter(x => bewerte(station, x.antworten || {}).je[a.id]?.richtig).length;
        koerper = `<p class="quote"><b>${ok} von ${n}</b> richtig</p>` + koerper;
      }
      if (a.typ === 'abstimmung' && a.begruendung) {
        const texte = werte.filter(({ w }) => w?.begruendung?.trim());
        koerper += `<div class="label abstand">${esc(a.begruendung)}</div>` + (texte.length
          ? `<ul class="antworten">${texte.map(({ x, w }) =>
              `<li>${wer(x)}<span class="wahl">${esc(a.optionen[w.wahl] ?? '')}</span> ${esc(w.begruendung)}</li>`).join('')}</ul>`
          : '<p class="hinweis">Noch keine Begründungen.</p>');
      }
    }

    if (a.typ === 'zuordnen') {
      koerper = a.elemente.map((e, i) => {
        const gewaehlt = werte.map(({ w }) => zuordnung(w, a.elemente.length)[i]).filter(Number.isInteger);
        const ok = gewaehlt.filter(k => k === e.richtig).length;
        const falsch = {};
        gewaehlt.filter(k => k !== e.richtig).forEach(k => { falsch[k] = (falsch[k] || 0) + 1; });
        const haeufig = Object.entries(falsch).sort((x, y) => y[1] - x[1])[0];
        return balken(`${e.text} → ${a.kategorien[e.richtig]}`, ok, gewaehlt.length) +
          (haeufig ? `<p class="hinweis fehlgriff">Häufigster Fehler ist ${esc(a.kategorien[haeufig[0]])} (${haeufig[1]}×)</p>` : '');
      }).join('');
      if (n) koerper = '<p class="hinweis">Die Balken zeigen, wie viele richtig zugeordnet haben.</p>' + koerper;
    }

    if (a.typ === 'freitext') {
      const texte = werte.filter(({ w }) => typeof w === 'string' && w.trim());
      koerper = texte.length
        ? `<ul class="antworten">${texte.map(({ x, w }) => `<li>${wer(x)}${esc(w)}</li>`).join('')}</ul>`
        : '<p class="hinweis">Noch keine Antworten.</p>';
    }

    return `<section class="aufgabe">
      <div class="a-kopf"><span class="nr">${nummer}</span><p class="a-text">${esc(a.auftrag)}</p></div>
      ${koerper}</section>`;
  }).join('');

  const hier = liste.filter(p => p.aktuelleStation === station.id && !p.abgaben[station.id]).length;
  const inArbeit = liste.filter(p => p.entwuerfe[station.id]);
  const arbeitsListe = inArbeit.length ? `<div class="karte">
      <div class="label">In Arbeit, noch nicht abgegeben</div>
      <p>${inArbeit.map(p => `<a class="link" href="#/person/${p.uid}">${esc(p.anzeige)}</a> <span class="hinweis">(${p.entwuerfe[station.id].beantwortet}/${p.entwuerfe[station.id].von})</span>`).join(' · ')}</p>
    </div>` : '';
  if (besprechung) {
    return `
    <header class="kopf station-kopf">
      <p class="eyebrow">Station ${nr} · ${esc(station.bezug)}</p>
      <h1 class="titel">${esc(station.titel)}</h1>
      <div class="meta"><span>${n} Abgabe${n === 1 ? '' : 'n'}</span></div>
    </header>
    ${renderMaterial(station)}
    ${bloecke}`;
  }
  return `
    <div class="kopfzeile"><a class="link" href="#/">‹ Übersicht</a>
      <span>${vor ? `<a class="link" href="#/station/${vor.id}">‹ Station ${nr - 1}</a>` : ''}
        ${nach ? ` · <a class="link" href="#/station/${nach.id}">Station ${nr + 1} ›</a>` : ''}</span></div>
    <header class="kopf station-kopf">
      <p class="eyebrow">Station ${nr} · ${esc(station.bezug)}</p>
      <h1 class="titel">${esc(station.titel)}</h1>
      <div class="meta"><span class="marke ${station.art}">${station.art === 'pflicht' ? 'Pflicht' : 'Wahl'}</span>
        <span>${n} Abgabe${n === 1 ? '' : 'n'}${hier ? ` · ${hier} gerade dabei` : ''}</span></div>
    </header>
    <details class="karte material" data-key="material-${station.id}"><summary>Material der Station</summary>${renderMaterial(station)}</details>
    ${arbeitsListe}
    ${bloecke}`;
}

/* ── Besprechung der Pflichtstationen am Beamer ── */
function besprechungsAnsicht(stationId, liste) {
  const pflicht = STATIONEN.filter(s => s.art === 'pflicht');
  const station = pflicht.find(s => s.id === stationId) || pflicht[0];
  const reiter = pflicht.map(s => `<a class="reiter${s === station ? ' an' : ''}" href="#/besprechung/${s.id}">${stationNr(s.id)} · ${esc(s.titel)}</a>`).join('');
  return `
    <div class="kopfzeile"><a class="link" href="#/">‹ Übersicht</a><span class="hinweis">Besprechung · ohne Namen</span></div>
    <nav class="reiterleiste">${reiter}</nav>
    <div class="besprechung">${stationsAnsicht(station, liste, { besprechung: true })}</div>`;
}

async function eintragLoeschen(uid) {
  const p = personen().find(x => x.uid === uid);
  if (!p) return;
  const ok = await frage(`Eintrag „${p.name}“ löschen?`,
    'Name, Abgaben und Zwischenstände dieser Anmeldung werden gelöscht. Das iPad springt zurück zur Namenseingabe. Der Gerätecode bleibt erhalten, damit du siehst, wenn auf demselben Gerät ein neuer Name eingegeben wird.',
    'Löschen', 'Abbrechen', true);
  if (!ok) return;
  try {
    await speicher.loescheTeilnehmer(uid);
    toast('Eintrag gelöscht.');
    location.hash = '#/';
  } catch (err) {
    console.error(err);
    toast('Löschen hat nicht geklappt.', 'fehler');
  }
}

/* ── Eine Person ── */
function personenAnsicht(p) {
  const teile = STATIONEN.map((s, i) => {
    const a = p.abgaben[s.id];
    const e = p.entwuerfe[s.id];
    if (!a && e) {
      return `<details class="karte person-station arbeit" data-key="${p.uid}-${s.id}">
        <summary><b>Station ${i + 1}: ${esc(s.titel)}</b>
          <span class="hinweis"> · ✎ in Arbeit, ${e.beantwortet} von ${e.von} Aufgaben bearbeitet · zuletzt ${vorMinuten(e.aktualisiert)}${p.aktuelleStation === s.id ? ' · ● gerade geöffnet' : ''}</span></summary>
        <p class="hinweis abstand-unten">Zwischenstand, noch nicht abgegeben. Deshalb ohne Lösungen.</p>
        <div class="gesperrt">${renderAufgaben(s, e.antworten || {}, { gesperrt: true })}</div>
      </details>`;
    }
    if (!a) {
      return `<div class="karte offen"><b>Station ${i + 1}: ${esc(s.titel)}</b>
        <span class="hinweis"> · ${p.aktuelleStation === s.id ? '● gerade geöffnet, noch nichts eingegeben' : 'noch nicht bearbeitet'}</span></div>`;
    }
    const erg = bewerte(s, a.antworten || {});
    const zeit = uhrzeit(a.abgegebenAm);
    return `<details class="karte person-station" data-key="${p.uid}-${s.id}">
      <summary><b>Station ${i + 1}: ${esc(s.titel)}</b>
        <span class="hinweis"> · ✓ abgegeben${zeit ? ` ${zeit} Uhr` : ''}${erg.max ? ` · ${erg.punkte}/${erg.max} Punkte` : ''}</span></summary>
      <div class="gesperrt">${renderAufgaben(s, a.antworten || {}, { gesperrt: true, ergebnis: erg })}</div>
    </details>`;
  }).join('');
  return `
    <div class="kopfzeile"><a class="link" href="#/">‹ Übersicht</a><span></span></div>
    <header class="kopf"><p class="eyebrow">Ergebnisse</p><h1 class="titel">${esc(p.anzeige)}</h1>
      <p class="untertitel">${Object.keys(p.abgaben).length} von ${STATIONEN.length} Stationen abgegeben${Object.keys(p.entwuerfe).length ? ` · ${Object.keys(p.entwuerfe).length} in Arbeit` : ''}
        · ${laufzettel(p) ? 'Laufzettel erfüllt ✓' : (() => { const lz = laufzettelStand(p); return `Laufzettel offen (Pflicht ${lz.pflichtFertig}/${lz.pflicht}, Wahl ${Math.min(lz.wahl, REGELN.mindestWahl)}/${REGELN.mindestWahl})`; })()}
        <br><span class="hinweis">${p.geraet ? `Gerät ${esc(p.geraet)} · ` : ''}${stationNr(p.aktuelleStation) ? `Gerade bei Station ${stationNr(p.aktuelleStation)}` : 'Gerade in der Übersicht'} · zuletzt aktiv ${vorMinuten(p.zuletzt)}</span></p></header>
    ${p.selbesGeraet.length ? `<div class="karte warnkarte"><div class="label">Weitere Namen auf Gerät ${esc(p.geraet)}</div>
      <p>${p.selbesGeraet.map(q => `<a class="link" href="#/person/${q.uid}">${esc(anonym ? q.anzeige : q.name)}</a> <span class="hinweis">(zuletzt ${vorMinuten(q.zuletzt)})</span>`).join(' · ')}</p></div>` : ''}
    <div class="karte loeschkarte"><p class="hinweis">Unpassender Name? Der Gerätecode steht klein auf dem iPad neben dem Namen.</p>
      <button class="knopf gefahr klein" data-loesche="${p.uid}">Diesen Eintrag löschen</button></div>
    ${teile}`;
}

/* ── Link und QR-Code für den Beamer ── */
function ladeQrBibliothek() {
  if (window.QRCode) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function zeigeQr() {
  const url = schuelerLink();
  const hg = document.createElement('div');
  hg.className = 'dialog-hg';
  hg.innerHTML = `<div class="dialog qr-dialog" role="dialog" aria-modal="true">
    <p class="eyebrow">${esc(KURS.eyebrow)}</p>
    <h2>${esc(KURS.titel)}</h2>
    <div id="qrFeld" class="qr-feld"></div>
    <p class="qr-url">${esc(url)}</p>
    <div class="knoepfe"><button class="knopf hell" id="kopieren">Link kopieren</button><button class="knopf" id="zu">Schließen</button></div>
  </div>`;
  document.body.appendChild(hg);
  const zu = () => hg.remove();
  hg.addEventListener('click', e => { if (e.target === hg) zu(); });
  hg.querySelector('#zu').onclick = zu;
  hg.querySelector('#kopieren').onclick = async () => {
    try { await navigator.clipboard.writeText(url); toast('Link kopiert.'); }
    catch { toast('Kopieren ist nicht möglich. Bitte den Link markieren.', 'fehler'); }
  };
  try {
    await ladeQrBibliothek();
    new window.QRCode(hg.querySelector('#qrFeld'), {
      text: url, width: 300, height: 300, colorDark: '#003560', colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.M,
    });
  } catch {
    hg.querySelector('#qrFeld').innerHTML = '<p class="hinweis">Der QR-Code konnte nicht geladen werden. Der Link darunter funktioniert trotzdem.</p>';
  }
}

/* ── CSV-Export ── */
function exportiereCsv() {
  const liste = personen();
  const name = new Map(liste.map(p => [p.uid, p.name]));
  const zeilen = [['Name', 'Gerät', 'Station', 'Status', 'Aufgabe', 'Auftrag', 'Antwort', 'Bewertung', 'Zeit']];
  const geraetVon = new Map(liste.map(p => [p.uid, p.geraet || '']));
  STATIONEN.forEach((s, si) => {
    const eintraege = [
      ...stand.abgaben.filter(a => a.stationId === s.id).map(a => ({ ...a, status: 'abgegeben', zeit: a.abgegebenAm })),
      ...stand.entwuerfe.filter(e => e.stationId === s.id).map(e => ({ ...e, status: 'in Arbeit', zeit: e.aktualisiert })),
    ];
    eintraege.forEach(a => {
      const erg = a.status === 'abgegeben' ? bewerte(s, a.antworten || {}) : { je: {} };
      let nr = 0;
      alleAufgaben(s).forEach(auf => {
        const bew = erg.je[auf.id];
        zeilen.push([
          name.get(a.uid) || a.name || '',
          geraetVon.get(a.uid) || '',
          `${si + 1} ${s.titel}`,
          a.status,
          String(++nr),
          auf.auftrag,
          antwortText(auf, (a.antworten || {})[auf.id]),
          bew ? (auf.typ === 'zuordnen' ? `${bew.punkte}/${auf.elemente.length}` : bew.richtig ? 'richtig' : 'falsch') : '',
          a.zeit ? new Date(a.zeit).toLocaleString('de-DE') : '',
        ]);
      });
    });
  });
  // Ein führendes = + - @ würde Excel als Formel ausführen
  const feld = f => {
    const s = String(f ?? '');
    return `"${(/^[=+\-@]/.test(s) ? "'" + s : s).replace(/"/g, '""')}"`;
  };
  const csv = '﻿' + zeilen.map(z => z.map(feld).join(';')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = `stationenlernen-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/* ── Löschen ── */
async function allesLoeschen() {
  const ok = await frage('Alle Ergebnisse löschen?',
    `Das löscht ${stand.teilnehmer.length} Anmeldungen, ${stand.abgaben.length} Abgaben und ${stand.entwuerfe.length} Zwischenstände endgültig. Wer die Ergebnisse behalten will, lädt vorher die CSV herunter.`,
    'Endgültig löschen', 'Abbrechen', true);
  if (!ok) return;
  try {
    await speicher.allesLoeschen();
    toast('Alles gelöscht.');
    location.hash = '#/';
  } catch (err) {
    console.error(err);
    toast('Löschen fehlgeschlagen.', 'fehler');
  }
}

start();
