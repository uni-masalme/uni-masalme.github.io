/* ==================================================
   speicher.js — Datenablage

   Drei Umsetzungen mit derselben Schnittstelle:
   - Firebase Realtime Database + Auth, wenn config.js eine databaseURL hat
   - Firestore + Auth, wenn config.js keine databaseURL hat
   - Demo im localStorage (ohne Config oder mit ?demo in der Adresse)

   Aufbau der Realtime Database (Firestore: siehe dort)
     teilnehmer/{uid}                  name, aktuelleStation, zuletzt
     abgaben/{uid}/{stationId}         name, antworten, punkte, maxPunkte, abgegebenAm
     entwuerfe/{uid}/{stationId}       antworten, beantwortet, von, aktualisiert —
                                       Zwischenstand vor der Abgabe, damit die
                                       Lehrkraft live mitlesen kann
   Nach außen tragen Abgaben und Entwürfe zusätzlich uid und stationId.
   Zeitstempel gibt die Schnittstelle als Millisekunden heraus.
================================================== */

import { firebaseConfig, FIREBASE_CDN } from './config.js';

const ZEITLIMIT = 15000;

/* ?demo in der Adresse erzwingt den Demo-Modus — zum Ausprobieren,
   ohne Testdaten in die echte Datenbank zu schreiben */
export async function oeffneSpeicher() {
  const demo = new URLSearchParams(location.search).has('demo');
  if (!firebaseConfig || demo) return demoSpeicher();
  // Mit databaseURL die Realtime Database, sonst Firestore
  return firebaseConfig.databaseURL ? rtdbSpeicher() : firestoreSpeicher();
}

/* Fester Code für dieses Gerät (genauer: diesen Browser). Er bleibt beim Ab- und
   Wiederanmelden gleich und steht klein auf der Schülerseite. So lässt sich in der
   Auswertung nachvollziehen, auf welchem iPad ein Name eingegeben wurde. Den
   Gerätenamen („iPad von …“) gibt Safari an Webseiten nicht heraus. */
const GERAET_KEY = 'stl-geraet';
let geraetCache = null;
export function geraetCode() {
  if (geraetCache) return geraetCache;
  try { geraetCache = localStorage.getItem(GERAET_KEY); } catch { /* privater Modus */ }
  if (!geraetCache) {
    const zeichen = 'ACDEFGHJKLMNPRTUVWXY34679';   // ohne leicht verwechselbare Zeichen
    geraetCache = Array.from({ length: 4 }, () => zeichen[Math.floor(Math.random() * zeichen.length)]).join('');
    try { localStorage.setItem(GERAET_KEY, geraetCache); } catch { /* dann gilt er nur für diese Sitzung */ }
  }
  return geraetCache;
}

function mitZeitlimit(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('zeitlimit')), ZEITLIMIT)),
  ]);
}

/* ══ FIREBASE (Realtime Database + Auth) ═════════ */

/* Fehlercodes der Realtime Database auf die Schreibweise von Auth bringen,
   damit die Seiten nur eine Form prüfen müssen */
function normalisiereFehler(err) {
  if (err && err.code === 'PERMISSION_DENIED') err.code = 'permission-denied';
  if (err && /permission.denied/i.test(err.message || '') && !err.code) err.code = 'permission-denied';
  return err;
}

