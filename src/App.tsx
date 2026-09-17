import { useState } from 'react'
import type {
  Activity,
  BudgetTrip,
  Destination,
  MilesCalculation,
  PackingListInstance,
  PackingTemplate,
} from './types'
import { usePersistentState } from './lib/storage'
import {
  SEED_ACTIVITIES,
  SEED_BUDGET_TRIPS,
  SEED_DESTINATIONS,
  SEED_PACKING_TEMPLATES,
} from './lib/seedData'
import Dashboard from './pages/Dashboard'
import Destinations from './pages/Destinations'
import Miles from './pages/Miles'
import Packing from './pages/Packing'
import Activities from './pages/Activities'
import Budget from './pages/Budget'

type TabKey = 'dashboard' | 'destinations' | 'miles' | 'packing' | 'activities' | 'budget'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Übersicht', icon: '🏠' },
  { key: 'destinations', label: 'Ziele', icon: '🗺️' },
  { key: 'miles', label: 'Meilen', icon: '✈️' },
  { key: 'packing', label: 'Packen', icon: '🧳' },
  { key: 'activities', label: 'Aktivitäten', icon: '🧸' },
  { key: 'budget', label: 'Budget', icon: '💶' },
]

export default function App() {
  const [tab, setTab] = useState<TabKey>('dashboard')

  const [destinations, setDestinations] = usePersistentState<Destination[]>(
    'reiseplaner.destinations',
    SEED_DESTINATIONS,
  )
  const [activities, setActivities] = usePersistentState<Activity[]>(
    'reiseplaner.activities',
    SEED_ACTIVITIES,
  )
  const [packingTemplates] = usePersistentState<PackingTemplate[]>(
    'reiseplaner.packingTemplates',
    SEED_PACKING_TEMPLATES,
  )
  const [packingLists, setPackingLists] = usePersistentState<PackingListInstance[]>(
    'reiseplaner.packingLists',
    [],
  )
  const [milesCalculations, setMilesCalculations] = usePersistentState<MilesCalculation[]>(
    'reiseplaner.milesCalculations',
    [],
  )
  const [budgetTrips, setBudgetTrips] = usePersistentState<BudgetTrip[]>(
    'reiseplaner.budgetTrips',
    SEED_BUDGET_TRIPS,
  )

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-10 bg-brand-700 px-4 py-3 text-white shadow">
        <h1 className="text-lg font-semibold">🌴 Reiseplaner</h1>
        <p className="text-xs text-brand-100">für Mama &amp; Baby unterwegs</p>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        {tab === 'dashboard' && (
          <Dashboard
            destinations={destinations}
            budgetTrips={budgetTrips}
            onNavigate={(t) => setTab(t as TabKey)}
          />
        )}
        {tab === 'destinations' && (
          <Destinations destinations={destinations} setDestinations={setDestinations} />
        )}
        {tab === 'miles' && (
          <Miles calculations={milesCalculations} setCalculations={setMilesCalculations} />
        )}
        {tab === 'packing' && (
          <Packing
            templates={packingTemplates}
            lists={packingLists}
            setLists={setPackingLists}
            destinations={destinations}
          />
        )}
        {tab === 'activities' && (
          <Activities
            activities={activities}
            setActivities={setActivities}
            destinations={destinations}
          />
        )}
        {tab === 'budget' && <Budget trips={budgetTrips} setTrips={setBudgetTrips} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-2xl justify-between px-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                tab === t.key ? 'text-brand-700' : 'text-slate-400'
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
