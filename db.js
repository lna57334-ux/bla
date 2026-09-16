'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'eventplanner.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const isNewDatabase = !fs.existsSync(DB_PATH);

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');

// Checklist categories used across the app (checklist, shopping list = category "einkauf").
const CATEGORIES = [
  { key: 'deko', label: 'Deko', icon: '🎈', color: '#e6739f' },
  { key: 'spiele', label: 'Spiele & Aktivitaeten', icon: '🎲', color: '#5aa9e6' },
  { key: 'essen', label: 'Essen & Trinken', icon: '🍽️', color: '#f2a154' },
  { key: 'budget', label: 'Budget', icon: '💶', color: '#54b689' },
  { key: 'einkauf', label: 'Einkaufsliste', icon: '🛒', color: '#9b7fe0' },
  { key: 'sonstiges', label: 'Sonstiges', icon: '📌', color: '#8d99a6' },
];

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT,
    location TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    due_date TEXT
  );

  CREATE TABLE IF NOT EXISTS budget_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    planned_cost REAL NOT NULL DEFAULT 0,
    actual_cost REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS timeline_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    offset_days INTEGER NOT NULL DEFAULT 0,
    done INTEGER NOT NULL DEFAULT 0
  );
`);

function seedExampleEvent() {
  const insertEvent = db.prepare(
    `INSERT INTO events (title, date, location, notes) VALUES (?, ?, ?, ?)`
  );
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 14);
  const dateStr = eventDate.toISOString().slice(0, 10);

  const result = insertEvent.run(
    'Harry-Potter-Filmabend',
    dateStr,
    'Wohnzimmer bei Lena',
    'Themenabend mit Umhaengen, Butterbier und Quiz. Handys auf lautlos - Kinostart 19:00 Uhr.'
  );
  const eventId = Number(result.lastInsertRowid);

  const insertGuest = db.prepare(
    `INSERT INTO guests (event_id, name, notes) VALUES (?, ?, ?)`
  );
  insertGuest.run(eventId, 'Mira', 'Vegetarisch, bringt Kuerbiskekse mit');
  insertGuest.run(eventId, 'Jonas', 'Keine Allergien');
  insertGuest.run(eventId, 'Sophie', 'Laktoseintoleranz, bringt Butterbier-Sirup mit');

  const insertItem = db.prepare(
    `INSERT INTO checklist_items (event_id, category, description, done, due_date) VALUES (?, ?, ?, ?, ?)`
  );
  // Deko
  insertItem.run(eventId, 'deko', 'Hauswappen-Banner aufhaengen (Gryffindor, Slytherin, Hufflepuff, Ravenclaw)', 0, null);
  insertItem.run(eventId, 'deko', 'Kerzen und Lichterketten fuer Grosse-Halle-Feeling', 0, null);
  insertItem.run(eventId, 'deko', 'Hauswappen als Tischkarten drucken', 1, null);
  // Spiele & Aktivitaeten
  insertItem.run(eventId, 'spiele', 'Sprechenden-Hut-Quiz vorbereiten (Hauszuteilung)', 0, dateStr);
  insertItem.run(eventId, 'spiele', 'Harry-Potter-Trivia-Quiz ausdrucken', 0, null);
  insertItem.run(eventId, 'spiele', 'Wer bin ich? mit Zauberer-Charakteren', 0, null);
  // Essen & Trinken
  insertItem.run(eventId, 'essen', 'Butterbier mixen (alkoholfrei)', 0, dateStr);
  insertItem.run(eventId, 'essen', 'Kuerbissaft besorgen', 1, null);
  insertItem.run(eventId, 'essen', 'Bertie Botts Bohnen (Jelly Beans) kaufen', 0, null);
  insertItem.run(eventId, 'essen', 'Schokofrosch-Kekse backen', 0, null);
  // Budget (Checklisten-Aufgaben rund ums Budget)
  insertItem.run(eventId, 'budget', 'Kostenrahmen mit Mitbewohnern absprechen', 1, null);
  insertItem.run(eventId, 'budget', 'Ausgaben nach dem Abend abrechnen', 0, null);
  // Einkaufsliste
  insertItem.run(eventId, 'einkauf', 'Schwarze Umhaenge / Capes', 0, null);
  insertItem.run(eventId, 'einkauf', 'Runde Brillen als Accessoire', 0, null);
  insertItem.run(eventId, 'einkauf', 'Snacks fuer den Filmabend', 0, null);
  // Sonstiges
  insertItem.run(eventId, 'sonstiges', 'Filme/Streaming-Zugang pruefen', 1, null);
  insertItem.run(eventId, 'sonstiges', 'Sitzplaetze und Decken organisieren', 0, null);

  const insertBudget = db.prepare(
    `INSERT INTO budget_items (event_id, name, planned_cost, actual_cost) VALUES (?, ?, ?, ?)`
  );
  insertBudget.run(eventId, 'Deko (Banner, Kerzen, Tischkarten)', 25, 22.5);
  insertBudget.run(eventId, 'Snacks & Getraenke', 30, 0);
  insertBudget.run(eventId, 'Kostueme / Accessoires', 20, 18);
  insertBudget.run(eventId, 'Quiz-Preise', 15, 0);

  const insertTask = db.prepare(
    `INSERT INTO timeline_tasks (event_id, description, offset_days, done) VALUES (?, ?, ?, ?)`
  );
  insertTask.run(eventId, 'Einladungen verschicken', -10, 1);
  insertTask.run(eventId, 'Einkaufsliste fertigstellen', -3, 0);
  insertTask.run(eventId, 'Deko besorgen und Zutaten einkaufen', -3, 0);
  insertTask.run(eventId, 'Wohnung dekorieren, Butterbier vorbereiten', -1, 0);
  insertTask.run(eventId, 'Filme bereitstellen, Snacks aufbauen', 0, 0);
}

if (isNewDatabase) {
  seedExampleEvent();
}

module.exports = { db, CATEGORIES };