async function rtdbSpeicher() {
  const [{ initializeApp }, A, D] = await Promise.all([
    import(`${FIREBASE_CDN}/app/+esm`),
    import(`${FIREBASE_CDN}/auth/+esm`),
    import(`${FIREBASE_CDN}/database/+esm`),
  ]);

  const app  = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db   = D.getDatabase(app);
  const ref  = pfad => D.ref(db, pfad);
  const jetzt = () => D.serverTimestamp();
  const schreib = async promise => { try { return await promise; } catch (e) { throw normalisiereFehler(e); } };

  const ersterAuthStand = new Promise(resolve => {
    const stop = A.onAuthStateChanged(auth, user => { stop(); resolve(user); });
  });

  let ich = null;   // { uid, name } der angemeldeten Schülerin / des Schülers

  return {
    modus: 'firebase',

    /* ── Schülerseite ── */

    async aktuellerTeilnehmer() {
      const user = await ersterAuthStand;
      if (!user || !user.isAnonymous) return null;
      const snap = await D.get(ref(`teilnehmer/${user.uid}`));
      if (!snap.exists()) return null;
      ich = { uid: user.uid, name: snap.val().name };
      return ich;
    },

    async anmelden(name) {
      let user = auth.currentUser;
      if (user && !user.isAnonymous) { await A.signOut(auth); user = null; }
      if (!user) user = (await mitZeitlimit(A.signInAnonymously(auth))).user;
      await mitZeitlimit(schreib(D.update(ref(`teilnehmer/${user.uid}`), {
        name, geraet: geraetCode(), aktuelleStation: null, zuletzt: jetzt(),
      })));
      ich = { uid: user.uid, name };
      return ich;
    },

    async abmelden() {
      ich = null;
      await A.signOut(auth);
    },

    meineAbgaben(callback, fehler) {
      return D.onValue(ref(`abgaben/${ich.uid}`), snap => {
        const map = {};
        Object.entries(snap.val() || {}).forEach(([stationId, a]) => {
          map[stationId] = { ...a, uid: ich.uid, stationId };
        });
        callback(map);
      }, err => fehler?.(normalisiereFehler(err)));
    },

    async setzeAktuelleStation(stationId) {
      if (!ich) return;
      // name mitschicken: legt den Eintrag neu an, falls die Lehrkraft gelöscht hat
      await schreib(D.update(ref(`teilnehmer/${ich.uid}`), {
        name: ich.name, geraet: geraetCode(), aktuelleStation: stationId, zuletzt: jetzt(),
      }));
    },

    /* Meldet, ob der eigene Eintrag noch existiert (die Lehrkraft kann ihn löschen) */
    beobachteMich(callback) {
      return D.onValue(ref(`teilnehmer/${ich.uid}`), snap => callback(snap.exists()), () => {});
    },

    async speichereEntwurf(stationId, antworten, beantwortet, von) {
      if (!ich) return;
      await schreib(D.set(ref(`entwuerfe/${ich.uid}/${stationId}`), {
        antworten, beantwortet, von, aktualisiert: jetzt(),
      }));
    },

    async loescheEntwurf(stationId) {
      if (!ich) return;
      await schreib(D.remove(ref(`entwuerfe/${ich.uid}/${stationId}`)));
    },

    async abgeben(stationId, antworten, punkte, maxPunkte) {
      await mitZeitlimit(schreib(D.set(ref(`abgaben/${ich.uid}/${stationId}`), {
        name: ich.name, antworten, punkte, maxPunkte, abgegebenAm: jetzt(),
      })));
    },

    /* ── Lehrkraft ── */

    lehrkraftStatus(callback) {
      return A.onAuthStateChanged(auth, user =>
        callback(user && !user.isAnonymous ? { email: user.email, uid: user.uid } : null));
    },

    async lehrkraftAnmelden(email, passwort) {
      await mitZeitlimit(A.signInWithEmailAndPassword(auth, email, passwort));
    },

    async lehrkraftGoogle() {
      await A.signInWithPopup(auth, new A.GoogleAuthProvider());
    },

    async lehrkraftAbmelden() {
      await A.signOut(auth);
    },

    beobachteAlles(callback, fehler) {
      const stand = { teilnehmer: null, abgaben: null, entwuerfe: null };
      const melde = () => { if (stand.teilnehmer && stand.abgaben && stand.entwuerfe) callback({ ...stand }); };
      const fehlerFn = err => fehler?.(normalisiereFehler(err));
      // abgaben/{uid}/{stationId} und entwuerfe/{uid}/{stationId} flach machen
      const flach = baum => Object.entries(baum || {}).flatMap(([uid, stationen]) =>
        Object.entries(stationen || {}).map(([stationId, e]) => ({ ...e, uid, stationId })));

      const stops = [
        D.onValue(ref('teilnehmer'), snap => {
          stand.teilnehmer = Object.entries(snap.val() || {}).map(([uid, t]) =>
            ({ uid, name: t.name || '', geraet: t.geraet || null, aktuelleStation: t.aktuelleStation || null, zuletzt: t.zuletzt || null }));
          melde();
        }, fehlerFn),
        D.onValue(ref('abgaben'), snap => { stand.abgaben = flach(snap.val()); melde(); }, fehlerFn),
        D.onValue(ref('entwuerfe'), snap => { stand.entwuerfe = flach(snap.val()); melde(); }, fehlerFn),
      ];
      return () => stops.forEach(stop => stop());
    },

    async allesLoeschen() {
      // ein Schreibvorgang über drei Pfade: alles oder nichts
      await schreib(D.update(ref('/'), { teilnehmer: null, abgaben: null, entwuerfe: null }));
    },

    async loescheTeilnehmer(uid) {
      await schreib(D.update(ref('/'), {
        [`teilnehmer/${uid}`]: null, [`abgaben/${uid}`]: null, [`entwuerfe/${uid}`]: null,
      }));
    },
  };
}

