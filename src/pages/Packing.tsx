import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Destination, DestinationType, PackingListInstance, PackingTemplate } from '../types'
import { uid } from '../lib/storage'
import { buildListFromTemplate, pickTemplate } from '../lib/packing'
import { Badge, Button, Card, SectionTitle, Select, TextInput } from '../components/ui'

const ZIEL_TYP_LABELS: Record<DestinationType, string> = {
  warm: 'Warmes Ziel',
  kalt: 'Kälteres/wechselhaftes Ziel',
  allgemein: 'Allgemein',
}

export default function Packing({
  templates,
  lists,
  setLists,
  destinations,
}: {
  templates: PackingTemplate[]
  lists: PackingListInstance[]
  setLists: Dispatch<SetStateAction<PackingListInstance[]>>
  destinations: Destination[]
}) {
  const [reisetage, setReisetage] = useState(7)
  const [zielTyp, setZielTyp] = useState<DestinationType>('warm')
  const [destinationId, setDestinationId] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const vorschlag = useMemo(() => pickTemplate(templates, reisetage, zielTyp), [templates, reisetage, zielTyp])

  function generiereListe() {
    if (!vorschlag) return
    const dest = destinations.find((d) => d.id === destinationId)
    const items = buildListFromTemplate(vorschlag, reisetage)
    const instance: PackingListInstance = {
      id: uid(),
      name: dest ? `${dest.name} (${reisetage} Tage)` : `${vorschlag.name} – ${reisetage} Tage`,
      templateId: vorschlag.id,
      destinationId: destinationId || undefined,
      reisetage,
      items,
      erstelltAm: new Date().toISOString(),
    }
    setLists((prev) => [instance, ...prev])
    setExpandedId(instance.id)
  }

  function toggleItem(listId: string, itemId: string) {
    setLists((prev) =>
      prev.map((l) =>
        l.id !== listId
          ? l
          : { ...l, items: l.items.map((it) => (it.id === itemId ? { ...it, erledigt: !it.erledigt } : it)) },
      ),
    )
  }

  function removeList(id: string) {
    setLists((prev) => prev.filter((l) => l.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle subtitle="Vorlagen passen sich an Reisedauer und Zieltyp an.">Packliste</SectionTitle>

      <Card className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Reisedauer (Tage)</label>
            <TextInput type="number" value={reisetage} onChange={(v) => setReisetage(Math.max(1, Number(v)))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Zieltyp</label>
            <Select
              value={zielTyp}
              onChange={(v) => setZielTyp(v as DestinationType)}
              options={Object.entries(ZIEL_TYP_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Ziel (optional)</label>
          <Select
            value={destinationId}
            onChange={setDestinationId}
            options={[{ value: '', label: '– kein Ziel verknüpft –' }, ...destinations.map((d) => ({ value: d.id, label: d.name }))]}
          />
        </div>
        {vorschlag && (
          <p className="text-xs text-slate-500">
            Vorschlag: <span className="font-medium text-slate-700">{vorschlag.name}</span> ({vorschlag.items.length}{' '}
            Artikel)
          </p>
        )}
        <Button onClick={generiereListe} disabled={!vorschlag}>
          Packliste generieren
        </Button>
      </Card>

      <div className="flex flex-col gap-3">
        {lists.length === 0 && <p className="text-sm text-slate-500">Noch keine Packliste erstellt.</p>}
        {lists.map((l) => {
          const isOpen = expandedId === l.id
          const done = l.items.filter((i) => i.erledigt).length
          return (
            <Card key={l.id}>
              <button className="flex w-full items-center justify-between" onClick={() => setExpandedId(isOpen ? null : l.id)}>
                <div>
                  <p className="font-medium text-slate-900">{l.name}</p>
                  <p className="text-xs text-slate-500">{l.reisetage} Tage · {l.items.length} Artikel</p>
                </div>
                <Badge tone={done === l.items.length ? 'good' : 'default'}>
                  {done}/{l.items.length}
                </Badge>
              </button>

              {isOpen && (
                <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3">
                  {Object.entries(groupByCategory(l)).map(([kategorie, items]) => (
                    <div key={kategorie} className="mb-2">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{kategorie}</p>
                      {items.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={item.erledigt}
                            onChange={() => toggleItem(l.id, item.id)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                          <span className={item.erledigt ? 'text-slate-400 line-through' : 'text-slate-700'}>
                            {item.name} {item.menge > 1 ? `× ${item.menge}` : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}
                  <Button variant="danger" onClick={() => removeList(l.id)} className="mt-2">
                    Liste löschen
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

function groupByCategory(list: PackingListInstance) {
  return list.items.reduce<Record<string, PackingListInstance['items']>>((acc, item) => {
    acc[item.kategorie] = acc[item.kategorie] || []
    acc[item.kategorie].push(item)
    return acc
  }, {})
}
