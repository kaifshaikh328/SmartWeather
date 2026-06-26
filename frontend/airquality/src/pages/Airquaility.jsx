import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/sidebar'
import AirQualityCard from '../components/AirQualityCard'

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

function formatValue(value, suffix = '') {
  const num = parseNumber(value)
  if (num != null) {
    return `${Math.round(num * 10) / 10}${suffix}`
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

function normalizeDashboard(payload) {
  const weather = payload?.weather || payload?.data?.current || {}
  const airQuality = payload?.air_quality || payload?.data?.air || {}

  const aqiValue = airQuality.air_quality_index ?? airQuality.aqi
  const airPurity = typeof aqiValue === 'number' ? Math.max(0, 100 - aqiValue * 10) : undefined

  return {
    city: weather.city || 'Unknown City',
    state: weather.state || '',
    country: weather.country || '',
    current: {
      airQualityIndex: aqiValue,
      pm25: airQuality.pollutants?.pm2_5 ?? airQuality.pm25,
      humidity: weather.humidity,
      wind: weather.wind_speed ?? weather.wind,
      rainProbability: weather.rainProbability ?? 0,
      airPurity,
    },
  }
}

export default function Airquaility() {
  const [city, setCity] = useState('Pune')
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingMessage, setLoadingMessage] = useState('Loading air quality data...')

  const debouncedCity = useDebounce(city, 300)

  useEffect(() => {
    let isActive = true
    let eventSource = null

    const loadDashboardStream = async (targetCity) => {
      setLoading(true)
      setError('')
      setLoadingMessage('Fetching air quality and weather data...')

      try {
        if (eventSource) {
          eventSource.close()
        }

        const streamUrl = `${API_BASE_URL}/weather/stream?city=${encodeURIComponent(targetCity)}`
        eventSource = new EventSource(streamUrl)

        eventSource.onmessage = (event) => {
          if (!isActive) return

          try {
            const data = JSON.parse(event.data)

            if (data.type === 'metadata') {
              setDashboard(normalizeDashboard({
                weather: data.weather,
                air_quality: data.air_quality,
              }))
            } else if (data.type === 'complete') {
              setLoading(false)
              eventSource.close()
            }
          } catch (err) {
            console.error('Error parsing stream event:', err)
          }
        }

        eventSource.onerror = () => {
          if (!isActive) return
          eventSource.close()

          fetch(`${API_BASE_URL}/weather?city=${encodeURIComponent(targetCity)}`)
            .then((res) => {
              if (!res.ok) throw new Error(`Backend returned ${res.status}`)
              return res.json()
            })
            .then((payload) => {
              if (!isActive) return
              setDashboard(normalizeDashboard(payload))
              setLoading(false)
            })
            .catch((err) => {
              if (!isActive) return
              setError(err instanceof Error ? err.message : 'Unable to load data')
              setLoading(false)
            })
        }
      } catch (err) {
        if (!isActive) return
        setError(err instanceof Error ? err.message : 'Connection failed')
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

  const airData = useMemo(() => {
    if (!dashboard?.current) return []

    return [
      {
        label: 'AQI',
        value: formatValue(dashboard.current.airQualityIndex),
        status: getAQIStatus(typeof dashboard.current.airQualityIndex === 'number' ? dashboard.current.airQualityIndex : null),
      },
      {
        label: 'PM2.5',
        value: `${formatValue(dashboard.current.pm25)} µg/m³`,
        status: getAQIStatus(typeof dashboard.current.pm25 === 'number' ? dashboard.current.pm25 : null),
      },
      {
        label: 'Humidity',
        value: `${formatValue(dashboard.current.humidity)}%`,
        status: getAQIStatus(typeof dashboard.current.humidity === 'number' ? dashboard.current.humidity : null),
      },
      {
        label: 'Wind',
        value: `${formatValue(dashboard.current.wind)} km/h`,
        status: getAQIStatus(typeof dashboard.current.wind === 'number' ? dashboard.current.wind : null),
      },
    ]
  }, [dashboard])

  const analytics = useMemo(() => {
    if (!dashboard?.current) return []

    return [
      {
        label: 'Rain Probability',
        value: dashboard.current.rainProbability ?? 0,
        color: 'bg-cyan-400',
        width: `${dashboard.current.rainProbability ?? 0}%`,
      },
      {
        label: 'Humidity Level',
        value: dashboard.current.humidity ?? 0,
        color: 'bg-blue-400',
        width: `${dashboard.current.humidity ?? 0}%`,
      },
      {
        label: 'Air Purity',
        value: dashboard.current.airPurity ?? 0,
        color: 'bg-green-400',
        width: `${dashboard.current.airPurity ?? 0}%`,
      },
    ]
  }, [dashboard])

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[320px_1fr] gap-6">
        <Sidebar />

        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-4xl p-6 border border-white/10 shadow-2xl">
            {error && (
              <div className="mb-6 bg-red-500/20 border border-red-300/50 text-red-100 rounded-3xl p-4">
                Backend connection issue: {error}. Set <span className="font-semibold">VITE_API_BASE_URL</span> to your backend base URL.
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Air Quality Monitoring</h2>
              <span className="bg-yellow-400 text-black px-4 py-2 rounded-full font-semibold text-sm">
                {loading ? 'Loading' : getAQIStatus(typeof dashboard?.current?.airQualityIndex === 'number' ? dashboard.current.airQualityIndex : null)}
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {airData.map((item, index) => (
                <AirQualityCard key={index} item={item} loading={loading} />
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-4xl p-6 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Weather Analytics</h2>

            <div className="space-y-5">
              {analytics.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>{item.label}</span>
                    <span>{typeof item.value === 'number' ? `${item.value}%` : item.value}</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full`} style={{ width: item.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