/* ══ FIREBASE (Firestore + Auth) ══════════════════
   Sammlungen: teilnehmer/{uid}, abgaben/{uid}_{stationId},
   entwuerfe/{uid}_{stationId} — Regeln in firestore.rules */

async function firestoreSpeicher() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`${FIREBASE_CDN}/app/+esm`),
    import(`${FIREBASE_CDN}/auth/+esm`),
    import(`${FIREBASE_CDN}/firestore/+esm`),
  ]);

  const app  = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db   = F.getFirestore(app);

  const ms = t => (t && t.toMillis ? t.toMillis() : null);
  const lies = d => d.data({ serverTimestamps: 'estimate' });

  const ersterAuthStand = new Promise(resolve => {
    const stop = A.onAuthStateChanged(auth, user => { stop(); resolve(user); });
  });

  let ich = null;

  return {
    modus: 'firebase',

    async aktuellerTeilnehmer() {
      const user = await ersterAuthStand;
      if (!user || !user.isAnonymous) return null;
      const snap = await F.getDoc(F.doc(db, 'teilnehmer', user.uid));
      if (!snap.exists()) return null;
      ich = { uid: user.uid, name: snap.data().name };
      return ich;
    },

    async anmelden(name) {
      let user = auth.currentUser;
      if (user && !user.isAnonymous) { await A.signOut(auth); user = null; }
      if (!user) user = (await mitZeitlimit(A.signInAnonymously(auth))).user;
      await mitZeitlimit(F.setDoc(F.doc(db, 'teilnehmer', user.uid), {
        name, geraet: geraetCode(), aktuelleStation: null, zuletzt: F.serverTimestamp(),
      }, { merge: true }));
      ich = { uid: user.uid, name };
      return ich;
    },

    async abmelden() {
      ich = null;
      await A.signOut(auth);
    },

    meineAbgaben(callback, fehler) {
      const q = F.query(F.collection(db, 'abgaben'), F.where('uid', '==', ich.uid));
      return F.onSnapshot(q, snap => {
        const map = {};
        snap.docs.forEach(d => {
          const a = lies(d);
          map[a.stationId] = { ...a, abgegebenAm: ms(a.abgegebenAm) };
        });
        callback(map);
      }, fehler);
    },

    async setzeAktuelleStation(stationId) {
      if (!ich) return;
      await F.setDoc(F.doc(db, 'teilnehmer', ich.uid), {
        name: ich.name, geraet: geraetCode(), aktuelleStation: stationId, zuletzt: F.serverTimestamp(),
      }, { merge: true });
    },

    beobachteMich(callback) {
      return F.onSnapshot(F.doc(db, 'teilnehmer', ich.uid), snap => callback(snap.exists()), () => {});
    },

    async speichereEntwurf(stationId, antworten, beantwortet, von) {
      if (!ich) return;
      await F.setDoc(F.doc(db, 'entwuerfe', `${ich.uid}_${stationId}`), {
        uid: ich.uid, stationId, antworten, beantwortet, von, aktualisiert: F.serverTimestamp(),
      });
    },

    async loescheEntwurf(stationId) {
      if (!ich) return;
      await F.deleteDoc(F.doc(db, 'entwuerfe', `${ich.uid}_${stationId}`));
    },

    async abgeben(stationId, antworten, punkte, maxPunkte) {
      await mitZeitlimit(F.setDoc(F.doc(db, 'abgaben', `${ich.uid}_${stationId}`), {
        uid: ich.uid, name: ich.name, stationId, antworten, punkte, maxPunkte,
        abgegebenAm: F.serverTimestamp(),
      }));
    },

    lehrkraftStatus(callback) {
      return A.onAuthStateChanged(auth, user =>
        callback(user && !user.isAnonymous ? { email: user.email, uid: user.uid } : null));
    },

    async lehrkraftAnmelden(email, passwort) {
      await mitZeitlimit(A.signInWithEmailAndPassword(auth, email, passwort));
    },

    async lehrkraftGoogle() {
      await A.signInWithPopup(auth, new A.GoogleAuthProvider());
    },

    async lehrkraftAbmelden() {
      await A.signOut(auth);
    },

    beobachteAlles(callback, fehler) {
      const stand = { teilnehmer: null, abgaben: null, entwuerfe: null };
      const melde = () => { if (stand.teilnehmer && stand.abgaben && stand.entwuerfe) callback({ ...stand }); };
      const stops = [
        F.onSnapshot(F.collection(db, 'teilnehmer'), snap => {
          stand.teilnehmer = snap.docs.map(d => {
            const t = lies(d);
            return { uid: d.id, name: t.name || '', geraet: t.geraet || null, aktuelleStation: t.aktuelleStation || null, zuletzt: ms(t.zuletzt) };
          });
          melde();
        }, fehler),
        F.onSnapshot(F.collection(db, 'abgaben'), snap => {
          stand.abgaben = snap.docs.map(d => { const a = lies(d); return { ...a, abgegebenAm: ms(a.abgegebenAm) }; });
          melde();
        }, fehler),
        F.onSnapshot(F.collection(db, 'entwuerfe'), snap => {
          stand.entwuerfe = snap.docs.map(d => { const e = lies(d); return { ...e, aktualisiert: ms(e.aktualisiert) }; });
          melde();
        }, fehler),
      ];
      return () => stops.forEach(stop => stop());
    },

    async allesLoeschen() {
      for (const name of ['abgaben', 'entwuerfe', 'teilnehmer']) {
        const snap = await F.getDocs(F.collection(db, name));
        for (let i = 0; i < snap.docs.length; i += 400) {
          const batch = F.writeBatch(db);
          snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      }
    },

    async loescheTeilnehmer(uid) {
      const batch = F.writeBatch(db);
      batch.delete(F.doc(db, 'teilnehmer', uid));
      for (const name of ['abgaben', 'entwuerfe']) {
        const snap = await F.getDocs(F.query(F.collection(db, name), F.where('uid', '==', uid)));
        snap.docs.forEach(d => batch.delete(d.ref));
      }
      await batch.commit();
    },
  };
}

