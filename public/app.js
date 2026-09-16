'use strict';

const state = {
  categories: [],
  categoryByKey: {},
  events: [],
  currentEvent: null,
  checklistFilter: 'alle',
  editingEventId: null,
};

const el = (id) => document.getElementById(id);

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
    } catch (_) {}
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('de-DE');
}

function categoryBadge(key) {
  const cat = state.categoryByKey[key];
  if (!cat) return `<span class="category-badge" style="background:#8d99a6">${key}</span>`;
  return `<span class="category-badge" style="background:${cat.color}">${cat.icon} ${cat.label}</span>`;
}

function offsetLabel(offsetDays) {
  const n = Number(offsetDays);
  if (n === 0) return 'Am Tag selbst';
  if (n < 0) return `${Math.abs(n)} Tag${Math.abs(n) === 1 ? '' : 'e'} vorher`;
  return `${n} Tag${n === 1 ? '' : 'e'} danach`;
}

// ---------------- Init ----------------

async function init() {
  state.categories = await api('GET', '/api/categories');
  state.categoryByKey = Object.fromEntries(state.categories.map((c) => [c.key, c]));
  populateCategorySelects();
  await loadEvents();
  bindGlobalEvents();
}

function populateCategorySelects() {
  const select = el('checklist-category-select');
  select.innerHTML = state.categories
    .map((c) => `<option value="${c.key}">${c.icon} ${c.label}</option>`)
    .join('');

  const filter = el('checklist-filter');
  filter.innerHTML =
    `<option value="alle">Alle Kategorien</option>` +
    state.categories.map((c) => `<option value="${c.key}">${c.icon} ${c.label}</option>`).join('');
}

// ---------------- Events list ----------------

async function loadEvents() {
  state.events = await api('GET', '/api/events');
  renderEventList();
}

function renderEventList() {
  const list = el('event-list');
  if (state.events.length === 0) {
    list.innerHTML = '<li class="hint-text">Noch keine Events angelegt.</li>';
    return;
  }
  list.innerHTML = state.events
    .map((e) => {
      const active = state.currentEvent && state.currentEvent.id === e.id ? 'active' : '';
      return `
        <li class="event-list-item ${active}" data-id="${e.id}">
          <span class="ev-title">${escapeHtml(e.title)}</span>
          <span class="ev-meta">${formatDate(e.date) || 'kein Datum'}${e.location ? ' · ' + escapeHtml(e.location) : ''}</span>
          <div class="mini-progress"><div class="mini-progress-fill" style="width:${e.progress}%"></div></div>
        </li>`;
    })
    .join('');

  list.querySelectorAll('.event-list-item').forEach((li) => {
    li.addEventListener('click', () => selectEvent(Number(li.dataset.id)));
  });
}

async function selectEvent(id) {
  state.currentEvent = await api('GET', `/api/events/${id}`);
  el('empty-state').classList.add('hidden');
  el('event-detail').classList.remove('hidden');
  renderEventList();
  renderEventDetail();
}

function renderEventDetail() {
  const ev = state.currentEvent;
  el('event-title').textContent = ev.title;
  el('event-meta').textContent = [formatDate(ev.date), ev.location].filter(Boolean).join(' · ') || 'Keine Termin-/Ortsangabe';
  el('progress-fill').style.width = `${ev.progress}%`;
  el('progress-label').textContent = `${ev.progress}%`;
  el('event-notes').textContent = ev.notes || 'Keine Notizen.';

  el('stat-guests').textContent = ev.guests.length;
  const doneCount = ev.checklist.filter((i) => i.done).length;
  el('stat-checklist').textContent = `${doneCount}/${ev.checklist.length}`;
  el('stat-budget-planned').textContent = `${formatMoney(ev.budget.totalPlanned)} €`;
  el('stat-budget-actual').textContent = `${formatMoney(ev.budget.totalActual)} €`;

  renderGuests();
  renderChecklist();
  renderShoppingList();
  renderBudget();
  renderTimeline();
}

