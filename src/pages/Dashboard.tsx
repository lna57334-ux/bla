import type { BudgetTrip, Destination } from '../types'
import { CRITERIA_ORDER, TRIP_TYPE_LABELS } from '../types'
import { Badge, Card, SectionTitle } from '../components/ui'

function averageRating(d: Destination) {
  const vals = CRITERIA_ORDER.map((k) => d.ratings[k])
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

export default function Dashboard({
  destinations,
  budgetTrips,
  onNavigate,
}: {
  destinations: Destination[]
  budgetTrips: BudgetTrip[]
  onNavigate: (tab: string) => void
}) {
  const shortlist = destinations
    .filter((d) => d.status === 'shortlist' || d.status === 'geplant')
    .sort((a, b) => averageRating(b) - averageRating(a))
    .slice(0, 3)

  const thisYear = new Date().getFullYear()
  const tripsThisYear = budgetTrips.filter((t) => t.jahr === thisYear)
  const centerParcsDone = tripsThisYear.some((t) => t.typ === 'centerparcs')
  const internationalDone = tripsThisYear.some((t) => t.typ === 'international')

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle subtitle="Schneller Überblick über Shortlist, Reiserhythmus und nächste Schritte.">
        Willkommen zurück 👋
      </SectionTitle>

      <Card>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Top-Shortlist</h3>
        {shortlist.length === 0 ? (
          <p className="text-sm text-slate-500">
            Noch nichts auf der Shortlist –{' '}
            <button className="text-brand-700 underline" onClick={() => onNavigate('destinations')}>
              Ziele bewerten
            </button>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {shortlist.map((d) => (
              <div key={d.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.land}</p>
                </div>
                <span className="text-sm font-medium text-amber-500">★ {averageRating(d).toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Reiserhythmus {thisYear}</h3>
        <p className="mb-2 text-xs text-slate-500">Geplant: 1× Center Parcs (Meilensammeln) + 1× international</p>
        <div className="flex gap-2">
          <Badge tone={centerParcsDone ? 'good' : 'warn'}>
            {TRIP_TYPE_LABELS.centerparcs}: {centerParcsDone ? 'geplant' : 'offen'}
          </Badge>
          <Badge tone={internationalDone ? 'good' : 'warn'}>
            {TRIP_TYPE_LABELS.international}: {internationalDone ? 'geplant' : 'offen'}
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <QuickLink icon="🗺️" label="Ziele verwalten" onClick={() => onNavigate('destinations')} />
        <QuickLink icon="✈️" label="Meilen rechnen" onClick={() => onNavigate('miles')} />
        <QuickLink icon="🧳" label="Packliste erstellen" onClick={() => onNavigate('packing')} />
        <QuickLink icon="💶" label="Budget prüfen" onClick={() => onNavigate('budget')} />
      </div>
    </div>
  )
}

function QuickLink({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200 active:scale-[0.98]"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </button>
  )
}
