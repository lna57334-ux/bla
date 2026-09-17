import { useEffect, useState } from 'react'

// Einfache localStorage-Persistenz pro Datentyp, damit die App komplett
// lokal läuft und ohne Backend funktioniert.
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage evtl. voll oder nicht verfügbar (privater Modus) – ignorieren
    }
  }, [key, value])

  return [value, setValue] as const
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
