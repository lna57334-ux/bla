// Zentrales Datenmodell für den Reiseplaner.
// Alles wird lokal (localStorage) gespeichert, siehe src/lib/storage.ts.

export type CriteriaKey =
  | 'warm'
  | 'meer'
  | 'alleinMitBaby'
  | 'medizinischeVersorgung'
  | 'sicherheit'
  | 'kinderfreundlich'

export const CRITERIA_LABELS: Record<CriteriaKey, string> = {
  warm: 'Warmes Klima',
  meer: 'Am Meer',
  alleinMitBaby: 'Gut allein mit Baby machbar',
  medizinischeVersorgung: 'Medizinische Versorgung',
  sicherheit: 'Sicherheit',
  kinderfreundlich: 'Kinderfreundlichkeit',
}

export const CRITERIA_ORDER: CriteriaKey[] = [
  'warm',
  'meer',
  'alleinMitBaby',
  'medizinischeVersorgung',
  'sicherheit',
  'kinderfreundlich',
]

export type DestinationStatus = 'idee' | 'shortlist' | 'geplant' | 'besucht'

export const DESTINATION_STATUS_LABELS: Record<DestinationStatus, string> = {
  idee: 'Idee',
  shortlist: 'Shortlist',
  geplant: 'Geplant',
  besucht: 'Besucht',
}

export interface ClimateInfo {
  besteMonate: number[] // 1-12
  nebensaisonMonate: number[] // 1-12
  temperaturSommerC?: number
  temperaturWinterC?: number
  preisNotizen: string // Notizen zu Nebensaison-Preisen
}

export interface Destination {
  id: string
  name: string
  land: string
  notizen: string
  ratings: Record<CriteriaKey, number> // 1-5
  status: DestinationStatus
  klima: ClimateInfo
  erstelltAm: string
}

export interface Activity {
  id: string
  destinationId: string
  name: string
  kategorie: string
  babyfreundlich: boolean
  altersHinweis: string
  kostenNiveau: 1 | 2 | 3
  notizen: string
}

export type DestinationType = 'warm' | 'kalt' | 'allgemein'

export interface PackingItem {
  id: string
  name: string
  menge: number
  kategorie: string
}

export interface PackingTemplate {
  id: string
  name: string
  minTage: number
  maxTage: number
  zielTyp: DestinationType
  items: PackingItem[]
}

export interface PackingListItem extends PackingItem {
  erledigt: boolean
}

export interface PackingListInstance {
  id: string
  name: string
  templateId?: string
  destinationId?: string
  reisetage: number
  items: PackingListItem[]
  erstelltAm: string
}

export type CabinClass = 'economy' | 'premium' | 'business' | 'first'
export type RouteType = 'kurzstrecke' | 'langstrecke'

export const CABIN_CLASS_LABELS: Record<CabinClass, string> = {
  economy: 'Economy',
  premium: 'Premium Economy',
  business: 'Business',
  first: 'First',
}

export interface MilesCalculation {
  id: string
  bezeichnung: string
  barpreisEUR: number
  meilenBenoetigt: number
  steuernGebuehrenEUR: number
  cabinClass: CabinClass
  routeType: RouteType
  erstelltAm: string
}

export type TripType = 'centerparcs' | 'international'

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  centerparcs: 'Center Parcs (national)',
  international: 'International',
}

export interface BudgetCategory {
  id: string
  name: string
  geplantEUR: number
  tatsaechlichEUR: number
}

export interface BudgetTrip {
  id: string
  typ: TripType
  titel: string
  jahr: number
  geplantesDatum?: string
  kategorien: BudgetCategory[]
  notizen: string
}
