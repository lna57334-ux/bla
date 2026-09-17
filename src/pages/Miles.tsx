import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { CabinClass, MilesCalculation, RouteType } from '../types'
import { CABIN_CLASS_LABELS } from '../types'
import { calculateMilesValue, emptyMilesCalculation } from '../lib/miles'
import { uid } from '../lib/storage'
import { Badge, Button, Card, SectionTitle, Select, TextInput } from '../components/ui'

export default function Miles({
  calculations,
  setCalculations,
}: {
  calculations: MilesCalculation[]
  setCalculations: Dispatch<SetStateAction<MilesCalculation[]>>
}) {
  const [draft, setDraft] = useState(emptyMilesCalculation())

  const result = useMemo(() => calculateMilesValue(draft), [draft])

  function save() {
    const entry: MilesCalculation = { ...draft, id: uid(), erstelltAm: new Date().toISOString() }
    setCalculations((prev) => [entry, ...prev])
    setDraft(emptyMilesCalculation())
  }

  function remove(id: string) {
    setCalculations((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle subtitle="Lohnt sich die Meileneinlösung für diesen Flug – oder lieber bar zahlen und sammeln?">
        Meilen- &amp; Punkte-Rechner
      </SectionTitle>

      <Card className="flex flex-col gap-3">
        <TextInput
          value={draft.bezeichnung}
          onChange={(v) => setDraft({ ...draft, bezeichnung: v })}
          placeholder="Bezeichnung (z. B. Flug Mallorca Hin/Rück)"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Regulärer Barpreis (€)</label>
            <TextInput
              type="number"
              value={draft.barpreisEUR}
              onChange={(v) => setDraft({ ...draft, barpreisEUR: Number(v) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Nötige Meilen</label>
            <TextInput
              type="number"
              value={draft.meilenBenoetigt}
              onChange={(v) => setDraft({ ...draft, meilenBenoetigt: Number(v) })}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Steuern &amp; Gebühren bei Meilenbuchung (€)
          </label>
          <TextInput
            type="number"
            value={draft.steuernGebuehrenEUR}
            onChange={(v) => setDraft({ ...draft, steuernGebuehrenEUR: Number(v) })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Reiseklasse</label>
            <Select
              value={draft.cabinClass}
              onChange={(v) => setDraft({ ...draft, cabinClass: v as CabinClass })}
              options={Object.entries(CABIN_CLASS_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Streckentyp</label>
            <Select
              value={draft.routeType}
              onChange={(v) => setDraft({ ...draft, routeType: v as RouteType })}
              options={[
                { value: 'kurzstrecke', label: 'Kurzstrecke' },
                { value: 'langstrecke', label: 'Langstrecke' },
              ]}
            />
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Wert pro Meile</span>
            <span className="text-lg font-semibold text-slate-900">{result.centPerMile.toFixed(2)} ct</span>
          </div>
          <div className="mt-2">
            <Badge tone={result.lohntSich ? 'good' : 'warn'}>
              {result.lohntSich ? 'Meilen einlösen lohnt sich' : 'Eher bar zahlen & sammeln'}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-slate-500">{result.empfehlung}</p>
          <p className="mt-1 text-xs text-slate-400">{result.faustregelHinweis}</p>
        </div>

        <Button onClick={save} disabled={!draft.bezeichnung.trim()}>
          Berechnung speichern
        </Button>
      </Card>

      {calculations.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Gespeicherte Berechnungen</h3>
          {calculations.map((c) => {
            const r = calculateMilesValue(c)
            return (
              <Card key={c.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{c.bezeichnung}</p>
                  <p className="text-xs text-slate-500">
                    {c.barpreisEUR} € · {c.meilenBenoetigt.toLocaleString('de-DE')} Meilen ·{' '}
                    {CABIN_CLASS_LABELS[c.cabinClass]} · {c.routeType === 'kurzstrecke' ? 'Kurzstrecke' : 'Langstrecke'}
                  </p>
                  <Badge tone={r.lohntSich ? 'good' : 'warn'}>{r.centPerMile.toFixed(2)} ct/Meile</Badge>
                </div>
                <Button variant="ghost" onClick={() => remove(c.id)}>
                  ✕
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="bg-brand-50 text-sm text-brand-900">
        <p className="font-medium">Faustregel</p>
        <p className="mt-1">
          Ab ca. 1,5 Cent pro Meile aufwärts lohnt sich das Einlösen meist. Darunter lieber bar zahlen und bei der
          Buchung Meilen/Punkte sammeln (z. B. über Buchungsplattform oder Kreditkarte). Kurzstrecke/Economy: meist
          bar zahlen &amp; sammeln. Langstrecke/Business Class: eher Meilen einlösen.
        </p>
      </Card>
    </div>
  )
}
