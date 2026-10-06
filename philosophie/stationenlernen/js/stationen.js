/* ==================================================
   stationen.js — Inhalte des Stationenlernens
   Reihe „Entscheidungen“ (Kl. 9), Abschlussstunde

   Hier stehen alle Texte. Code muss für inhaltliche
   Änderungen nicht angefasst werden.

   Aufgabentypen
     freitext    { auftrag, zeilen }
     mc          { auftrag, optionen[], richtig: Index | [Indizes], erklaerung?, thema? }
                 ohne „richtig“ wird nicht bewertet; mehrfach:true erlaubt mehrere Kreuze;
                 thema erscheint im Quiz-Layout als Überzeile der Frage
     abstimmung  { auftrag, optionen[], begruendung? }   keine richtige Antwort
     zuordnen    { auftrag, kategorien[], elemente[{ text, richtig: Index der Kategorie }] }

   Ids einer Station oder Aufgabe nach dem ersten Einsatz
   nicht mehr ändern — die Abgaben verweisen darauf.
================================================== */

export const KURS = {
  eyebrow: 'Philosophie · Klasse 9 · Entscheidungen',
  titel: 'Stationenlernen',
  leitfrage: 'Wie treffen wir Entscheidungen – und wer entscheidet eigentlich?',
};

/* Laufzettel: alle Pflichtstationen und mindestens so viele Wahlstationen */
export const REGELN = { mindestWahl: 2 };

