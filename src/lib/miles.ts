import type { CabinClass, MilesCalculation, RouteType } from '../types'

export interface MilesResult {
  centPerMile: number
  lohntSich: boolean
  faustregelHinweis: string
  empfehlung: string
}

const CENT_PER_MILE_THRESHOLD = 1.5

// Faustregel: ab ~1,5 Cent/Meile lohnt sich das Einlösen.
// Kurzstrecke/Economy: eher bar zahlen & Meilen/Punkte sammeln.
// Langstrecke/Business: eher Meilen einlösen.
export function calculateMilesValue(calc: {
  barpreisEUR: number
  meilenBenoetigt: number
  steuernGebuehrenEUR: number
  cabinClass: CabinClass
  routeType: RouteType
}): MilesResult {
  const einsparung = calc.barpreisEUR - calc.steuernGebuehrenEUR
  const centPerMile = calc.meilenBenoetigt > 0 ? (einsparung / calc.meilenBenoetigt) * 100 : 0
  const lohntSich = centPerMile >= CENT_PER_MILE_THRESHOLD

  const istKurzstreckeEconomy = calc.routeType === 'kurzstrecke' && calc.cabinClass === 'economy'
  const istLangstreckeBusiness =
    calc.routeType === 'langstrecke' && (calc.cabinClass === 'business' || calc.cabinClass === 'first')

  let faustregelHinweis = ''
  if (istKurzstreckeEconomy) {
    faustregelHinweis =
      'Faustregel: Kurzstrecke/Economy – meist lohnt sich Barzahlung mehr, dafür bei der Buchung Meilen/Punkte sammeln.'
  } else if (istLangstreckeBusiness) {
    faustregelHinweis = 'Faustregel: Langstrecke/Business – hier lohnt sich eine Meileneinlösung tendenziell eher.'
  } else {
    faustregelHinweis = 'Individuell prüfen – diese Kombination liegt zwischen den typischen Faustregel-Fällen.'
  }

  const empfehlung = lohntSich
    ? `Guter Wert (${centPerMile.toFixed(2)} ct/Meile ≥ ${CENT_PER_MILE_THRESHOLD.toFixed(1)} ct). Meilen einlösen lohnt sich.`
    : `Niedriger Wert (${centPerMile.toFixed(2)} ct/Meile < ${CENT_PER_MILE_THRESHOLD.toFixed(1)} ct). Eher bar zahlen und stattdessen Meilen/Punkte sammeln (z. B. über Buchungsplattform oder Kreditkarte).`

  return { centPerMile, lohntSich, faustregelHinweis, empfehlung }
}

export function emptyMilesCalculation(): Omit<MilesCalculation, 'id' | 'erstelltAm'> {
  return {
    bezeichnung: '',
    barpreisEUR: 0,
    meilenBenoetigt: 0,
    steuernGebuehrenEUR: 0,
    cabinClass: 'economy',
    routeType: 'kurzstrecke',
  }
}
