'use strict';

const express = require('express');
const path = require('node:path');
const models = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function notFound(res, what) {
  res.status(404).json({ error: `${what} nicht gefunden` });
}

function asyncHandler(fn) {
  return (req, res) => {
    try {
      fn(req, res);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message || 'Unbekannter Fehler' });
    }
  };
}

// ---------- Categories ----------
app.get('/api/categories', (req, res) => {
  res.json(models.CATEGORIES);
});

// ---------- Events ----------
app.get(
  '/api/events',
  asyncHandler((req, res) => {
    res.json(models.listEvents());
  })
);

app.post(
  '/api/events',
  asyncHandler((req, res) => {
    const { title } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Titel ist erforderlich' });
    }
    res.status(201).json(models.createEvent(req.body));
  })
);

app.get(
  '/api/events/:id',
  asyncHandler((req, res) => {
    const event = models.getEvent(Number(req.params.id));
    if (!event) return notFound(res, 'Event');
    res.json(event);
  })
);

app.put(
  '/api/events/:id',
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    if (!models.getEvent(id)) return notFound(res, 'Event');
    res.json(models.updateEvent(id, req.body));
  })
);

app.delete(
  '/api/events/:id',
  asyncHandler((req, res) => {
    models.deleteEvent(Number(req.params.id));
    res.status(204).end();
  })
);

// ---------- Guests ----------
app.post(
  '/api/events/:id/guests',
  asyncHandler((req, res) => {
    const { name } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name ist erforderlich' });
    res.status(201).json(models.addGuest(Number(req.params.id), req.body));
  })
);

app.put(
  '/api/guests/:id',
  asyncHandler((req, res) => {
    res.json(models.updateGuest(Number(req.params.id), req.body));
  })
);

app.delete(
  '/api/guests/:id',
  asyncHandler((req, res) => {
    models.deleteGuest(Number(req.params.id));
    res.status(204).end();
  })
);

// ---------- Checklist ----------
app.post(
  '/api/events/:id/checklist',
  asyncHandler((req, res) => {
    const { category, description } = req.body || {};
    if (!category || !description || !description.trim()) {
      return res.status(400).json({ error: 'Kategorie und Beschreibung sind erforderlich' });
    }
    res.status(201).json(models.addChecklistItem(Number(req.params.id), req.body));
  })
);

app.put(
  '/api/checklist/:id',
  asyncHandler((req, res) => {
    res.json(models.updateChecklistItem(Number(req.params.id), req.body));
  })
);

app.delete(
  '/api/checklist/:id',
  asyncHandler((req, res) => {
    models.deleteChecklistItem(Number(req.params.id));
    res.status(204).end();
  })
);

// ---------- Budget ----------
app.post(
  '/api/events/:id/budget',
  asyncHandler((req, res) => {
    const { name } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name ist erforderlich' });
    res.status(201).json(models.addBudgetItem(Number(req.params.id), req.body));
  })
);

app.put(
  '/api/budget/:id',
  asyncHandler((req, res) => {
    res.json(models.updateBudgetItem(Number(req.params.id), req.body));
  })
);

app.delete(
  '/api/budget/:id',
  asyncHandler((req, res) => {
    models.deleteBudgetItem(Number(req.params.id));
    res.status(204).end();
  })
);

// ---------- Timeline ----------
app.post(
  '/api/events/:id/timeline',
  asyncHandler((req, res) => {
    const { description } = req.body || {};
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Beschreibung ist erforderlich' });
    }
    res.status(201).json(models.addTimelineTask(Number(req.params.id), req.body));
  })
);

app.put(
  '/api/timeline/:id',
  asyncHandler((req, res) => {
    res.json(models.updateTimelineTask(Number(req.params.id), req.body));
  })
);

app.delete(
  '/api/timeline/:id',
  asyncHandler((req, res) => {
    models.deleteTimelineTask(Number(req.params.id));
    res.status(204).end();
  })
);

app.listen(PORT, () => {
  console.log(`Event-Planer laeuft lokal auf http://localhost:${PORT}`);
});
