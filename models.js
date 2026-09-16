'use strict';

const { db, CATEGORIES } = require('./db');

function toBool(row, keys) {
  for (const k of keys) {
    if (row && k in row) row[k] = !!row[k];
  }
  return row;
}

function computeProgress(eventId) {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total, SUM(done) AS done FROM checklist_items WHERE event_id = ?`
    )
    .get(eventId);
  const total = Number(row.total) || 0;
  const done = Number(row.done) || 0;
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function computeBudgetSummary(eventId) {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(planned_cost),0) AS planned, COALESCE(SUM(actual_cost),0) AS actual
       FROM budget_items WHERE event_id = ?`
    )
    .get(eventId);
  return {
    totalPlanned: Number(row.planned) || 0,
    totalActual: Number(row.actual) || 0,
    difference: (Number(row.actual) || 0) - (Number(row.planned) || 0),
  };
}

// ---------- Events ----------

function listEvents() {
  const events = db
    .prepare(`SELECT * FROM events ORDER BY date IS NULL, date ASC, created_at ASC`)
    .all();
  return events.map((e) => ({
    ...e,
    progress: computeProgress(e.id),
    budget: computeBudgetSummary(e.id),
    guestCount: db.prepare(`SELECT COUNT(*) AS c FROM guests WHERE event_id = ?`).get(e.id).c,
  }));
}

function getEvent(id) {
  const event = db.prepare(`SELECT * FROM events WHERE id = ?`).get(id);
  if (!event) return null;

  const guests = db.prepare(`SELECT * FROM guests WHERE event_id = ? ORDER BY id`).all(id);
  const checklist = db
    .prepare(`SELECT * FROM checklist_items WHERE event_id = ? ORDER BY id`)
    .all(id)
    .map((r) => toBool(r, ['done']));
  const budgetItems = db
    .prepare(`SELECT * FROM budget_items WHERE event_id = ? ORDER BY id`)
    .all(id);
  const timeline = db
    .prepare(`SELECT * FROM timeline_tasks WHERE event_id = ? ORDER BY offset_days ASC, id ASC`)
    .all(id)
    .map((r) => toBool(r, ['done']));

  return {
    ...event,
    guests,
    checklist,
    budgetItems,
    timeline,
    progress: computeProgress(id),
    budget: computeBudgetSummary(id),
    categories: CATEGORIES,
  };
}

function createEvent({ title, date, location, notes }) {
  const result = db
    .prepare(`INSERT INTO events (title, date, location, notes) VALUES (?, ?, ?, ?)`)
    .run(title, date || null, location || null, notes || null);
  return getEvent(Number(result.lastInsertRowid));
}

function updateEvent(id, { title, date, location, notes }) {
  db.prepare(
    `UPDATE events SET title = ?, date = ?, location = ?, notes = ? WHERE id = ?`
  ).run(title, date || null, location || null, notes || null, id);
  return getEvent(id);
}

function deleteEvent(id) {
  db.prepare(`DELETE FROM events WHERE id = ?`).run(id);
}

// ---------- Guests ----------

function addGuest(eventId, { name, notes }) {
  const result = db
    .prepare(`INSERT INTO guests (event_id, name, notes) VALUES (?, ?, ?)`)
    .run(eventId, name, notes || null);
  return db.prepare(`SELECT * FROM guests WHERE id = ?`).get(Number(result.lastInsertRowid));
}

function updateGuest(id, { name, notes }) {
  db.prepare(`UPDATE guests SET name = ?, notes = ? WHERE id = ?`).run(name, notes || null, id);
  return db.prepare(`SELECT * FROM guests WHERE id = ?`).get(id);
}

function deleteGuest(id) {
  db.prepare(`DELETE FROM guests WHERE id = ?`).run(id);
}

// ---------- Checklist ----------

function addChecklistItem(eventId, { category, description, dueDate }) {
  const result = db
    .prepare(
      `INSERT INTO checklist_items (event_id, category, description, done, due_date) VALUES (?, ?, ?, 0, ?)`
    )
    .run(eventId, category, description, dueDate || null);
  return toBool(
    db.prepare(`SELECT * FROM checklist_items WHERE id = ?`).get(Number(result.lastInsertRowid)),
    ['done']
  );
}

function updateChecklistItem(id, { category, description, done, dueDate }) {
  db.prepare(
    `UPDATE checklist_items SET category = ?, description = ?, done = ?, due_date = ? WHERE id = ?`
  ).run(category, description, done ? 1 : 0, dueDate || null, id);
  return toBool(db.prepare(`SELECT * FROM checklist_items WHERE id = ?`).get(id), ['done']);
}

function deleteChecklistItem(id) {
  db.prepare(`DELETE FROM checklist_items WHERE id = ?`).run(id);
}

// ---------- Budget ----------

function addBudgetItem(eventId, { name, plannedCost, actualCost }) {
  const result = db
    .prepare(
      `INSERT INTO budget_items (event_id, name, planned_cost, actual_cost) VALUES (?, ?, ?, ?)`
    )
    .run(eventId, name, Number(plannedCost) || 0, Number(actualCost) || 0);
  return db.prepare(`SELECT * FROM budget_items WHERE id = ?`).get(Number(result.lastInsertRowid));
}

function updateBudgetItem(id, { name, plannedCost, actualCost }) {
  db.prepare(
    `UPDATE budget_items SET name = ?, planned_cost = ?, actual_cost = ? WHERE id = ?`
  ).run(name, Number(plannedCost) || 0, Number(actualCost) || 0, id);
  return db.prepare(`SELECT * FROM budget_items WHERE id = ?`).get(id);
}

function deleteBudgetItem(id) {
  db.prepare(`DELETE FROM budget_items WHERE id = ?`).run(id);
}

// ---------- Timeline ----------

function addTimelineTask(eventId, { description, offsetDays }) {
  const result = db
    .prepare(
      `INSERT INTO timeline_tasks (event_id, description, offset_days, done) VALUES (?, ?, ?, 0)`
    )
    .run(eventId, description, Number(offsetDays) || 0);
  return toBool(
    db.prepare(`SELECT * FROM timeline_tasks WHERE id = ?`).get(Number(result.lastInsertRowid)),
    ['done']
  );
}

function updateTimelineTask(id, { description, offsetDays, done }) {
  db.prepare(
    `UPDATE timeline_tasks SET description = ?, offset_days = ?, done = ? WHERE id = ?`
  ).run(description, Number(offsetDays) || 0, done ? 1 : 0, id);
  return toBool(db.prepare(`SELECT * FROM timeline_tasks WHERE id = ?`).get(id), ['done']);
}

function deleteTimelineTask(id) {
  db.prepare(`DELETE FROM timeline_tasks WHERE id = ?`).run(id);
}

module.exports = {
  CATEGORIES,
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  addGuest,
  updateGuest,
  deleteGuest,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  addTimelineTask,
  updateTimelineTask,
  deleteTimelineTask,
};
