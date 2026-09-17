import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Destination, DestinationStatus } from '../types'
import {
  CRITERIA_LABELS,
  CRITERIA_ORDER,
  DESTINATION_STATUS_LABELS,
} from '../types'
import { uid } from '../lib/storage'
import {
  Badge,
  Button,
  Card,
  MONTH_LABELS,
  Select,
  StarRating,
  SectionTitle,
  TextArea,
  TextInput,
} from '../components/ui'

function emptyDestination(): Destination {
  return {
    id: uid(),
    name: '',
    land: '',
    notizen: '',
    ratings: {
      warm: 3,
      meer: 3,
      alleinMitBaby: 3,
      medizinischeVersorgung: 3,
      sicherheit: 3,
      kinderfreundlich: 3,
    },
    status: 'idee',
    klima: {
      besteMonate: [],
      nebensaisonMonate: [],
      preisNotizen: '',
    },
    erstelltAm: new Date().toISOString(),
  }
}

function averageRating(d: Destination) {
  const vals = CRITERIA_ORDER.map((k) => d.ratings[k])
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export default function Destinations({
  destinations,
  setDestinations,
}: {
  destinations: Destination[]
  setDestinations: Dispatch<SetStateAction<Destination[]>>
}) {
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState<Destination>(emptyDestination())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'alle' | DestinationStatus>('alle')

  const filtered = useMemo(() => {
    const list = filter === 'alle' ? destinations : destinations.filter((d) => d.status === filter)
    return [...list].sort((a, b) => averageRating(b) - averageRating(a))
  }, [destinations, filter])

  function addDestination() {
    if (!draft.name.trim()) return
    setDestinations((prev) => [...prev, draft])
    setDraft(emptyDestination())
    setShowForm(false)
  }

  function updateDestination(id: string, updater: (d: Destination) => Destination) {
    setDestinations((prev) => prev.map((d) => (d.id === id ? updater(d) : d)))
  }

  function removeDestination(id: string) {
    setDestinations((prev) => prev.filter((d) => d.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle subtitle="Wunschziele eintragen, bewerten und auf der Shortlist sammeln.">
        Destinationsplanung
      </SectionTitle>

      <div className="flex items-center justify-between gap-2">
        <Select
          value={filter}
          onChange={(v) => setFilter(v as typeof filter)}
          options={[
            { value: 'alle', label: `Alle (${destinations.length})` },
            ...(['idee', 'shortlist', 'geplant', 'besucht'] as DestinationStatus[]).map((s) => ({
              value: s,
              label: DESTINATION_STATUS_LABELS[s],
            })),
          ]}
          className="max-w-[200px]"
        />
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Abbrechen' : '+ Ziel hinzufügen'}</Button>
      </div>

      {showForm && (
        <Card className="flex flex-col gap-3">
          <TextInput value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Name des Ziels" />
          <TextInput value={draft.land} onChange={(v) => setDraft({ ...draft, land: v })} placeholder="Land / Region" />
          <TextArea value={draft.notizen} onChange={(v) => setDraft({ ...draft, notizen: v })} placeholder="Notizen" rows={2} />
          <Button onClick={addDestination}>Speichern</Button>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500">Keine Ziele in dieser Ansicht.</p>
        )}
        {filtered.map((d) => {
          const isOpen = expandedId === d.id
          const avg = averageRating(d)
          return (
            <Card key={d.id}>
              <button
                className="flex w-full items-start justify-between gap-2 text-left"
                onClick={() => setExpandedId(isOpen ? null : d.id)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{d.name || 'Unbenannt'}</h3>
                    <Badge tone={d.status === 'shortlist' ? 'brand' : 'default'}>
                      {DESTINATION_STATUS_LABELS[d.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">{d.land}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-amber-500">
                  ★ {avg.toFixed(1)}
                </div>
              </button>

              {isOpen && (
                <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
                    <Select
                      value={d.status}
                      onChange={(v) =>
                        updateDestination(d.id, (dd) => ({ ...dd, status: v as DestinationStatus }))
                      }
                      options={(['idee', 'shortlist', 'geplant', 'besucht'] as DestinationStatus[]).map((s) => ({
                        value: s,
                        label: DESTINATION_STATUS_LABELS[s],
                      }))}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-slate-500">Bewertung der Kriterien</span>
                    {CRITERIA_ORDER.map((key) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-700">{CRITERIA_LABELS[key]}</span>
                        <StarRating
                          value={d.ratings[key]}
                          onChange={(v) =>
                            updateDestination(d.id, (dd) => ({
                              ...dd,
                              ratings: { ...dd.ratings, [key]: v },
                            }))
                          }
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Beste Reisezeit</label>
                    <MonthPicker
                      selected={d.klima.besteMonate}
                      onChange={(months) =>
                        updateDestination(d.id, (dd) => ({ ...dd, klima: { ...dd.klima, besteMonate: months } }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Nebensaison</label>
                    <MonthPicker
                      selected={d.klima.nebensaisonMonate}
                      onChange={(months) =>
                        updateDestination(d.id, (dd) => ({
                          ...dd,
                          klima: { ...dd.klima, nebensaisonMonate: months },
                        }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Ø Temp. Sommer (°C)</label>
                      <TextInput
                        type="number"
                        value={d.klima.temperaturSommerC ?? ''}
                        onChange={(v) =>
                          updateDestination(d.id, (dd) => ({
                            ...dd,
                            klima: { ...dd.klima, temperaturSommerC: v === '' ? undefined : Number(v) },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Ø Temp. Winter (°C)</label>
                      <TextInput
                        type="number"
                        value={d.klima.temperaturWinterC ?? ''}
                        onChange={(v) =>
                          updateDestination(d.id, (dd) => ({
                            ...dd,
                            klima: { ...dd.klima, temperaturWinterC: v === '' ? undefined : Number(v) },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Nebensaison-Preise – Notizen
                    </label>
                    <TextArea
                      value={d.klima.preisNotizen}
                      onChange={(v) =>
                        updateDestination(d.id, (dd) => ({ ...dd, klima: { ...dd.klima, preisNotizen: v } }))
                      }
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Notizen</label>
                    <TextArea
                      value={d.notizen}
                      onChange={(v) => updateDestination(d.id, (dd) => ({ ...dd, notizen: v }))}
                      rows={2}
                    />
                  </div>

                  <Button variant="danger" onClick={() => removeDestination(d.id)}>
                    Ziel löschen
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function MonthPicker({ selected, onChange }: { selected: number[]; onChange: (m: number[]) => void }) {
  function toggle(m: number) {
    onChange(selected.includes(m) ? selected.filter((x) => x !== m) : [...selected, m].sort((a, b) => a - b))
  }
  return (
    <div className="grid grid-cols-6 gap-1">
      {MONTH_LABELS.map((label, i) => {
        const m = i + 1
        const active = selected.includes(m)
        return (
          <button
            key={m}
            type="button"
            onClick={() => toggle(m)}
            className={`rounded-lg px-1.5 py-1 text-xs font-medium ${
              active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
