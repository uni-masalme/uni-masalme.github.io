/* ==================================================
   schueler.js — Schülerseite
   Anmeldung mit Vornamen → Stationsübersicht mit
   Laufzettel → Station bearbeiten → abgeben.
   Entwürfe bleiben im Browser, bis abgegeben ist.
================================================== */

import { oeffneSpeicher, geraetCode } from './speicher.js';
import { KURS, REGELN, STATIONEN } from './stationen.js';
import { renderMaterial, renderAufgaben, bindeEingaben, bewerte, fehlende, istBeantwortet, alleAufgaben, esc } from './aufgaben.js';
import { toast, frage } from './ui.js';

const app = document.getElementById('app');
const banner = document.getElementById('banner');

let speicher = null;
let ich = null;          // { uid, name }
let abgaben = {};        // stationId → Abgabe
let ansicht = '';        // 'uebersicht' | 'station'
let stopAbgaben = null;
let stopIch = null;          // beobachtet, ob die Lehrkraft den eigenen Eintrag gelöscht hat
let zwischenTimer = null;    // verzögertes Senden des Zwischenstands
let zwischenSenden = null;   // ausstehender Sendevorgang, falls die Seite verlassen wird

const ZWISCHENSTAND_MS = 2500;

function sendeAusstehendes() {
  clearTimeout(zwischenTimer);
  const f = zwischenSenden;
  zwischenSenden = null;
  f?.();
}
function verwirfAusstehendes() {
  clearTimeout(zwischenTimer);
  zwischenSenden = null;
}
document.addEventListener('visibilitychange', () => { if (document.hidden) sendeAusstehendes(); });

/* ── Entwürfe im Browser (lokal) und als Zwischenstand für die Lehrkraft ── */
const entwurfKey = id => `stl-entwurf-${ich.uid}-${id}`;
function ladeLokal(id) {
  try { return JSON.parse(localStorage.getItem(entwurfKey(id))) || null; } catch { return null; }
}
function merkeLokal(id, antworten) {
  try { localStorage.setItem(entwurfKey(id), JSON.stringify(antworten)); } catch { /* privater Modus */ }
}
function vergissLokal(id) {
  try { localStorage.removeItem(entwurfKey(id)); } catch { /* egal */ }
}