/* ══ DEMO (localStorage) ═════════════════════════ */

function demoSpeicher() {
  const DB_KEY  = 'stl-demo-db';
  const UID_KEY = 'stl-demo-uid';
  const hoerer = new Set();

  const lese = () => {
    const leer = { teilnehmer: {}, abgaben: {}, entwuerfe: {} };
    try { return { ...leer, ...JSON.parse(localStorage.getItem(DB_KEY)) }; }
    catch { return leer; }
  };
  const schreibe = db => {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* voll oder gesperrt */ }
    hoerer.forEach(f => f());
  };
  const meineUid = () => { try { return localStorage.getItem(UID_KEY); } catch { return null; } };

  // Änderungen aus anderen Tabs (Schülerseite ↔ Auswertung)
  window.addEventListener('storage', e => { if (e.key === DB_KEY) hoerer.forEach(f => f()); });

  const beobachte = f => { hoerer.add(f); f(); return () => hoerer.delete(f); };

  let ich = null;

  return {
    modus: 'demo',

    async aktuellerTeilnehmer() {
      const uid = meineUid();
      const t = uid && lese().teilnehmer[uid];
      ich = t ? { uid, name: t.name } : null;
      return ich;
    },

    async anmelden(name) {
      let uid = meineUid();
      if (!uid) {
        uid = 'demo-' + Math.random().toString(36).slice(2, 10);
        try { localStorage.setItem(UID_KEY, uid); } catch { /* ohne Speicher bleibt es bei dieser Sitzung */ }
      }
      const db = lese();
      db.teilnehmer[uid] = { ...(db.teilnehmer[uid] || {}), name, geraet: geraetCode(), aktuelleStation: null, zuletzt: Date.now() };
      schreibe(db);
      ich = { uid, name };
      return ich;
    },

    async abmelden() {
      ich = null;
      try { localStorage.removeItem(UID_KEY); } catch { /* egal */ }
    },

    meineAbgaben(callback) {
      return beobachte(() => {
        const map = {};
        Object.values(lese().abgaben).forEach(a => { if (ich && a.uid === ich.uid) map[a.stationId] = a; });
        callback(map);
      });
    },

    async setzeAktuelleStation(stationId) {
      if (!ich) return;
      const db = lese();
      db.teilnehmer[ich.uid] = { ...(db.teilnehmer[ich.uid] || {}), name: ich.name, geraet: geraetCode(), aktuelleStation: stationId, zuletzt: Date.now() };
      schreibe(db);
    },

    beobachteMich(callback) {
      const uid = ich.uid;
      return beobachte(() => callback(!!lese().teilnehmer[uid]));
    },

    async speichereEntwurf(stationId, antworten, beantwortet, von) {
      if (!ich) return;
      const db = lese();
      db.entwuerfe[`${ich.uid}_${stationId}`] = { uid: ich.uid, stationId, antworten, beantwortet, von, aktualisiert: Date.now() };
      schreibe(db);
    },

    async loescheEntwurf(stationId) {
      if (!ich) return;
      const db = lese();
      delete db.entwuerfe[`${ich.uid}_${stationId}`];
      schreibe(db);
    },

    async abgeben(stationId, antworten, punkte, maxPunkte) {
      const db = lese();
      const id = `${ich.uid}_${stationId}`;
      if (db.abgaben[id]) throw Object.assign(new Error('schon abgegeben'), { code: 'permission-denied' });
      db.abgaben[id] = { uid: ich.uid, name: ich.name, stationId, antworten, punkte, maxPunkte, abgegebenAm: Date.now() };
      schreibe(db);
    },

    lehrkraftStatus(callback) {
      callback({ email: 'Demo-Modus', uid: 'demo' });
      return () => {};
    },
    async lehrkraftAnmelden() {},
    async lehrkraftGoogle() {},
    async lehrkraftAbmelden() {},

    beobachteAlles(callback) {
      return beobachte(() => {
        const db = lese();
        callback({
          teilnehmer: Object.entries(db.teilnehmer).map(([uid, t]) => ({ uid, ...t })),
          abgaben: Object.values(db.abgaben),
          entwuerfe: Object.values(db.entwuerfe),
        });
      });
    },

    async allesLoeschen() {
      schreibe({ teilnehmer: {}, abgaben: {}, entwuerfe: {} });
    },

    async loescheTeilnehmer(uid) {
      const db = lese();
      delete db.teilnehmer[uid];
      for (const name of ['abgaben', 'entwuerfe']) {
        Object.keys(db[name]).forEach(k => { if (k.startsWith(uid + '_')) delete db[name][k]; });
      }
      schreibe(db);
    },
  };
}