// ---------------- Guests ----------------

function renderGuests() {
  const list = el('guest-list');
  const guests = state.currentEvent.guests;
  if (guests.length === 0) {
    list.innerHTML = '<li class="hint-text">Noch keine Gaeste eingetragen.</li>';
    return;
  }
  list.innerHTML = guests
    .map(
      (g) => `
      <li class="item-row" data-id="${g.id}">
        <div class="item-main">
          <div class="item-main-text">${escapeHtml(g.name)}</div>
          ${g.notes ? `<div class="item-sub-text">${escapeHtml(g.notes)}</div>` : ''}
        </div>
        <button class="btn-icon" data-action="edit">✏️</button>
        <button class="btn-icon" data-action="delete">🗑️</button>
      </li>`
    )
    .join('');

  list.querySelectorAll('.item-row').forEach((row) => {
    const id = Number(row.dataset.id);
    const guest = guests.find((g) => g.id === id);
    row.querySelector('[data-action="edit"]').addEventListener('click', async () => {
      const name = prompt('Name:', guest.name);
      if (name === null) return;
      const notes = prompt('Anmerkungen (Allergien, Mitbringsel, ...):', guest.notes || '');
      if (notes === null) return;
      await api('PUT', `/api/guests/${id}`, { name, notes });
      await selectEvent(state.currentEvent.id);
    });
    row.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm(`Gast "${guest.name}" wirklich loeschen?`)) return;
      await api('DELETE', `/api/guests/${id}`);
      await selectEvent(state.currentEvent.id);
      await loadEvents();
    });
  });
}

// ---------------- Checklist ----------------

function renderChecklist() {
  const container = el('checklist-groups');
  const items = state.currentEvent.checklist.filter(
    (i) => state.checklistFilter === 'alle' || i.category === state.checklistFilter
  );

  if (items.length === 0) {
    container.innerHTML = '<p class="hint-text">Keine Checklistenpunkte in dieser Ansicht.</p>';
    return;
  }

  const groups = {};
  for (const item of items) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }

  container.innerHTML = Object.entries(groups)
    .map(([catKey, catItems]) => {
      const cat = state.categoryByKey[catKey] || { icon: '📌', label: catKey };
      return `
        <div class="checklist-group">
          <div class="checklist-group-title">${cat.icon} ${cat.label} (${catItems.filter((i) => i.done).length}/${catItems.length})</div>
          <ul class="item-list">
            ${catItems.map((i) => checklistItemHtml(i)).join('')}
          </ul>
        </div>`;
    })
    .join('');

  bindChecklistItemEvents(container);
}

function checklistItemHtml(item) {
  return `
    <li class="item-row ${item.done ? 'done' : ''}" data-id="${item.id}">
      <input type="checkbox" ${item.done ? 'checked' : ''} data-action="toggle" />
      <div class="item-main">
        <div class="item-main-text">${escapeHtml(item.description)}</div>
        ${item.due_date ? `<div class="item-sub-text">Faellig: ${formatDate(item.due_date)}</div>` : ''}
      </div>
      <button class="btn-icon" data-action="edit">✏️</button>
      <button class="btn-icon" data-action="delete">🗑️</button>
    </li>`;
}

function bindChecklistItemEvents(container) {
  container.querySelectorAll('.item-row').forEach((row) => {
    const id = Number(row.dataset.id);
    const item = state.currentEvent.checklist.find((i) => i.id === id);
    row.querySelector('[data-action="toggle"]').addEventListener('change', async (e) => {
      await api('PUT', `/api/checklist/${id}`, { ...item, done: e.target.checked, dueDate: item.due_date });
      await selectEvent(state.currentEvent.id);
      await loadEvents();
    });
    row.querySelector('[data-action="edit"]').addEventListener('click', async () => {
      const description = prompt('Beschreibung:', item.description);
      if (description === null) return;
      const dueDate = prompt('Faelligkeitsdatum (JJJJ-MM-TT, leer lassen fuer keins):', item.due_date || '');
      if (dueDate === null) return;
      await api('PUT', `/api/checklist/${id}`, {
        category: item.category,
        description,
        done: item.done,
        dueDate: dueDate || null,
      });
      await selectEvent(state.currentEvent.id);
      await loadEvents();
    });
    row.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm('Diesen Checklistenpunkt loeschen?')) return;
      await api('DELETE', `/api/checklist/${id}`);
      await selectEvent(state.currentEvent.id);
      await loadEvents();
    });
  });
}

