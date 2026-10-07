# Stationenlernen · Entscheidungen (Kl. 9)

Digitales Stationenlernen zum Abschluss der Reihe *Entscheidungen*: zwölf Stationen, davon acht zu den Stunden der Reihe, drei allgemeine (Reue, eigenes Entscheiden, wer mitentscheidet) und das Abschlussquiz. Die Schülerinnen und Schüler melden sich mit dem Vornamen an, wählen Stationen, bearbeiten sie und geben sie ab. Die Lehrkraft sieht live, wer wo arbeitet, was schon eingegeben ist und was abgegeben wurde.

| Seite | Adresse | für |
|---|---|---|
| Stationen | `https://uni-masalme.github.io/philosophie/stationenlernen/` | Klasse (Link oder QR-Code) |
| Auswertung | `https://uni-masalme.github.io/philosophie/stationenlernen/admin.html` (Knopf **Admin** auf der Schülerseite) | Lehrkraft |

Eingetragen ist das Firebase-Projekt `stationslernen-9`. Mit **`?demo`** hinter der Adresse (`…/stationenlernen/?demo`) läuft die Seite im Demo-Modus: Alles bleibt im eigenen Browser, nichts landet in der Datenbank. Das ist zum Ausprobieren gedacht.

## Dateien

```
index.html          Schülerseite: Anmeldung → Laufzettel und Stationen → Station → Abgabe mit Lösung
admin.html          Auswertung: Übersicht, je Station, je Person, QR-Code, CSV, Löschen
js/stationen.js     ALLE INHALTE — Stationen, Material, Aufgaben, Lösungen, Laufzettel-Regel
js/config.js        Firebase-Zugangsdaten (leer = Demo-Modus)
js/speicher.js      Firestore, Realtime Database oder Demo-Speicher
js/aufgaben.js      Aufgabentypen darstellen, einsammeln, bewerten
js/schueler.js      Ablauf der Schülerseite
js/lehrkraft.js     Ablauf der Auswertung
css/                stil.css (Styleguide der Arbeitsblätter) und auswertung.css
firestore.rules     Sicherheitsregeln für Firestore
database.rules.json Sicherheitsregeln für die Realtime Database
```

## Firebase einrichten (einmalig)

Projekt `stationslernen`, die Zugangsdaten stehen in `js/config.js`. Gespeichert wird in **Firestore** oder in der **Realtime Database**: Ohne `databaseURL` in `config.js` nimmt die Seite Firestore, mit `databaseURL` die Realtime Database.

1. **Datenbank anlegen**, eine von beiden:
   - *Firestore Database → Datenbank erstellen*, Standort **europe-west3 (Frankfurt)**, **Produktionsmodus**. Regeln: `firestore.rules`.
   - *Realtime Database → Datenbank erstellen*, Standort **europe-west1 (Belgien)**, gesperrter Modus, und die Adresse als `databaseURL` in `config.js` eintragen. Regeln: `database.rules.json`.

   Der Standort lässt sich später nicht mehr ändern.
2. **Anmeldung einschalten:** *Build → Authentication → Jetzt starten → Sign-in method*:
   - **Anonym** aktivieren (für die Klasse, ohne Konto oder E-Mail).
   - **E-Mail/Passwort** aktivieren (für die Lehrkraft).
3. **Lehrkraft-Konto anlegen:** *Authentication → Users → Nutzer hinzufügen* mit eigener E-Mail und Passwort. Danach die **Nutzer-UID** kopieren.
4. **Regeln setzen:** Die passende Regeldatei aus Schritt 1 vollständig unter *Regeln* der Datenbank einfügen, jedes `LEHRKRAFT_UID` durch die kopierte UID ersetzen und **veröffentlichen**. Meldet man sich in der Auswertung mit Google an, entsteht ein zweites Konto mit eigener UID, auch bei gleicher E-Mail. Dann müssen beide UIDs in die Regeln, wie jetzt eingetragen. Die Auswertung zeigt die UID des angemeldeten Kontos an, wenn sie fehlt. **Nach jeder Änderung an der Regeldatei erneut einfügen.** Die Datei auf GitHub wirkt nicht von selbst.
5. **Domain freigeben:** *Authentication → Settings → Autorisierte Domains → `uni-masalme.github.io` hinzufügen*.

Der `apiKey` in `config.js` ist kein Geheimnis, er steht bei jeder Firebase-Webseite im Quelltext. Geschützt werden die Daten durch die Regeln aus Schritt 4: Schülerinnen und Schüler können nur ihre eigenen Einträge schreiben und lesen, jede Station nur einmal abgeben und eine Abgabe danach nicht mehr ändern. Alles lesen und löschen darf nur das Konto aus Schritt 3. **Ohne Regeln (Testmodus) kann jeder die ganze Datenbank lesen und schreiben.**

