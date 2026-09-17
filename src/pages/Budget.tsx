import type { Dispatch, SetStateAction } from 'react'
import type { BudgetCategory, BudgetTrip, TripType } from '../types'
import { TRIP_TYPE_LABELS } from '../types'
import { uid } from '../lib/storage'
import { Badge, Button, Card, SectionTitle, TextInput } from '../components/ui'

function emptyTrip(typ: TripType): BudgetTrip {
  return {
    id: uid(),
    typ,
    titel: typ === 'centerparcs' ? 'Center Parcs Trip' : 'Internationale Reise',
    jahr: new Date().getFullYear(),
    kategorien: [],
    notizen: '',
  }
}

function tripTotals(trip: BudgetTrip) {
  const geplant = trip.kategorien.reduce((s, c) => s + c.geplantEUR, 0)
  const tatsaechlich = trip.kategorien.reduce((s, c) => s + c.tatsaechlichEUR, 0)
  return { geplant, tatsaechlich }
}

export default function Budget({
  trips,
  setTrips,
}: {
  trips: BudgetTrip[]
  setTrips: Dispatch<SetStateAction<BudgetTrip[]>>
}) {
  function addTrip(typ: TripType) {
    setTrips((prev) => [...prev, emptyTrip(typ)])
  }

  function updateTrip(id: string, updater: (t: BudgetTrip) => BudgetTrip) {
    setTrips((prev) => prev.map((t) => (t.id === id ? updater(t) : t)))
  }

  function removeTrip(id: string) {
    setTrips((prev) => prev.filter((t) => t.id !== id))
  }

  function addCategory(tripId: string) {
    const cat: BudgetCategory = { id: uid(), name: 'Neue Kategorie', geplantEUR: 0, tatsaechlichEUR: 0 }
    updateTrip(tripId, (t) => ({ ...t, kategorien: [...t.kategorien, cat] }))
  }

  function updateCategory(tripId: string, catId: string, updater: (c: BudgetCategory) => BudgetCategory) {
    updateTrip(tripId, (t) => ({
      ...t,
      kategorien: t.kategorien.map((c) => (c.id === catId ? updater(c) : c)),
    }))
  }

  function removeCategory(tripId: string, catId: string) {
    updateTrip(tripId, (t) => ({ ...t, kategorien: t.kategorien.filter((c) => c.id !== catId) }))
  }

  const groups: TripType[] = ['centerparcs', 'international']

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle subtitle="Geplanter Rhythmus: 1x Center Parcs (Meilensammeln) + 1x international pro Jahr.">
        Budget
      </SectionTitle>

      {groups.map((typ) => {
        const tripsOfType = trips.filter((t) => t.typ === typ)
        return (
          <div key={typ} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">{TRIP_TYPE_LABELS[typ]}</h3>
              <Button variant="secondary" onClick={() => addTrip(typ)}>
                + Reise
              </Button>
            </div>

            {tripsOfType.length === 0 && <p className="text-sm text-slate-500">Noch keine Reise erfasst.</p>}

            {tripsOfType.map((trip) => {
              const totals = tripTotals(trip)
              const diff = totals.tatsaechlich - totals.geplant
              return (
                <Card key={trip.id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <TextInput
                      value={trip.titel}
                      onChange={(v) => updateTrip(trip.id, (t) => ({ ...t, titel: v }))}
                      className="font-medium"
                    />
                    <TextInput
                      type="number"
                      value={trip.jahr}
                      onChange={(v) => updateTrip(trip.id, (t) => ({ ...t, jahr: Number(v) }))}
                      className="w-24"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    {trip.kategorien.map((c) => (
                      <div key={c.id} className="grid grid-cols-[1fr_80px_80px_28px] items-center gap-2">
                        <TextInput
                          value={c.name}
                          onChange={(v) => updateCategory(trip.id, c.id, (cc) => ({ ...cc, name: v }))}
                        />
                        <TextInput
                          type="number"
                          value={c.geplantEUR}
                          onChange={(v) =>
                            updateCategory(trip.id, c.id, (cc) => ({ ...cc, geplantEUR: Number(v) }))
                          }
                        />
                        <TextInput
                          type="number"
                          value={c.tatsaechlichEUR}
                          onChange={(v) =>
                            updateCategory(trip.id, c.id, (cc) => ({ ...cc, tatsaechlichEUR: Number(v) }))
                          }
                        />
                        <button
                          onClick={() => removeCategory(trip.id, c.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {trip.kategorien.length > 0 && (
                      <div className="grid grid-cols-[1fr_80px_80px_28px] gap-2 text-xs text-slate-400">
                        <span>Kategorie</span>
                        <span>Geplant €</span>
                        <span>Ist €</span>
                        <span />
                      </div>
                    )}
                    <Button variant="secondary" onClick={() => addCategory(trip.id)}>
                      + Kategorie
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                    <span>
                      Geplant: <strong>{totals.geplant.toLocaleString('de-DE')} €</strong> · Ist:{' '}
                      <strong>{totals.tatsaechlich.toLocaleString('de-DE')} €</strong>
                    </span>
                    <Badge tone={diff > 0 ? 'warn' : 'good'}>
                      {diff > 0 ? `+${diff.toLocaleString('de-DE')} €` : `${diff.toLocaleString('de-DE')} €`}
                    </Badge>
                  </div>

                  <Button variant="danger" onClick={() => removeTrip(trip.id)}>
                    Reise löschen
                  </Button>
                </Card>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
