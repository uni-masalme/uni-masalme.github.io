/* ==================================================
   config.js — Verbindung zum Firebase-Projekt

   Projekt: stationslernen. Ohne databaseURL speichert die Seite in
   Firestore (Regeln: firestore.rules), mit databaseURL in der Realtime
   Database (Regeln: database.rules.json). Der apiKey ist kein Geheimnis.
   Mit firebaseConfig = null oder ?demo in der Adresse läuft die Seite
   im Demo-Modus (alles nur im Browser).
================================================== */

export const firebaseConfig = {
  apiKey:            "AIzaSyBWcXzfQCQvTqkVqRqiE0LoUvIW8xH6soY",
  authDomain:        "stationslernen.firebaseapp.com",
  projectId:         "stationslernen",
  storageBucket:     "stationslernen.firebasestorage.app",
  messagingSenderId: "978357282229",
  appId:             "1:978357282229:web:f0b5ecf0455def32c425fc",
  // Realtime Database in europe-west1 (Belgien). Ohne diese Zeile nähme die Seite Firestore.
  databaseURL:       "https://stationslernen-default-rtdb.europe-west1.firebasedatabase.app",
};

/* Firebase über jsdelivr statt gstatic.com — kommt durch Schul- und Uni-Filter.
   Version nicht einfach hochsetzen: jsdelivr bündelt jedes Modul mit seiner eigenen
   Kopie des App-Kerns. Nur wenn app, auth, database und firestore denselben Kern laden,
   finden sie sich ("Service database is not available"). 12.18.0 passt (alle vier 0.16.1),
   12.19.0 nicht (database bringt 0.16.1, app 0.16.2). */
export const FIREBASE_CDN = 'https://cdn.jsdelivr.net/npm/firebase@12.18.0';
