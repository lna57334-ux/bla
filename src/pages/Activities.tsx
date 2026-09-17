import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Activity, Destination } from '../types'
import { uid } from '../lib/storage'
import { Badge, Button, Card, SectionTitle, Select, TextArea, TextInput } from '../components/ui'

function emptyActivity(destinationId: string): Activity {
  return {
    id: uid(),
    destinationId,
    name: '',
    kategorie: '',
    babyfreundlich: true,
    altersHinweis: '',
    kostenNiveau: 1,
    notizen: '',
  }
}

export default function Activities({
  activities,
  setActivities,
  destinations,
}: {
  activities: Activity[]
  setActivities: Dispatch<SetStateAction<Activity[]>>
  destinations: Destination[]
}) {
  const [filterDestination, setFilterDestination] = useState<string>('')
  const [onlyBabyFriendly, setOnlyBabyFriendly] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState<Activity>(emptyActivity(destinations[0]?.id ?? ''))

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (filterDestination && a.destinationId !== filterDestination) return false
      if (onlyBabyFriendly && !a.babyfreundlich) return false
      return true
    })
  }, [activities, filterDestination, onlyBabyFriendly])

  function destinationName(id: string) {
    return destinations.find((d) => d.id === id)?.name ?? 'Unbekanntes Ziel'
  }

  function addActivity() {
    if (!draft.name.trim() || !draft.destinationId) return
    setActivities((prev) => [...prev, draft])
    setDraft(emptyActivity(draft.destinationId))
    setShowForm(false)
  }

  function removeActivity(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle subtitle="Ausflugsziele pro Destination, mit Fokus auf babyfreundliche Optionen.">
        Aktivitäten &amp; Ausflüge
      </SectionTitle>

      <div className="flex flex-col gap-2">
        <Select
          value={filterDestination}
          onChange={setFilterDestination}
          options={[{ value: '', label: 'Alle Ziele' }, ...destinations.map((d) => ({ value: d.id, label: d.name }))]}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={onlyBabyFriendly}
              onChange={(e) => setOnlyBabyFriendly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Nur babyfreundlich
          </label>
          <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Abbrechen' : '+ Aktivität'}</Button>
        </div>
      </div>

      {showForm && (
        <Card className="flex flex-col gap-3">
          <Select
            value={draft.destinationId}
            onChange={(v) => setDraft({ ...draft, destinationId: v })}
            options={destinations.map((d) => ({ value: d.id, label: d.name }))}
          />
          <TextInput value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Name der Aktivität" />
          <TextInput
            value={draft.kategorie}
            onChange={(v) => setDraft({ ...draft, kategorie: v })}
            placeholder="Kategorie (z. B. Strand, Ausflug, Kurs)"
          />
          <TextInput
            value={draft.altersHinweis}
            onChange={(v) => setDraft({ ...draft, altersHinweis: v })}
            placeholder="Altershinweis (z. B. ab 6 Monate)"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={draft.babyfreundlich}
              onChange={(e) => setDraft({ ...draft, babyfreundlich: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Babyfreundlich
          </label>
          <Select
            value={String(draft.kostenNiveau)}
            onChange={(v) => setDraft({ ...draft, kostenNiveau: Number(v) as 1 | 2 | 3 })}
            options={[
              { value: '1', label: '€ – günstig' },
              { value: '2', label: '€€ – mittel' },
              { value: '3', label: '€€€ – teuer' },
            ]}
          />
          <TextArea value={draft.notizen} onChange={(v) => setDraft({ ...draft, notizen: v })} placeholder="Notizen" rows={2} />
          <Button onClick={addActivity}>Speichern</Button>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && <p className="text-sm text-slate-500">Keine Aktivitäten gefunden.</p>}
        {filtered.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{a.name}</p>
                <p className="text-xs text-slate-500">
                  {destinationName(a.destinationId)} {a.kategorie && `· ${a.kategorie}`}
                </p>
                {a.altersHinweis && <p className="mt-1 text-xs text-slate-500">👶 {a.altersHinweis}</p>}
                {a.notizen && <p className="mt-1 text-xs text-slate-500">{a.notizen}</p>}
                <div className="mt-2 flex gap-2">
                  {a.babyfreundlich && <Badge tone="good">Babyfreundlich</Badge>}
                  <Badge>{'€'.repeat(a.kostenNiveau)}</Badge>
                </div>
              </div>
              <Button variant="ghost" onClick={() => removeActivity(a.id)}>
                ✕
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