**Probelauf:** Die Schülerseite in einem privaten Fenster öffnen, eine Station abgeben, die Auswertung prüfen und danach in der Auswertung *Alles löschen* wählen.

## In der Stunde

1. *Auswertung* öffnen, anmelden, **Link & QR-Code** auf den Beamer.
2. Die Klasse meldet sich mit dem Vornamen an. Der Laufzettel verlangt alle drei Pflichtstationen und mindestens eine Wahlstation. Die Zahl steht als `mindestWahl` in `js/stationen.js`. Jede Station hat sechs Aufgaben, das Quiz dreizehn Fragen.
3. Die Matrix zeigt live: ✓ abgegeben (mit Punkten), ✎ angefangen (bearbeitete Aufgaben, zum Beispiel 2/4), ● gerade geöffnet. Darunter steht bei jedem Namen, wo die Person gerade ist und wann sie zuletzt aktiv war. Ein Klick auf den Namen zeigt alle Eingaben, auch die noch nicht abgegebenen. Die Zwischenstände werden etwa alle drei Sekunden übertragen, und die Schülerinnen und Schüler sehen unter jeder Station den Hinweis, dass die Lehrkraft mitlesen kann.
4. Für die Besprechung: Eine Stationsnummer anklicken zeigt die Verteilung bei Ankreuz- und Abstimmungsaufgaben und alle Freitexte. Vorher **Namen ausblenden** einschalten, wenn es an den Beamer geht.
5. Die letzten 20 Minuten gehören der Besprechung der Pflichtstationen. Dafür in der Auswertung **Besprechung** öffnen. Die Ansicht zeigt die Ergebnisse der Pflichtstationen groß und immer ohne Namen, oben lassen sich die Stationen umschalten.
6. Nach der Stunde **CSV** herunterladen (öffnet sich in Excel, mit Spalte *Status*: abgegeben / in Arbeit) und dann **Alles löschen**.

Entwürfe speichert jedes Gerät für sich zwischen. Ein versehentliches Neuladen kostet also nichts. Nach dem Abgeben ist die Station gesperrt, und die Lösungen werden angezeigt.

## Inhalte ändern

Alles steht in `js/stationen.js`, oben ist erklärt, welche Felder es gibt. Texte, Aufgaben und Lösungen lassen sich dort ändern, ohne den restlichen Code anzufassen. Die `id` einer Station oder Aufgabe nach dem ersten Einsatz nicht mehr ändern, weil die gespeicherten Abgaben darauf verweisen. Die Auswertung rechnet die Punkte immer neu nach dem aktuellen Lösungsschlüssel.

Nach dem Hochladen auf GitHub dauert es ein bis zwei Minuten, bis die Seite aktualisiert ist. Browser halten alte Dateien bis zu zehn Minuten im Cache.

## Datenschutz

- Gespeichert werden nur der eingegebene Vorname, die Antworten und Zeitstempel. Die Klasse braucht kein Konto und keine E-Mail-Adresse.
- Die Daten liegen bei Google Firebase am Standort der Datenbank (Schritt 1). Für Schülernamen sollte das ein EU-Standort sein.
- Nach der Auswertung löschen (*Alles löschen*). Die CSV enthält die Vornamen und gehört deshalb nicht in den Vault oder in ein Repository.

## Lokal ansehen

ES-Module laufen nicht über `file://`. Aus dem Repository-Ordner:

```
python -m http.server 8765
```

Dann `http://localhost:8765/philosophie/stationenlernen/` öffnen.

## Gerätecode und unpassende Namen

Safari gibt den Namen eines iPads („iPad von …“) nicht an Webseiten heraus. Deshalb bekommt jedes Gerät beim ersten Öffnen einen festen Code aus vier Zeichen, zum Beispiel `K7F2`. Er steht klein auf der Schülerseite neben dem Namen und bleibt gleich, auch wenn sich jemand ab- und mit einem anderen Namen wieder anmeldet. Nur wer die Website-Daten in Safari löscht, bekommt einen neuen Code.

In der Auswertung steht der Code unter jedem Namen. Wurden auf einem Gerät mehrere Namen benutzt, erscheint ein Hinweis mit allen Namen. Ein Klick auf den Namen öffnet die Person, dort lässt sich der Eintrag mit **Diesen Eintrag löschen** entfernen. Das iPad springt dann zurück zur Namenseingabe.

Die Regeln in `database.rules.json` erlauben das Feld `geraet`. Wer die Regeln aus einer älteren Fassung eingefügt hat, muss sie neu einfügen, sonst scheitert die Anmeldung.
