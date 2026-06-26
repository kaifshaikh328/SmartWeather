import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/sidebar'
import Header from '../components/Header'
import WeatherCard from '../components/Weathercard'
import AIInsight from '../components/AIInsight'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
const API_BASE_URL = (() => {
  if (!rawBaseUrl) return '/api'
  const trimmed = rawBaseUrl.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
})()

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

function parseNumber(value) {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') {
    const normalized = value.trim()
    if (normalized === '') return undefined
    const parsed = Number(normalized)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

function formatTemperature(value) {
  const num = parseNumber(value)
  if (num != null) {
    return `${Math.round(num)}°`
  }

  return value || '—'
}

function formatValue(value, suffix = '') {
  const num = parseNumber(value)
  if (num != null) {
    return `${Math.round(num * 10) / 10}${suffix}`
  }

  return value || '—'
}

function formatWindSpeed(value) {
  const num = parseNumber(value)
  if (num != null) {
    return `${Math.round(num)}`
  }
  return value || '—'
}

function getAQIStatus(value) {
  if (typeof value !== 'number') return 'Unknown'

  if (value <= 50) return 'Good'
  if (value <= 100) return 'Moderate'
  if (value <= 150) return 'Unhealthy for Sensitive Groups'

  return 'Unhealthy'
}

function getPM25Status(value) {
  if (typeof value !== 'number') return 'Unknown'

  if (value <= 12) return 'Good'
  if (value <= 35) return 'Moderate'
  if (value <= 55) return 'Unhealthy'

  return 'Very Unhealthy'
}

function getHumidityStatus(value) {
  if (typeof value !== 'number') return 'Unknown'

  if (value >= 40 && value <= 60) return 'Comfortable'
  if (value < 40) return 'Dry'

  return 'Humid'
}

function normalizeDashboard(payload) {
  const weather = payload?.weather || payload?.data?.current || {}
  const airQuality = payload?.air_quality || payload?.data?.air || {}
  const aiAnalysis = payload?.ai_analysis || ''

  const formatTime = (timestamp) => {
    if (!timestamp) return '—'
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp * 1000)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    return timestamp
  }

  return {
    city: weather.city || 'Unknown City',
    state: weather.state || '',
    country: weather.country || '',
    current: {
      temp: formatTemperature(weather.temperature ?? weather.temp),
      condition: weather.weather_condition || weather.condition || 'Unknown',
      feelsLike: formatTemperature(weather.feels_like ?? weather.feelsLike),
      visibility: formatValue(weather.visibility ?? 8, ' km'),
      uvIndex: formatValue(weather.uv_index ?? 3),
      sunrise: formatTime(weather.sunrise),
      sunset: formatTime(weather.sunset),
      humidity: weather.humidity,
      airQualityIndex: airQuality.air_quality_index ?? airQuality.aqi,
      pm25: airQuality.pollutants?.pm2_5 ?? airQuality.pm25,
      wind: formatWindSpeed(weather.wind_speed ?? weather.wind),
      rainProbability: weather.rainProbability ?? 0,
      airPurity: 100 - ((airQuality.air_quality_index ?? airQuality.aqi ?? 0) * 10),
      alert: airQuality.health_advice || 'Live climate update pending.',
      summary: aiAnalysis || 'The backend is providing live insights.',
    },
    forecast: [],
  }
}

export default function Forcast() {
  const [query, setQuery] = useState('Pune')
  const [city, setCity] = useState('Pune')
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingMessage, setLoadingMessage] = useState('Fetching weather data...')
  const [aiText, setAiText] = useState('')

  const handleSearch = (event) => {
    event.preventDefault()
    if (query.trim()) {
      setCity(query.trim())
      setLoading(true)
      setLoadingMessage('Fetching data for ' + query.trim() + '...')
    }
  }

  const debouncedCity = useDebounce(city, 300)

  useEffect(() => {
    let isActive = true
    let eventSource = null

    function loadDashboardStream(targetCity) {
      setLoading(true)
      setError('')
      setAiText('')
      setLoadingMessage('Fetching weather & air quality...')

      try {
        if (eventSource) {
          eventSource.close()
        }

        const streamUrl = `${API_BASE_URL}/weather/stream?city=${encodeURIComponent(targetCity)}`
        eventSource = new EventSource(streamUrl)

        eventSource.onopen = () => {
          setLoadingMessage('Processing AI analysis...')
        }

        eventSource.onmessage = (event) => {
          if (!isActive) return

          try {
            const data = JSON.parse(event.data)

            if (data.type === 'metadata') {
              setDashboard(normalizeDashboard({
                weather: data.weather,
                air_quality: data.air_quality,
                ai_analysis: '',
              }))
              setLoadingMessage('Receiving AI analysis...')
            } else if (data.type === 'chunk') {
              setAiText((prev) => prev + data.text)
            } else if (data.type === 'complete') {
              setLoadingMessage('')
              setLoading(false)
              eventSource.close()
            }
          } catch (err) {
            console.error('Error parsing stream data:', err)
          }
        }

        eventSource.onerror = (err) => {
          if (!isActive) return

          fetch(`${API_BASE_URL}/weather?city=${encodeURIComponent(targetCity)}`)
            .then((res) => {
              if (!res.ok) throw new Error(`Backend returned ${res.status}`)
              return res.json()
            })
            .then((payload) => {
              if (!isActive) return
              const normalized = normalizeDashboard(payload)
              setDashboard(normalized)
              setAiText(normalized.current.summary)
              setLoadingMessage('')
              setLoading(false)
            })
            .catch((fetchError) => {
              if (!isActive) return
              setError(fetchError instanceof Error ? fetchError.message : 'Unable to load data')
              setLoadingMessage('')
              setLoading(false)
            })

          eventSource.close()
        }
      } catch (err) {
        if (!isActive) return
        setError(err instanceof Error ? err.message : 'Connection failed')
        setLoadingMessage('')
        setLoading(false)
      }
    }

    if (debouncedCity) {
      loadDashboardStream(debouncedCity)
    }

    return () => {
      isActive = false
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [debouncedCity])

  const locationLabel = useMemo(() => {
    if (!dashboard) return 'Loading location...'
    return [dashboard.city, dashboard.state, dashboard.country].filter(Boolean).join(', ')
  }, [dashboard])

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[320px_1fr] gap-6">
        <Sidebar />

        <div className="space-y-6">
          <Header
            locationLabel={locationLabel}
            currentDate={currentDate}
            query={query}
            setQuery={setQuery}
            loading={loading}
            onSearch={handleSearch}
          />

          {error && (
            <div className="bg-red-500/20 border border-red-300/50 text-red-100 rounded-3xl p-4">
              Backend connection issue: {error}. Set <span className="font-semibold">VITE_API_BASE_URL</span> to your backend base URL.
            </div>
          )}

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <WeatherCard dashboard={dashboard} loading={loading} />
            <AIInsight
              loading={loading}
              loadingMessage={loadingMessage}
              aiText={aiText}
              dashboard={dashboard}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