// ---------------- Shopping list (category "einkauf") ----------------

function renderShoppingList() {
  const list = el('shopping-list');
  const items = state.currentEvent.checklist.filter((i) => i.category === 'einkauf');
  if (items.length === 0) {
    list.innerHTML = '<li class="hint-text">Die Einkaufsliste ist leer.</li>';
    return;
  }
  list.innerHTML = items.map((i) => checklistItemHtml(i)).join('');
  bindChecklistItemEvents(list);
}

// ---------------- Budget ----------------

function renderBudget() {
  const body = el('budget-body');
  const items = state.currentEvent.budgetItems;
  if (items.length === 0) {
    body.innerHTML = `<tr><td colspan="4" class="hint-text">Noch keine Budgetposten.</td></tr>`;
  } else {
    body.innerHTML = items
      .map(
        (b) => `
        <tr data-id="${b.id}">
          <td><input type="text" data-field="name" value="${escapeHtml(b.name)}" /></td>
          <td><input type="number" step="0.01" min="0" data-field="plannedCost" value="${b.planned_cost}" /></td>
          <td><input type="number" step="0.01" min="0" data-field="actualCost" value="${b.actual_cost}" /></td>
          <td><button class="btn-icon" data-action="delete">🗑️</button></td>
        </tr>`
      )
      .join('');
  }

  el('budget-total-planned').textContent = formatMoney(state.currentEvent.budget.totalPlanned);
  el('budget-total-actual').textContent = formatMoney(state.currentEvent.budget.totalActual);

  body.querySelectorAll('tr[data-id]').forEach((row) => {
    const id = Number(row.dataset.id);
    const item = state.currentEvent.budgetItems.find((b) => b.id === id);
    const save = async () => {
      const name = row.querySelector('[data-field="name"]').value;
      const plannedCost = row.querySelector('[data-field="plannedCost"]').value;
      const actualCost = row.querySelector('[data-field="actualCost"]').value;
      await api('PUT', `/api/budget/${id}`, { name, plannedCost, actualCost });
      await selectEvent(state.currentEvent.id);
      await loadEvents();
    };
    row.querySelectorAll('input').forEach((input) => input.addEventListener('change', save));
    row.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm(`Budgetposten "${item.name}" wirklich loeschen?`)) return;
      await api('DELETE', `/api/budget/${id}`);
      await selectEvent(state.currentEvent.id);
      await loadEvents();
    });
  });
}

// ---------------- Timeline ----------------

