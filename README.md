# Reiseplaner

Eine lokale, mobil-freundliche Web-App zur Reiseplanung – gebaut für eine
alleinerziehende Mutter, die mit ihrem Baby verreist. Alle Daten werden
ausschließlich im Browser (localStorage) gespeichert, es gibt kein Backend.

## Setup & lokaler Start

```bash
npm install
npm run dev
```

Danach im Browser (oder auf dem Handy im selben WLAN) `http://localhost:5173`
öffnen. Produktions-Build: `npm run build`, Vorschau: `npm run preview`.

## Seitenaufteilung

Mobile-first mit Bottom-Navigation, 6 Bereiche:

1. **Übersicht** – Top-Shortlist, Status des Jahresrhythmus (1× Center Parcs
   + 1× international), Schnellzugriffe.
2. **Ziele** – Destinationsplanung: Ziele anlegen, nach 6 Kriterien mit
   Sternen bewerten (warm, am Meer, allein mit Baby machbar, medizinische
   Versorgung, Sicherheit, Kinderfreundlichkeit), Status (Idee / Shortlist /
   Geplant / Besucht), beste Reisezeit & Nebensaison-Preise pro Ziel.
3. **Meilen** – Meilen-/Punkte-Rechner: Cent-pro-Meile-Wert aus Barpreis,
   nötiger Meilenzahl und Steuern/Gebühren, mit Faustregel-Bewertung
   (ab ~1,5 ct/Meile lohnt sich das Einlösen) und Hinweis
   Kurzstrecke/Economy → bar zahlen & sammeln, Langstrecke/Business → eher
   einlösen.
4. **Packen** – Packlisten-Vorlagen, die sich nach Reisedauer und Zieltyp
   (warm/kalt) automatisch anpassen; daraus wird eine abhakbare Checkliste
   generiert.
5. **Aktivitäten** – Ausflugsziele pro Destination mit Fokus auf
   babyfreundliche Optionen, filterbar.
6. **Budget** – Einfaches Budget-Tracking, getrennt nach Center-Parcs-Trips
   (national, primär zum Meilensammeln) und internationalen Reisen, jeweils
   geplant vs. tatsächlich pro Kategorie.

## Datenstruktur (Kurzüberblick, siehe `src/types.ts`)

- `Destination` – Name, Land, Bewertungen je Kriterium (1–5), Status,
  `ClimateInfo` (beste Monate, Nebensaison-Monate, Ø-Temperaturen,
  Preisnotizen).
- `Activity` – an eine `Destination` gebunden, babyfreundlich-Flag,
  Alters­hinweis, Kostenniveau.
- `PackingTemplate` / `PackingListInstance` – Vorlagen mit Tage-Spanne und
  Zieltyp; generierte Listen skalieren verbrauchsabhängige Positionen
  (Kleidung, Hygiene, Strand) automatisch mit der Reisedauer.
- `MilesCalculation` – Barpreis, nötige Meilen, Steuern/Gebühren,
  Kabinenklasse, Streckentyp.
- `BudgetTrip` – Typ (`centerparcs` | `international`), Jahr, Liste von
  `BudgetCategory` (geplant vs. tatsächlich).

Alle Collections werden per `usePersistentState` (siehe `src/lib/storage.ts`)
automatisch in `localStorage` synchronisiert.

## Tech-Stack

React + TypeScript + Vite + Tailwind CSS, keine Backend-Abhängigkeit.
