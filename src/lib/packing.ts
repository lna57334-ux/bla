import type { DestinationType, PackingListItem, PackingTemplate } from '../types'
import { uid } from './storage'

// Kategorien, deren Menge sich in etwa proportional zur Reisedauer verhält
// (z. B. Windeln, Bodys). Andere Kategorien (Gesundheit, Dokumente, Mobilität …)
// bleiben unabhängig von der Reisedauer weitgehend gleich.
const SKALIERBARE_KATEGORIEN = new Set(['Kleidung Baby', 'Hygiene', 'Strand'])

export function pickTemplate(
  templates: PackingTemplate[],
  reisetage: number,
  zielTyp: DestinationType,
): PackingTemplate | undefined {
  const passend = templates.filter(
    (t) => t.zielTyp === zielTyp && reisetage >= t.minTage && reisetage <= t.maxTage,
  )
  if (passend.length > 0) return passend[0]
  // Fallback: nächstliegende Vorlage desselben Zieltyps
  const sameType = templates.filter((t) => t.zielTyp === zielTyp)
  if (sameType.length === 0) return templates[0]
  return sameType.reduce((closest, t) => {
    const mid = (t.minTage + t.maxTage) / 2
    const closestMid = (closest.minTage + closest.maxTage) / 2
    return Math.abs(mid - reisetage) < Math.abs(closestMid - reisetage) ? t : closest
  }, sameType[0])
}

export function buildListFromTemplate(template: PackingTemplate, reisetage: number): PackingListItem[] {
  const baseline = (template.minTage + template.maxTage) / 2
  const faktor = baseline > 0 ? reisetage / baseline : 1

  return template.items.map((item) => {
    const skaliert = SKALIERBARE_KATEGORIEN.has(item.kategorie)
    const menge = skaliert ? Math.max(1, Math.round(item.menge * faktor)) : item.menge
    return { id: uid(), name: item.name, menge, kategorie: item.kategorie, erledigt: false }
  })
}
