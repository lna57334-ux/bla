# Event-Planer

Ein lokales Web-Tool zur Planung privater Events (Themen-Filmabende, Geburtstage,
Weihnachten, ...). Beliebig viele Events koennen parallel oder nacheinander
angelegt und verwaltet werden. Laeuft komplett lokal, ohne Cloud-Abhaengigkeit.

## Technische Umsetzung

- **Backend:** Node.js + [Express](https://expressjs.com/) als schlanker REST-API-Server.
- **Datenhaltung:** SQLite ueber das in Node.js eingebaute Modul `node:sqlite`
  (kein zusaetzliches natives Paket noetig). Die Datenbankdatei liegt lokal unter
  `data/eventplanner.db` und wird beim ersten Start automatisch angelegt und mit
  einem Beispiel-Event ("Harry-Potter-Filmabend") befuellt.
- **Frontend:** Eine einzelne Single-Page-Oberflaeche mit purem HTML/CSS/JavaScript
  (kein Build-Schritt, kein Framework) unter `public/`, die per REST-API mit dem
  Server kommuniziert.
- Dadurch ist das Projekt leicht erweiterbar: neue Felder/Tabellen in `db.js`,
  neue Endpunkte in `server.js` (Datenzugriff via `models.js`), neue UI-Teile in
  `public/`.

## Datenmodell

- **Event**: Titel, Datum, Ort, Notizen.
- **Gaeste**: Name, Anmerkungen (z. B. Allergien, Mitbringsel).
- **Checkliste**: Kategorien Deko, Spiele & Aktivitaeten, Essen & Trinken,
  Budget, Einkaufsliste, Sonstiges. Jeder Punkt hat Beschreibung,
  Erledigt-Status und optionales Faelligkeitsdatum.
- **Einkaufsliste**: setzt sich automatisch aus den Checklistenpunkten der
  Kategorie "Einkaufsliste" zusammen, manuelle Eintraege koennen direkt
  ergaenzt werden.
- **Budget**: Posten mit geplanten und tatsaechlichen Kosten, inkl.
  automatischer Gesamtsumme.
- **Zeitplan**: Aufgaben relativ zum Event-Datum (z. B. "3 Tage vorher",
  "Am Vortag", "Am Tag selbst").

## Nutzung

```bash
npm install     # einmalig, installiert Express
npm start        # startet den Server auf http://localhost:3000
```

Danach im Browser `http://localhost:3000` oeffnen. Alle Daten bleiben lokal in
`data/eventplanner.db` gespeichert.

Fuer Entwicklung mit automatischem Neustart bei Aenderungen:

```bash
npm run dev
```

## Funktionen

- Events anlegen, auflisten, oeffnen, bearbeiten und loeschen.
- Gaesteliste je Event mit Anmerkungen.
- Checklistenpunkte hinzufuegen, abhaken, bearbeiten, loeschen; Filter nach
  Kategorie.
- Automatische Einkaufsliste plus manuelle Eintraege.
- Budget-Uebersicht mit geplanten/tatsaechlichen Kosten je Posten und
  Gesamtsumme.
- Fortschrittsanzeige je Event in Prozent (Anteil erledigter
  Checklistenpunkte).
- Zeitplan mit relativen Faelligkeiten.
- Kategorie-Icons und Farbcodierung fuer eine schnelle visuelle Orientierung.
