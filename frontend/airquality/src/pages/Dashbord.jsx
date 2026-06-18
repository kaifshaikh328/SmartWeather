import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/sidebar'
import Header from '../components/Header'
import WeatherCard from '../components/Weathercard'
import AIInsight from '../components/AIInsight'
import AirQualityCard from '../components/AirQualityCard'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
const API_BASE_URL = (() => {
  if (!rawBaseUrl) return '/api'
  const trimmed = rawBaseUrl.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
})()

// Debounce utility to prevent duplicate requests
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

const iconMap = {
  sunny: '☀️',
  clear: '☀️',
  rainy: '🌧️',
  drizzle: '🌦️',
  cloudy: '☁️',
  partlycloudy: '⛅',
  storm: '⛈️',
  default: '🌤️',
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

function getConditionIcon(condition = '') {
  const normalized = String(condition).toLowerCase()

  if (normalized.includes('rain')) return iconMap.rainy
  if (normalized.includes('storm')) return iconMap.storm
  if (normalized.includes('cloud')) return iconMap.cloudy
  if (normalized.includes('partly')) return iconMap.partlycloudy
  if (normalized.includes('clear') || normalized.includes('sun')) return iconMap.sunny

  return iconMap.default
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


function getWindStatus(value) {
  if (typeof value !== 'number') return 'Unknown'

  if (value <= 10) return 'Smooth'
  if (value <= 20) return 'Moderate'

  return 'Windy'
}

function normalizeDashboard(payload) {
  // Handle both backend API structure and mock data structure
  const weather = payload?.weather || payload?.data?.current || {}
  const airQuality = payload?.air_quality || payload?.data?.air || {}
  const aiAnalysis = payload?.ai_analysis || ''

  // Handle sunrise/sunset timestamps (convert to readable format)
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

export default function SmartWeatherUI() {
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

  // Debounce city changes to prevent duplicate requests
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
        // Close any existing connection
        if (eventSource) {
          eventSource.close()
        }

        // Create URL with query parameter
        const streamUrl = `${API_BASE_URL}/weather/stream?city=${encodeURIComponent(targetCity)}`
        
        // Connect to streaming endpoint
        eventSource = new EventSource(streamUrl)

        eventSource.onopen = () => {
          console.log('Stream connection opened')
          setLoadingMessage('Processing AI analysis...')
        }

        eventSource.onmessage = (event) => {
          if (!isActive) return

          try {
            const data = JSON.parse(event.data)

            if (data.type === 'metadata') {
              // Received weather and air quality data
              setDashboard(normalizeDashboard({
                weather: data.weather,
                air_quality: data.air_quality,
                ai_analysis: ''
              }))
              setLoadingMessage('Receiving AI analysis...')
            } else if (data.type === 'chunk') {
              // Received text chunk - append to AI text for typing animation
              setAiText((prev) => prev + data.text)
            } else if (data.type === 'complete') {
              // Stream complete
              setLoadingMessage('')
              setLoading(false)
              eventSource.close()
            }
          } catch (err) {
            console.error('Error parsing stream data:', err)
          }
        }

        eventSource.onerror = (error) => {
          if (!isActive) return

          console.error('Stream error:', error)
          
          // Attempt fallback to regular endpoint
          console.log('Falling back to regular endpoint...')
          
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
            .catch((err) => {
              if (!isActive) return
              setError(err instanceof Error ? err.message : 'Unable to load data')
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

  const airData = useMemo(() => {
    if (!dashboard?.current) {
      return []
    }

    return [
      {
        label: 'AQI',
        value: formatValue(dashboard.current.airQualityIndex),
        status: getAQIStatus(typeof dashboard.current.airQualityIndex === 'number' ? dashboard.current.airQualityIndex : null),
      },
      {
        label: 'PM2.5',
        value: `${formatValue(dashboard.current.pm25)} µg/m³`,
        status: getPM25Status(typeof dashboard.current.pm25 === 'number' ? dashboard.current.pm25 : null),
      },
      {
        label: 'Humidity',
        value: `${formatValue(dashboard.current.humidity)}%`,
        status: getHumidityStatus(typeof dashboard.current.humidity === 'number' ? dashboard.current.humidity : null),
      },
      {
        label: 'Wind',
        value: `${dashboard.current.wind} km/h`,
        status: getWindStatus(typeof dashboard.current.wind === 'number' ? dashboard.current.wind : null),
      },
    ]
  }, [dashboard])

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const analytics = [
    { label: 'Rain Probability', value: dashboard?.current?.rainProbability ?? 0, color: 'bg-cyan-400', width: `${dashboard?.current?.rainProbability ?? 0}%` },
    { label: 'Humidity Level', value: dashboard?.current?.humidity ?? 0, color: 'bg-blue-400', width: `${dashboard?.current?.humidity ?? 0}%` },
    { label: 'Air Purity', value: dashboard?.current?.airPurity ?? 0, color: 'bg-green-400', width: `${dashboard?.current?.airPurity ?? 0}%` },
  ]



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

          <div className="bg-white/10 backdrop-blur-xl rounded-4xl p-6 border border-white/10 shadow-2xl">
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">5-Day Forecast</h2>
              <button className="bg-cyan-400 text-black px-5 py-2 rounded-2xl font-semibold hover:bg-cyan-300 transition-all">
                View More
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {(loading ? [] : dashboard?.forecast || []).map((item, index) => (
                <div
                  key={`${item.day}-${index}`}
                  className="bg-slate-900/50 border border-white/10 rounded-3xl p-5 text-center hover:-translate-y-1 transition-all"
                >
                  <h3 className="text-lg font-semibold">{item.day}</h3>
                  <div className="text-5xl my-4">{item.icon}</div>
                  <h2 className="text-3xl font-bold">{item.temp}</h2>
                  <p className="text-slate-300 mt-2">{item.type}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
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

            <div className="bg-linear-to-br from-indigo-600 via-blue-700 to-cyan-600 rounded-4xl p-6 shadow-2xl flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold">Smart AI Suggestions</h2>
                <p className="text-slate-100 mt-4 leading-relaxed">
                  {loading ? 'Your AI suggestion will appear after the backend returns the live forecast.' : dashboard?.current?.summary || 'No live AI suggestion is available right now.'}
                </p>
              </div>

              <button className="mt-8 bg-white text-black py-3 rounded-2xl font-semibold hover:scale-105 transition-all">
                Generate Full AI Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
