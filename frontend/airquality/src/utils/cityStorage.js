const STORAGE_KEY = 'smartweather.defaultCity'

export function getDefaultCity() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'Pune'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored?.trim() || 'Pune'
}

export function setDefaultCity(city) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  const normalized = String(city || '').trim()
  if (!normalized) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, normalized)
}