export const STATIONEN = [

  /* ── 1 ─────────────────────────────────────────── */
  {
    id: 'brieffoeffner',
    titel: 'Brieföffner, Fels, Mensch',
    bezug: 'Sartre',
    art: 'pflicht',
    minuten: 12,
    kurz: 'Was unterscheidet einen Menschen von einem Gegenstand?',
    material: [
      { typ: 'info', label: 'Zur Erinnerung',
        text: 'Jean-Paul Sartre (1905–1980) behauptet: <b>„Die Existenz geht dem Wesen voraus.“</b> Ein Brieföffner wird nach einem Plan hergestellt. Bevor es ihn gibt, steht schon fest, wozu er da ist. Beim Menschen ist es umgekehrt: Er ist zuerst da und macht danach selbst etwas aus sich.' },
    ],
    aufgaben: [
      { id: 'a', typ: 'zuordnen',
        auftrag: 'Ordne jede Aussage dem zu, worauf sie passt.',
        kategorien: ['Brieföffner', 'Fels', 'Mensch'],
        elemente: [
          { text: 'Jemand hat vorher festgelegt, wozu es da ist.', richtig: 0 },
          { text: 'Niemand hat es hergestellt, aber andere geben ihm eine Bedeutung.', richtig: 1 },
          { text: 'Es legt selbst fest, wer es sein will.', richtig: 2 },
          { text: 'Es wurde nach einem Rezept hergestellt.', richtig: 0 },
          { text: 'Für den Kletterer ist es ein Hindernis, für die Wanderin ein Rastplatz.', richtig: 1 },
          { text: 'Es ist zuerst da und bestimmt sich erst danach.', richtig: 2 },
        ] },
      { id: 'b', typ: 'mc',
        auftrag: 'Kreuze an, was Sartre mit „Die Existenz geht dem Wesen voraus“ meint.',
        optionen: [
          'Jeder Mensch hat von Geburt an eine feste Bestimmung.',
          'Der Mensch ist wie ein Werkzeug, das einen Zweck erfüllen soll.',
          'Der Mensch ist zuerst da und macht erst dann etwas aus sich.',
          'Was aus einem Menschen wird, legen seine Eltern fest.',
        ],
        richtig: 2,
        erklaerung: 'Für Sartre gibt es keinen Bauplan des Menschen. Was ein Mensch ist, ergibt sich erst aus dem, was er aus sich macht.' },
      { id: 'c', typ: 'freitext', zeilen: 4,
        auftrag: 'Erkläre in eigenen Worten, worin sich ein Mensch von einem Brieföffner unterscheidet.' },
    ],
    zusatz: { id: 'z', typ: 'freitext', zeilen: 3,
      auftrag: 'Wer gibt dem Fels seine Bedeutung – und wer gibt dir deine? Beantworte beide Fragen in zwei Sätzen.' },
  },

  /* ── 2 ─────────────────────────────────────────── */
  {
    id: 'sechs',
    titel: 'Dieselbe Sechs',
    bezug: 'Sartre',
    art: 'wahl',
    minuten: 10,
    kurz: 'Woher kommt die Bedeutung einer Note?',
    material: [
      { typ: 'fall', label: 'Fall',
        text: 'In der Mathearbeit gibt es mehrere Sechsen. Es ist jedes Mal dieselbe Note – und trotzdem bedeutet sie nicht für alle dasselbe.' },
    ],
    aufgaben: [
      { id: 'a', typ: 'freitext', zeilen: 5,
        auftrag: 'Finde zwei Menschen, für die dieselbe Sechs etwas Gutes bedeutet. Erkläre jeweils, warum.' },
      { id: 'b', typ: 'mc',
        auftrag: 'Kreuze an, woher die Bedeutung der Sechs kommt.',
        optionen: [
          'Aus dem, was ein Mensch vorhat und was ihm wichtig ist.',
          'Aus der Note selbst – eine Sechs ist immer schlecht.',
          'Nur aus der Meinung der Lehrkraft.',
        ],
        richtig: 0,
        erklaerung: 'Die Note ist für alle gleich. Was sie bedeutet, hängt davon ab, was jemand mit seinem Leben vorhat.' },
      { id: 'c', typ: 'freitext', zeilen: 3,
        auftrag: 'Nenne etwas aus deinem Alltag, das für dich etwas anderes bedeutet als für deine Freunde. Erkläre, woran das liegt.' },
    ],
    zusatz: { id: 'z', typ: 'freitext', zeilen: 3,
      auftrag: 'Gilt das auch für eine Eins? Begründe deine Antwort.' },
  },

  /* ── 3 ─────────────────────────────────────────── */
  {
    id: 'ausreden',
    titel: 'Ausreden auf dem Prüfstand',
    bezug: 'Sartre',
    art: 'wahl',
    minuten: 12,
    kurz: 'Kann man sich vor einer Entscheidung drücken?',
    material: [
      { typ: 'merke', label: 'Sartre',
        text: 'Wir sind <b>zur Freiheit verurteilt</b>. Wir können nicht nicht entscheiden: Auch wer nichts tut, hat sich entschieden. Und für das, was wir wählen, tragen wir die Verantwortung.' },
    ],
    aufgaben: [
      { id: 'a', typ: 'zuordnen',
        auftrag: 'Ordne jede Ausrede zu: Worauf schiebt die Person die Verantwortung?',
        kategorien: ['auf andere', 'auf die Umstände', 'auf den eigenen Charakter'],
        elemente: [
          { text: '„Das machen doch alle.“', richtig: 0 },
          { text: '„Ich hatte keine Zeit.“', richtig: 1 },
          { text: '„So bin ich halt.“', richtig: 2 },
          { text: '„Meine Freunde wollten das so.“', richtig: 0 },
          { text: '„Der Bus kam zu spät.“', richtig: 1 },
          { text: '„Ich bin einfach kein Mathe-Typ.“', richtig: 2 },
        ] },
      { id: 'b', typ: 'mc',
        auftrag: 'Kreuze die Ausrede an, die Sartres Satz „Die Existenz geht dem Wesen voraus“ am deutlichsten widerspricht.',
        optionen: [
          '„Der Bus kam zu spät.“',
          '„Meine Freunde wollten das so.“',
          '„Ich hatte keine Zeit.“',
          '„So bin ich halt.“',
        ],
        richtig: 3,
        erklaerung: 'Wer „So bin ich halt“ sagt, tut so, als hätte er ein festes Wesen – wie ein Brieföffner. Genau das bestreitet Sartre.' },
      { id: 'c', typ: 'freitext', zeilen: 4,
        auftrag: 'Wähle eine Ausrede, die du selbst schon benutzt hast. Schreibe auf, was Sartre dir darauf antworten würde.' },
    ],
    zusatz: { id: 'z', typ: 'freitext', zeilen: 3,
      auftrag: '„Ich habe mich gar nicht entschieden, ich habe einfach nichts gemacht.“ Erkläre, warum Sartre das nicht gelten lässt.' },
  },

  /* ── 4 ─────────────────────────────────────────── */
  {
    id: 'strategien',
    titel: 'Wie entscheidest du?',
    bezug: 'Gute Entscheidungen',
    art: 'wahl',
    minuten: 10,
    kurz: 'Strategien, mit denen Menschen zu einer Entscheidung kommen',
    material: [
      { typ: 'info', label: 'Zur Erinnerung',
        text: 'In der Stunde „Gute Entscheidungen“ habt ihr gesammelt, wie Menschen zu ihren Entscheidungen kommen: aus dem Bauch, mit Pro und Contra, indem sie andere fragen, nach Werten und Regeln, aus Gewohnheit oder durch Zufall.' },
    ],
    aufgaben: [
      { id: 'a', typ: 'zuordnen',
        auftrag: 'Ordne jede Situation der Strategie zu, die die Person benutzt.',
        kategorien: ['Bauchgefühl', 'Pro und Contra', 'Andere fragen', 'Werte und Regeln', 'Gewohnheit', 'Zufall'],
        elemente: [
          { text: 'Mia wirft eine Münze: Pizza oder Nudeln?', richtig: 5 },
          { text: 'Jonas schreibt auf, was für und was gegen den Nebenjob spricht.', richtig: 1 },
          { text: 'Elif fragt ihre große Schwester, welches Praktikum sie nehmen soll.', richtig: 2 },
          { text: 'Noah gibt die gefundene Geldbörse ab, weil man das so macht.', richtig: 3 },
          { text: 'Sara nimmt beim Bäcker dasselbe wie jeden Morgen.', richtig: 4 },
          { text: 'Ben hat bei der neuen Klasse sofort ein gutes Gefühl und wechselt.', richtig: 0 },
        ] },
      { id: 'b', typ: 'abstimmung',
        auftrag: 'Welche Strategie benutzt du am häufigsten?',
        optionen: ['Bauchgefühl', 'Pro und Contra', 'Andere fragen', 'Werte und Regeln', 'Gewohnheit', 'Zufall'],
        begruendung: 'Nenne ein Beispiel aus deinem Alltag.' },
      { id: 'c', typ: 'freitext', zeilen: 3,
        auftrag: 'Nenne eine Strategie, die bei großen Entscheidungen schlecht funktioniert. Begründe deine Wahl.' },
    ],
    zusatz: { id: 'z', typ: 'freitext', zeilen: 3,
      auftrag: 'Ist „Ich entscheide einfach gar nicht“ auch eine Strategie? Begründe mit Sartre.' },
  },

  /* ── 5 ─────────────────────────────────────────── */
  {
    id: 'kriterien',
    titel: 'Kriterien abwägen',
    bezug: 'Gute Entscheidungen',
    art: 'pflicht',
    minuten: 15,
    kurz: 'Welcher Vorteil wiegt schwerer?',
    material: [
      { typ: 'merke', label: 'Kriterien',
        liste: [
          ['Dauer', 'Wie lange wirkt die Folge?'],
          ['Wichtigkeit', 'Wie wichtig ist mir das?'],
          ['Wahrscheinlichkeit', 'Wie sicher tritt die Folge ein?'],
          ['Betroffene', 'Betrifft es nur mich oder auch andere?'],
        ] },
      { typ: 'fall', label: 'Fall',
        text: 'Lina (15) kann samstags im Supermarkt jobben und 60 € pro Woche verdienen. Samstags ist aber auch Training, und ihr Team braucht sie für die Meisterschaft. Ihre Eltern finden, Geld für den Führerschein wäre sinnvoll. Ob der Job ihr Spaß machen würde, weiß Lina nicht.' },
    ],
    aufgaben: [
      { id: 'a', typ: 'zuordnen',
        auftrag: 'Ordne jeden Gedanken von Lina dem Kriterium zu, das darin steckt.',
        kategorien: ['Dauer', 'Wichtigkeit', 'Wahrscheinlichkeit', 'Betroffene'],
        elemente: [
          { text: 'Vom Führerschein habe ich noch jahrelang etwas.', richtig: 0 },
          { text: 'Fußball ist mir wichtiger als fast alles andere.', richtig: 1 },
          { text: 'Ob mir der Job gefällt, weiß ich gar nicht.', richtig: 2 },
          { text: 'Ohne mich hat mein Team zu wenig Spielerinnen.', richtig: 3 },
          { text: 'Die Meisterschaft gibt es nur in dieser Saison.', richtig: 0 },
          { text: 'Vielleicht gewinnen wir die Meisterschaft sowieso nicht.', richtig: 2 },
        ] },
      { id: 'b', typ: 'abstimmung',
        auftrag: 'Wie würdest du an Linas Stelle entscheiden?',
        optionen: ['Den Job annehmen', 'Beim Training bleiben', 'Etwas anderes'],
        begruendung: 'Nenne das Kriterium, das bei dir den Ausschlag gibt, und begründe.' },
      { id: 'c', typ: 'mc',
        auftrag: 'Zwei Personen benutzen dieselben Kriterien und entscheiden trotzdem verschieden. Kreuze an, woran das liegt.',
        optionen: [
          'Eine von beiden hat sich verrechnet.',
          'Sie gewichten die Kriterien unterschiedlich.',
          'Kriterien helfen beim Entscheiden überhaupt nicht.',
          'Nur eine von beiden kennt alle Vor- und Nachteile.',
        ],
        richtig: 1,
        erklaerung: 'Die Kriterien sagen, worauf man achten kann. Wie schwer sie wiegen, entscheidet jede und jeder selbst.' },
    ],
    zusatz: { id: 'z', typ: 'freitext', zeilen: 4,
      auftrag: 'Denke dir einen eigenen Fall aus, in dem sich die Kriterien widersprechen. Beschreibe ihn kurz.' },
  },

  /* ── 6 ─────────────────────────────────────────── */
  {
    id: 'klaviertaste',
    titel: 'Klaviertaste oder Mensch?',
    bezug: 'Dostojewski',
    art: 'wahl',
    minuten: 12,
    kurz: 'Handeln wir immer nach unserem Vorteil?',
    material: [
      { typ: 'info', label: 'Zum Text',
        text: 'Fjodor M. Dostojewski (1821–1881) schrieb 1864 die <i>Aufzeichnungen aus dem Kellerloch</i>. Damals glaubten viele: Mit Vernunft und Wissenschaft kann man ausrechnen, was für jeden Menschen das Beste ist. Dann würde jeder automatisch danach handeln – wie eine Klaviertaste, die immer gleich klingt, wenn man sie drückt. Der Erzähler des Buches widerspricht.' },
      { typ: 'zitat',
        text: 'Was der Mensch braucht, ist einzig und allein ein selbständiges Wollen, was auch immer diese Selbständigkeit kosten und wohin auch immer sie führen mag.',
        quelle: 'Dostojewski, Aufzeichnungen aus dem Kellerloch (1864)' },
    ],
    aufgaben: [
      { id: 'a', typ: 'mc',
        auftrag: 'Kreuze an, was für den Erzähler der „vorteilhafteste Vorteil“ ist.',
        optionen: [
          'Möglichst viel Geld und Erfolg zu haben.',
          'Immer das zu tun, was die Vernunft ausrechnet.',
          'Nach dem eigenen Willen zu handeln.',
          'Anderen Menschen zu helfen.',
        ],
        richtig: 2,
        erklaerung: 'Der Erzähler will selbst entscheiden – notfalls sogar gegen seinen eigenen Vorteil.' },
      { id: 'b', typ: 'mc',
        auftrag: 'Kreuze an, warum der Erzähler keine Klaviertaste sein will.',
        optionen: [
          'Eine Taste reagiert immer gleich, wenn man sie drückt – sie hat keinen eigenen Willen.',
          'Eine Taste wird von vielen verschiedenen Menschen benutzt.',
          'Eine Taste macht nur einen einzigen Ton.',
        ],
        richtig: 0,
        erklaerung: 'Wäre alles ausgerechnet, würden wir nur noch reagieren. Einen eigenen Willen hätten wir dann nicht mehr.' },
      { id: 'c', typ: 'abstimmung',
        auftrag: 'Angenommen, du weißt genau, was das Beste für dich ist: Handelst du dann auch danach?',
        optionen: ['Immer', 'Meistens', 'Eher selten'],
        begruendung: 'Begründe mit einem Beispiel.' },
      { id: 'd', typ: 'freitext', zeilen: 4,
        auftrag: 'Eine Kuh im Stall wird gefüttert und ist ruhig und satt. Beurteile, ob das für dich ein gutes Leben wäre. Beziehe dich auf den Erzähler.' },
    ],
    zusatz: { id: 'z', typ: 'freitext', zeilen: 3,
      auftrag: 'Der Erzähler findet sogar „zweimal zwei ist fünf“ manchmal reizvoll. Erkläre, warum jemand das wollen könnte.' },
  },

  /* ── 7 ─────────────────────────────────────────── */
  {
    id: 'dilemma',
    titel: 'Ein schwieriger Fall',
    bezug: 'Gute Entscheidungen',
    art: 'wahl',
    minuten: 12,
    kurz: 'Austausch oder Freundschaft – wie würdest du entscheiden?',
    material: [
      { typ: 'fall', label: 'Fall',
        text: 'Deniz (15) darf in den Sommerferien drei Wochen an einem Schüleraustausch nach Kanada teilnehmen. Davon träumt er seit Jahren, und den Austausch gibt es nur in diesem Jahr. Genau in dieser Zeit zieht seine beste Freundin in eine andere Stadt. Sie hat ihn gebeten, beim Umzug zu helfen und die letzten Tage mit ihr zu verbringen.' },
    ],
    aufgaben: [
      { id: 'a', typ: 'abstimmung',
        auftrag: 'Wie sollte Deniz entscheiden?',
        optionen: ['Zum Austausch fahren', 'Bei der Freundin bleiben'] },
      { id: 'b', typ: 'mc', mehrfach: true,
        auftrag: 'Kreuze alle Kriterien an, die für deine Entscheidung wichtig waren.',
        optionen: ['Dauer', 'Wichtigkeit', 'Wahrscheinlichkeit', 'Betroffene', 'Bauchgefühl'] },
      { id: 'c', typ: 'freitext', zeilen: 4,
        auftrag: 'Begründe deine Entscheidung. Nenne auch, was dagegen spricht.' },
      { id: 'd', typ: 'freitext', zeilen: 3,
        auftrag: 'Erkläre: Wofür trägt Deniz die Verantwortung – ganz egal, wie er sich entscheidet?' },
    ],
    zusatz: { id: 'z', typ: 'freitext', zeilen: 3,
      auftrag: 'Beschreibe einen Weg, der beides möglich macht. Was kostet dieser Weg?' },
  },

  /* ── 8 ─────────────────────────────────────────── */
  {
    id: 'lebensentwurf',
    titel: 'Mein Lebensentwurf',
    bezug: 'Lebensentwurf und Sartre',
    art: 'wahl',
    minuten: 10,
    kurz: 'Hast du selbst entschieden, was dir wichtig ist?',
    material: [
      { typ: 'info', label: 'Zur Erinnerung',
        text: 'Am Anfang der Reihe hast du aufgeschrieben, was unbedingt zu deinem Lebensentwurf gehört. Damals blieb eine Frage offen: Entscheidest du selbst, was dir wichtig ist – oder kannst du das gar nicht selbst entscheiden?' },
    ],
    aufgaben: [
      { id: 'a', typ: 'freitext', zeilen: 1,
        auftrag: 'Nenne einen Punkt aus deinem Lebensentwurf.' },
      { id: 'b', typ: 'abstimmung',
        auftrag: 'Wie sehr hast du selbst entschieden, dass dir dieser Punkt wichtig ist?',
        optionen: ['Ganz allein', 'Größtenteils selbst', 'Teils, teils', 'Vor allem andere'] },
      { id: 'c', typ: 'freitext', zeilen: 3,
        auftrag: 'Erkläre, wer oder was außer dir mitentschieden hat – zum Beispiel Familie, Freunde, Herkunft oder Vorbilder.' },
      { id: 'd', typ: 'freitext', zeilen: 4,
        auftrag: 'Nimm Stellung: Kannst du frei entscheiden, was dir wichtig ist? Beziehe dich auf Sartre.' },
    ],
    zusatz: { id: 'z', typ: 'freitext', zeilen: 3,
      auftrag: 'Was müsste passieren, damit du diesen Punkt aus deinem Lebensentwurf streichst?' },
  },

  /* ── 9 · allgemein ─────────────────────────────── */
  {
    id: 'bereuen',
    titel: 'Kann man eine Entscheidung bereuen?',
    bezug: 'allgemein',
    art: 'wahl',
    minuten: 12,
    kurz: 'Über Reue, Fehler und das, was man nicht getan hat',
    material: [
      { typ: 'info', label: 'Hinweis',
        text: 'Schreib nur auf, was du auch der Lehrkraft erzählen würdest. Du musst nichts sehr Persönliches preisgeben – ein ausgedachtes Beispiel ist auch in Ordnung.' },
    ],
    aufgaben: [
      { id: 'a', typ: 'abstimmung',
        auftrag: 'Hast du schon einmal eine Entscheidung bereut?',
        optionen: ['Ja, oft', 'Ja, manchmal', 'Kaum', 'Nie'] },
      { id: 'b', typ: 'freitext', zeilen: 4,
        auftrag: 'Beschreibe eine Entscheidung, die man bereuen kann. Erkläre, was man im Nachhinein anders sehen würde.' },
      { id: 'c', typ: 'abstimmung',
        auftrag: 'Was bereuen Menschen deiner Meinung nach eher?',
        optionen: ['Etwas getan zu haben', 'Etwas nicht getan zu haben'],
        begruendung: 'Begründe deine Meinung.' },
      { id: 'd', typ: 'freitext', zeilen: 4,
        auftrag: 'Erkläre: Kann man eine Entscheidung bereuen, die damals trotzdem richtig war?' },
    ],
    zusatz: { id: 'z', typ: 'freitext', zeilen: 3,
      auftrag: 'Sartre sagt: Für unsere Wahl tragen wir die Verantwortung. Bedeutet das, dass man nichts bereuen darf? Begründe.' },
  },

  /* ── 10 · allgemein ────────────────────────────── */
  {
    id: 'wie-und-warum',
    titel: 'Wie entscheidest du – und warum?',
    bezug: 'allgemein',
    art: 'wahl',
    minuten: 12,
    kurz: 'Dein eigener Weg zu einer Entscheidung',
    material: [],
    aufgaben: [
      { id: 'a', typ: 'abstimmung',
        auftrag: 'Worauf hörst du bei wichtigen Entscheidungen am meisten?',
        optionen: ['Auf meinen Kopf', 'Auf mein Bauchgefühl', 'Auf meine Freunde', 'Auf meine Familie'],
        begruendung: 'Begründe, warum das für dich so ist.' },
      { id: 'b', typ: 'freitext', zeilen: 5,
        auftrag: 'Beschreibe Schritt für Schritt, wie du eine wichtige Entscheidung triffst: Was machst du zuerst, was danach?' },
      { id: 'c', typ: 'freitext', zeilen: 4,
        auftrag: 'Erkläre, woran man eine gute Entscheidung erkennt. Begründe deine Antwort.' },
      { id: 'd', typ: 'abstimmung',
        auftrag: 'Fallen dir kleine oder große Entscheidungen schwerer?',
        optionen: ['Kleine', 'Große', 'Beide gleich'],
        begruendung: 'Begründe mit einem Beispiel.' },
    ],
    zusatz: { id: 'z', typ: 'freitext', zeilen: 3,
      auftrag: 'Ist es manchmal besser, eine Entscheidung schnell zu treffen, statt lange nachzudenken? Begründe.' },
  },

  /* ── 11 · allgemein ────────────────────────────── */
  {
    id: 'wer-entscheidet',
    titel: 'Wer entscheidet mit?',
    bezug: 'allgemein',
    art: 'wahl',
    minuten: 12,
    kurz: 'Eltern, Freunde, Gewissen – wie frei sind deine Entscheidungen?',
    material: [],
    aufgaben: [
      { id: 'a', typ: 'abstimmung',
        auftrag: 'Wer sollte entscheiden, welchen Beruf du einmal lernst?',
        optionen: ['Ich allein', 'Ich zusammen mit meiner Familie', 'Vor allem meine Familie'],
        begruendung: 'Begründe deine Wahl.' },
      { id: 'b', typ: 'abstimmung',
        auftrag: 'Dein Gewissen sagt Nein, deine Freunde sagen Ja. Worauf hörst du?',
        optionen: ['Auf mein Gewissen', 'Auf meine Freunde', 'Kommt darauf an'],
        begruendung: 'Begründe mit einem Beispiel.' },
      { id: 'c', typ: 'freitext', zeilen: 4,
        auftrag: 'Nenne eine Entscheidung, die du gar nicht selbst treffen kannst. Erkläre, warum das so ist.' },
      { id: 'd', typ: 'freitext', zeilen: 4,
        auftrag: 'Nimm Stellung: Ist eine Entscheidung noch deine eigene, wenn dir andere dabei geholfen haben?' },
    ],
    zusatz: { id: 'z', typ: 'freitext', zeilen: 3,
      auftrag: 'Gibt es Entscheidungen, die man niemandem abnehmen sollte – auch nicht aus Liebe? Nenne ein Beispiel.' },
  },

  /* ── 12 ────────────────────────────────────────── */
  {
    id: 'quiz',
    titel: 'Abschlussquiz',
    bezug: 'ganze Reihe',
    art: 'pflicht',
    minuten: 10,
    kurz: 'Acht Fragen zur ganzen Reihe',
    layout: 'quiz',          // Fragenblöcke und Fortschrittsleiste wie im Heterogenität-Test
    material: [],
    aufgaben: [
      { id: 'q1', typ: 'mc', thema: 'Sartre',
        auftrag: 'Wer sagt: „Die Existenz geht dem Wesen voraus“?',
        optionen: ['Fjodor M. Dostojewski', 'Jean-Paul Sartre', 'Martin Heidegger'],
        richtig: 1 },
      { id: 'q2', typ: 'mc', thema: 'Sartre',
        auftrag: 'Was bedeutet „Wir sind zur Freiheit verurteilt“?',
        optionen: [
          'Freiheit ist eine Strafe für schlechte Taten.',
          'Wir dürfen alles tun, was wir wollen.',
          'Wir können nicht nicht entscheiden – auch Nichtstun ist eine Entscheidung.',
          'Nur wer frei ist, kann bestraft werden.',
        ],
        richtig: 2 },
      { id: 'q3', typ: 'mc', thema: 'Sartre',
        auftrag: 'Beim Brieföffner steht vorher fest, wozu er da ist. Wie beschreibt Sartre das?',
        optionen: [
          'Das Wesen geht der Existenz voraus.',
          'Die Existenz geht dem Wesen voraus.',
          'Der Brieföffner ist zur Freiheit verurteilt.',
        ],
        richtig: 0,
        erklaerung: 'Beim Brieföffner ist es andersherum als beim Menschen: Zuerst steht fest, was er sein soll, dann wird er hergestellt.' },
      { id: 'q4', typ: 'mc', thema: 'Gute Entscheidungen',
        auftrag: 'Welches Kriterium fragt: „Betrifft die Folge nur mich oder auch andere?“',
        optionen: ['Dauer', 'Wichtigkeit', 'Wahrscheinlichkeit', 'Betroffene'],
        richtig: 3 },
      { id: 'q5', typ: 'mc', thema: 'Gute Entscheidungen',
        auftrag: '„Wird meine Note durch das Lernen wirklich besser?“ Welches Kriterium steckt in dieser Frage?',
        optionen: ['Wahrscheinlichkeit', 'Dauer', 'Betroffene', 'Wichtigkeit'],
        richtig: 0 },
      { id: 'q6', typ: 'mc', thema: 'Dostojewski',
        auftrag: 'Wen meint Dostojewskis Erzähler mit einer „Klaviertaste“?',
        optionen: [
          'Einen Menschen, der gut Klavier spielt.',
          'Einen Menschen, der anderen immer widerspricht.',
          'Einen Menschen ohne eigenen Willen, der immer gleich auf das reagiert, was man ihm vorgibt.',
        ],
        richtig: 2 },
      { id: 'q7', typ: 'mc', thema: 'Gute Entscheidungen',
        auftrag: 'Warum können zwei Menschen mit denselben Kriterien verschieden entscheiden?',
        optionen: [
          'Weil sie die Kriterien unterschiedlich gewichten.',
          'Weil Kriterien vom Zufall abhängen.',
          'Weil einer von beiden falsch gerechnet hat.',
        ],
        richtig: 0 },
      { id: 'q8', typ: 'mc', thema: 'Gute Entscheidungen',
        auftrag: 'Welcher Satz fasst die Stunde „Gute Entscheidungen“ zusammen?',
        optionen: [
          'Wer alle Vor- und Nachteile kennt, entscheidet automatisch richtig.',
          'Kriterien helfen beim Entscheiden, aber sie nehmen uns die Entscheidung nicht ab. Am Ende wählen wir selbst und tragen die Verantwortung dafür.',
          'Gute Entscheidungen trifft man immer aus dem Bauch heraus.',
        ],
        richtig: 1 },
      { id: 'r', typ: 'freitext', zeilen: 3, optional: true,
        auftrag: 'Noch etwas unklar?' },
    ],
    zusatz: { id: 'z', typ: 'freitext', zeilen: 3,
      auftrag: 'Formuliere den Merksatz aus Frage 8 in deinen eigenen Worten.' },
  },
];