function renderTimeline() {
  const list = el('timeline-list');
  const tasks = state.currentEvent.timeline;
  if (tasks.length === 0) {
    list.innerHTML = '<li class="hint-text">Noch keine Zeitplan-Aufgaben.</li>';
    return;
  }
  list.innerHTML = tasks
    .map(
      (t) => `
      <li class="item-row ${t.done ? 'done' : ''}" data-id="${t.id}">
        <input type="checkbox" ${t.done ? 'checked' : ''} data-action="toggle" />
        <div class="item-main">
          <div class="item-main-text">${escapeHtml(t.description)}</div>
          <div class="item-sub-text">${offsetLabel(t.offset_days)}</div>
        </div>
        <button class="btn-icon" data-action="edit">✏️</button>
        <button class="btn-icon" data-action="delete">🗑️</button>
      </li>`
    )
    .join('');

  list.querySelectorAll('.item-row').forEach((row) => {
    const id = Number(row.dataset.id);
    const task = tasks.find((t) => t.id === id);
    row.querySelector('[data-action="toggle"]').addEventListener('change', async (e) => {
      await api('PUT', `/api/timeline/${id}`, { description: task.description, offsetDays: task.offset_days, done: e.target.checked });
      await selectEvent(state.currentEvent.id);
    });
    row.querySelector('[data-action="edit"]').addEventListener('click', async () => {
      const description = prompt('Aufgabe:', task.description);
      if (description === null) return;
      const offsetDays = prompt('Tage relativ zum Event (negativ = vorher, 0 = am Tag selbst):', task.offset_days);
      if (offsetDays === null) return;
      await api('PUT', `/api/timeline/${id}`, { description, offsetDays, done: task.done });
      await selectEvent(state.currentEvent.id);
    });
    row.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm('Diese Zeitplan-Aufgabe loeschen?')) return;
      await api('DELETE', `/api/timeline/${id}`);
      await selectEvent(state.currentEvent.id);
    });
  });
}

// ---------------- Forms ----------------

function bindGlobalEvents() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
      btn.classList.add('active');
      el(`tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
  });

  el('btn-new-event').addEventListener('click', () => openEventModal());
  el('btn-cancel-event').addEventListener('click', closeEventModal);
  el('btn-edit-event').addEventListener('click', () => openEventModal(state.currentEvent));
  el('btn-delete-event').addEventListener('click', async () => {
    if (!confirm(`Event "${state.currentEvent.title}" wirklich loeschen?`)) return;
    const id = state.currentEvent.id;
    await api('DELETE', `/api/events/${id}`);
    state.currentEvent = null;
    el('event-detail').classList.add('hidden');
    el('empty-state').classList.remove('hidden');
    await loadEvents();
  });

  el('form-event').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if (state.editingEventId) {
      await api('PUT', `/api/events/${state.editingEventId}`, data);
    } else {
      const created = await api('POST', '/api/events', data);
      state.currentEvent = created;
    }
    closeEventModal();
    await loadEvents();
    if (state.currentEvent) await selectEvent(state.currentEvent.id);
  });

  el('form-guest').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await api('POST', `/api/events/${state.currentEvent.id}/guests`, data);
    e.target.reset();
    await selectEvent(state.currentEvent.id);
  });

  el('form-checklist').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await api('POST', `/api/events/${state.currentEvent.id}/checklist`, data);
    e.target.reset();
    await selectEvent(state.currentEvent.id);
    await loadEvents();
  });

  el('form-shopping').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await api('POST', `/api/events/${state.currentEvent.id}/checklist`, { category: 'einkauf', description: data.description });
    e.target.reset();
    await selectEvent(state.currentEvent.id);
    await loadEvents();
  });

  el('form-budget').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await api('POST', `/api/events/${state.currentEvent.id}/budget`, data);
    e.target.reset();
    await selectEvent(state.currentEvent.id);
    await loadEvents();
  });

  el('form-timeline').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    await api('POST', `/api/events/${state.currentEvent.id}/timeline`, data);
    e.target.reset();
    await selectEvent(state.currentEvent.id);
  });

  el('checklist-filter').addEventListener('change', (e) => {
    state.checklistFilter = e.target.value;
    renderChecklist();
  });
}

function openEventModal(event) {
  state.editingEventId = event ? event.id : null;
  el('modal-title').textContent = event ? 'Event bearbeiten' : 'Neues Event';
  const form = el('form-event');
  form.reset();
  if (event) {
    form.title.value = event.title || '';
    form.date.value = event.date || '';
    form.location.value = event.location || '';
    form.notes.value = event.notes || '';
  }
  el('modal-overlay').classList.remove('hidden');
}

function closeEventModal() {
  el('modal-overlay').classList.add('hidden');
  state.editingEventId = null;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

init();