/* ── Start ── */
async function start() {
  try {
    speicher = await oeffneSpeicher();
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="banner fehler">Keine Verbindung zum Server. Prüfe das WLAN und lade die Seite neu.</div>`;
    return;
  }
  if (speicher.modus === 'demo') {
    banner.hidden = false;
    banner.textContent = 'Demo-Modus. Die Antworten bleiben nur in diesem Browser und gehen nicht an die Lehrkraft.';
  }
  try {
    ich = await speicher.aktuellerTeilnehmer();
  } catch (err) {
    console.error(err);
    ich = null;
  }
  window.addEventListener('hashchange', route);
  if (ich) starteSitzung(); else zeigeAnmeldung();
}

function starteSitzung() {
  stopAbgaben?.();
  stopIch?.();
  let warDa = false;
  stopIch = speicher.beobachteMich(da => {
    if (da) { warDa = true; return; }
    if (warDa) zurueckgesetzt();
  });
  ansicht = '';
  app.innerHTML = '<p class="laden">Lade deine Stationen …</p>';
  // Erst nach dem ersten Stand der Abgaben zeichnen, sonst wirkt eine
  // abgegebene Station kurz wieder offen
  let geladen = false;
  stopAbgaben = speicher.meineAbgaben(map => {
    abgaben = map;
    if (!geladen) { geladen = true; route(); }
    else if (ansicht === 'uebersicht') zeigeUebersicht();
  }, err => {
    console.error(err);
    toast('Die Verbindung ist unterbrochen. Lade die Seite neu, falls nichts mehr geht.', 'fehler');
    if (!geladen) { geladen = true; route(); }
  });
}

function route() {
  sendeAusstehendes();
  if (!ich) return zeigeAnmeldung();
  const m = location.hash.match(/^#\/station\/([\w-]+)/);
  const station = m && STATIONEN.find(s => s.id === m[1]);
  if (station) zeigeStation(station);
  else zeigeUebersicht();
}

/* ── Anmeldung ── */
function zeigeAnmeldung() {
  ansicht = 'anmeldung';
  app.innerHTML = `
    <div class="anmeldung">
      <p class="eyebrow">${esc(KURS.eyebrow)}</p>
      <h1 class="titel">${esc(KURS.titel)}</h1>
      <p class="untertitel">${esc(KURS.leitfrage)}</p>
      <form id="anmeldeForm" autocomplete="off">
        <label for="name">Dein Vorname</label>
        <input id="name" class="feld-eingabe" maxlength="30" required
               autocapitalize="words" spellcheck="false" enterkeyhint="go">
        <p class="hinweis">Nur der Vorname. Gibt es ihn zweimal in der Klasse, hänge den ersten Buchstaben deines Nachnamens an.</p>
        <button class="knopf" type="submit">Los geht’s</button>
      </form>
      <div class="admin-zeile"><span class="geraet">Gerät ${esc(geraetCode())}</span>
        <a class="knopf hell klein" href="admin.html${location.search}">Admin</a></div>
    </div>`;
  const form = document.getElementById('anmeldeForm');
  const feld = document.getElementById('name');
  feld.focus();
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = feld.value.replace(/\s+/g, ' ').trim();
    if (name.length < 2) { toast('Bitte gib deinen Vornamen ein.', 'fehler'); return; }
    const knopf = form.querySelector('button');
    knopf.disabled = true; knopf.textContent = 'Einen Moment …';
    try {
      ich = await speicher.anmelden(name);
      history.replaceState(null, '', location.pathname + location.search);
      starteSitzung();
    } catch (err) {
      console.error(err);
      // Einrichtungsfehler in Firebase sind kein WLAN-Problem
      const einrichtung = ['auth/configuration-not-found', 'auth/operation-not-allowed', 'auth/admin-restricted-operation'];
      toast(einrichtung.includes(err.code)
        ? 'Die Anmeldung ist auf dem Server noch nicht freigeschaltet. Sag bitte der Lehrkraft Bescheid.'
        : err.code === 'permission-denied'
          ? 'Der Server hat die Anmeldung abgelehnt. Sag bitte der Lehrkraft Bescheid.'
          : 'Anmelden hat nicht geklappt. Prüfe das WLAN und versuche es noch einmal.', 'fehler');
      knopf.disabled = false; knopf.textContent = 'Los geht’s';
    }
  });
}

/* Die Lehrkraft hat den Eintrag gelöscht, zum Beispiel wegen eines unpassenden Namens */
function zurueckgesetzt() {
  verwirfAusstehendes();
  stopAbgaben?.(); stopAbgaben = null;
  stopIch?.(); stopIch = null;
  ich = null; abgaben = {};
  history.replaceState(null, '', location.pathname + location.search);
  zeigeAnmeldung();
  toast('Die Lehrkraft hat deinen Eintrag gelöscht. Melde dich bitte mit deinem Vornamen neu an.', 'fehler');
}

async function abmelden() {
  const ok = await frage('Abmelden?',
    'Melde dich nur ab, wenn jemand anderes dieses Gerät benutzen soll. Deine Abgaben bleiben bei der Lehrkraft gespeichert, du kannst danach aber nicht mehr weiterarbeiten.',
    'Abmelden', 'Angemeldet bleiben', true);
  if (!ok) return;
  sendeAusstehendes();
  stopAbgaben?.(); stopAbgaben = null;
  stopIch?.(); stopIch = null;
  await speicher.abmelden();
  ich = null; abgaben = {};
  history.replaceState(null, '', location.pathname + location.search);
  zeigeAnmeldung();
}

/* ── Übersicht ── */
function laufzettel() {
  const pflicht = STATIONEN.filter(s => s.art === 'pflicht');
  const pflichtFertig = pflicht.filter(s => abgaben[s.id]).length;
  const wahlFertig = STATIONEN.filter(s => s.art !== 'pflicht' && abgaben[s.id]).length;
  const soll = pflicht.length + REGELN.mindestWahl;
  const ist = pflichtFertig + Math.min(wahlFertig, REGELN.mindestWahl);
  return { pflicht: pflicht.length, pflichtFertig, wahlFertig, soll, ist, fertig: ist >= soll };
}

function zeigeUebersicht() {
  const warStation = ansicht === 'station';
  ansicht = 'uebersicht';
  if (warStation) speicher.setzeAktuelleStation(null).catch(() => {});
  const lz = laufzettel();

  const karten = STATIONEN.map((s, i) => {
    const abg = abgaben[s.id];
    const entwurf = !abg && ladeLokal(s.id);
    let status = '<span class="status">offen</span>';
    if (abg) status = `<span class="status ok">✓ abgegeben${abg.maxPunkte ? ` · ${abg.punkte}/${abg.maxPunkte}` : ''}</span>`;
    else if (entwurf) status = '<span class="status entwurf">✎ angefangen</span>';
    return `<a class="station-karte${abg ? ' erledigt' : ''}" href="#/station/${s.id}">
        <div class="oben"><span class="nr">${i + 1}</span>
          <span class="marke ${s.art}">${s.art === 'pflicht' ? 'Pflicht' : 'Wahl'}</span></div>
        <h3>${esc(s.titel)}</h3>
        <p class="kurz">${esc(s.kurz)}</p>
        <div class="unten"><span>${esc(s.bezug)}</span>${status}</div>
      </a>`;
  }).join('');

  app.innerHTML = `
    <div class="kopfzeile"><span>Angemeldet als <b>${esc(ich.name)}</b> <span class="geraet">· Gerät ${esc(geraetCode())}</span></span>
      <span class="werkzeuge"><button class="link" id="abmelden">Abmelden</button>
        <a class="knopf hell klein" href="admin.html${location.search}">Admin</a></span></div>
    <header class="kopf">
      <p class="eyebrow">${esc(KURS.eyebrow)}</p>
      <h1 class="titel">${esc(KURS.titel)}</h1>
      <p class="untertitel">${esc(KURS.leitfrage)}</p>
    </header>
    <div class="karte laufzettel${lz.fertig ? ' fertig' : ''}">
      <div class="stand">
        <div class="label">Laufzettel</div>
        <p>${lz.fertig
          ? '<b>✓ Geschafft.</b> Du kannst weitere Wahlstationen bearbeiten.'
          : `Bearbeite <b>alle ${lz.pflicht} Pflichtstationen</b> und <b>mindestens ${REGELN.mindestWahl === 1 ? 'eine Wahlstation' : `${REGELN.mindestWahl} Wahlstationen`}</b>. Die Reihenfolge wählst du selbst.`}
          Die Pflichtstationen besprechen wir am Ende der Stunde gemeinsam.</p>
        <div class="balken" role="progressbar" aria-valuemin="0" aria-valuemax="${lz.soll}" aria-valuenow="${lz.ist}">
          <i style="width:${Math.round(lz.ist / lz.soll * 100)}%"></i></div>
      </div>
      <div class="hinweis">Pflicht ${lz.pflichtFertig}/${lz.pflicht}<br>Wahl ${lz.wahlFertig}/${REGELN.mindestWahl}</div>
    </div>
    <div class="raster">${karten}</div>`;

  document.getElementById('abmelden').addEventListener('click', abmelden);
}

/* ── Station ── */
function stationsKopf(station) {
  const nr = STATIONEN.indexOf(station) + 1;
  return `
    <div class="kopfzeile"><a class="link" href="#/">‹ Alle Stationen</a><span>${esc(ich.name)}</span></div>
    <header class="kopf station-kopf">
      <p class="eyebrow">Station ${nr} · ${esc(station.bezug)}</p>
      <h1 class="titel">${esc(station.titel)}</h1>
      <div class="meta"><span class="marke ${station.art}">${station.art === 'pflicht' ? 'Pflicht' : 'Wahl'}</span></div>
    </header>`;
}

function zeigeStation(station) {
  ansicht = 'station';
  window.scrollTo(0, 0);
  const abg = abgaben[station.id];
  if (abg) return zeigeErgebnis(station, abg);

  speicher.setzeAktuelleStation(station.id).catch(() => {});
  const antworten = ladeLokal(station.id) || {};

  // Quiz: Fortschrittsleiste rechts wie im Heterogenität-Test
  const quiz = station.layout === 'quiz';
  const gezaehlt = alleAufgaben(station).filter(a => !a.optional);
  const aufgabenHtml = `<div id="aufgaben">${renderAufgaben(station, antworten)}</div>`;

  app.innerHTML = stationsKopf(station) + `
    ${renderMaterial(station)}
    ${quiz ? `<div class="content-grid">${aufgabenHtml}
        <aside class="progress-rail" aria-hidden="true">
          <div class="progress-label" id="fortschrittText"></div>
          <div class="progress-track"><div class="progress-fill" id="fortschrittFill"></div></div>
        </aside></div>` : aufgabenHtml}
    <div class="abgabe">
      <span class="hinweis" id="entwurfHinweis">Deine Eingaben werden laufend gespeichert. Die Lehrkraft kann deinen Zwischenstand sehen.</span>
      <button class="knopf" id="abgeben">Station abgeben</button>
    </div>`;

  const fortschritt = () => {
    if (!quiz) return;
    const n = gezaehlt.filter(a => istBeantwortet(a, antworten[a.id])).length;
    document.getElementById('fortschrittText').textContent = `${n} / ${gezaehlt.length}`;
    document.getElementById('fortschrittFill').style.height = `${n / gezaehlt.length * 100}%`;
  };
  fortschritt();

  let timer = null;
  bindeEingaben(document.getElementById('aufgaben'), station, antworten, () => {
    fortschritt();
    clearTimeout(timer);
    timer = setTimeout(() => merkeLokal(station.id, antworten), 300);
    // Zwischenstand gebündelt an die Lehrkraft, nicht bei jedem Tastendruck
    zwischenSenden = () => {
      const n = gezaehlt.filter(a => istBeantwortet(a, antworten[a.id])).length;
      speicher.speichereEntwurf(station.id, JSON.parse(JSON.stringify(antworten)), n, gezaehlt.length)
        .catch(err => console.warn('Zwischenstand nicht gesendet', err));
    };
    clearTimeout(zwischenTimer);
    zwischenTimer = setTimeout(sendeAusstehendes, ZWISCHENSTAND_MS);
  });

  document.getElementById('abgeben').addEventListener('click', () => abgeben(station, antworten));
}

async function abgeben(station, antworten) {
  const offen = fehlende(station, antworten);
  document.querySelectorAll('.aufgabe.fehlt').forEach(el => el.classList.remove('fehlt'));
  if (offen.length) {
    offen.forEach(id => document.getElementById(`aufgabe-${id}`)?.classList.add('fehlt'));
    document.getElementById(`aufgabe-${offen[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast(offen.length === 1 ? 'Eine Aufgabe fehlt noch.' : `${offen.length} Aufgaben fehlen noch.`, 'fehler');
    return;
  }
  const ok = await frage('Station abgeben?',
    'Danach kannst du an dieser Station nichts mehr ändern. Du siehst dann, was richtig war.',
    'Abgeben', 'Noch nicht');
  if (!ok) return;

  const knopf = document.getElementById('abgeben');
  knopf.disabled = true; knopf.textContent = 'Wird gesendet …';
  verwirfAusstehendes();   // sonst legt ein später Zwischenstand den Entwurf neu an
  const { punkte, max } = bewerte(station, antworten);
  // Abgabe ohne leere Felder speichern
  const sauber = JSON.parse(JSON.stringify(antworten));

  try {
    await speicher.abgeben(station.id, sauber, punkte, max);
  } catch (err) {
    console.error(err);
    if (err.code === 'permission-denied' && abgaben[station.id]) {
      toast('Diese Station hast du schon abgegeben.');
      return zeigeErgebnis(station, abgaben[station.id]);
    }
    toast('Senden hat nicht geklappt. Prüfe das WLAN und versuche es noch einmal.', 'fehler');
    knopf.disabled = false; knopf.textContent = 'Station abgeben';
    return;
  }
  vergissLokal(station.id);
  speicher.loescheEntwurf(station.id).catch(() => {});
  speicher.setzeAktuelleStation(null).catch(() => {});
  const abgabe = { stationId: station.id, antworten: sauber, punkte, maxPunkte: max };
  abgaben = { ...abgaben, [station.id]: abgabe };
  zeigeErgebnis(station, abgabe, true);
}

function zeigeErgebnis(station, abgabe, frisch = false) {
  ansicht = 'station';
  window.scrollTo(0, 0);
  const ergebnis = bewerte(station, abgabe.antworten || {});
  const lz = laufzettel();
  app.innerHTML = stationsKopf(station) + `
    <div class="karte ergebnis">
      ${ergebnis.max ? `<span class="punkte">${ergebnis.punkte}/${ergebnis.max}</span>` : ''}
      <div><b>${frisch ? '✓ Abgegeben.' : '✓ Diese Station hast du abgegeben.'}</b><br>
        <span class="hinweis">${ergebnis.max ? 'Unten siehst du, was richtig war.' : 'Hier gibt es kein Richtig oder Falsch. Deine Antworten liest die Lehrkraft.'}
        ${lz.fertig ? ' Dein Laufzettel ist erfüllt.' : ''}</span></div>
    </div>
    ${renderMaterial(station)}
    <div class="gesperrt">${renderAufgaben(station, abgabe.antworten || {}, { gesperrt: true, ergebnis })}</div>
    <div class="abgabe"><span></span><a class="knopf" href="#/">Zur Übersicht</a></div>`;
}

start();
