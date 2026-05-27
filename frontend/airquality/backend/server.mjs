import http from 'node:http'

const PORT = Number(process.env.PORT || 5000)
const API_BASE_PATH = '/api/weather'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function hashString(value) {
  let hash = 0

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  return hash
}

function getConditionFromMood(temp, humidity, rain) {
  if (rain >= 65) return 'Rainy'
  if (rain >= 35) return 'Cloudy'
  if (temp >= 30 && humidity <= 55) return 'Sunny'
  if (temp >= 24) return 'Partly Cloudy'

  return 'Cloudy'
}

function getConditionIcon(condition) {
  const normalized = String(condition).toLowerCase()

  if (normalized.includes('rain')) return '🌧️'
  if (normalized.includes('storm')) return '⛈️'
  if (normalized.includes('partly')) return '⛅'
  if (normalized.includes('sun')) return '☀️'

  return '☁️'
}

function formatClock(value) {
  return String(value).padStart(2, '0')
}

function buildWeatherResponse(city) {
  const now = new Date()
  const seed = hashString(city.toLowerCase())
  const hour = now.getHours()
  const minute = now.getMinutes()

  const tempBase = 22 + (seed % 10) - 4
  const tempVariation = Math.sin((hour + seed % 7) / 3) * 2.5
  const currentTemp = clamp(tempBase + tempVariation, 16, 36)

  const humidity = clamp(44 + (seed % 20) + Math.cos(hour / 3) * 7, 30, 88)
  const wind = clamp(5 + (seed % 12) + Math.sin((hour + 5) / 2) * 2, 3, 24)
  const rainChance = clamp(15 + (seed % 30) + (hour >= 18 ? 20 : 0) - (hour >= 9 && hour <= 15 ? 6 : 0), 5, 95)
  const aqi = clamp(30 + (seed % 42) + (hour >= 8 && hour <= 10 ? 18 : 0) + (hour >= 18 ? 10 : 0), 18, 160)
  const pm25 = clamp(8 + aqi / 4, 8, 86)
  const airPurity = clamp(100 - aqi * 0.68, 12, 98)
  const uvIndex = clamp(1 + (hour >= 9 && hour <= 15 ? 4 : 1) + (seed % 4), 1, 10)

  const feelsLike = clamp(currentTemp + (humidity > 75 ? 1.2 : 0) - (wind > 16 ? 0.8 : 0), 14, 38)
  const condition = getConditionFromMood(currentTemp, humidity, rainChance)

  const sunrise = `${formatClock((6 + (seed % 2)) % 24)}:${formatClock(40 + (seed % 20))}`
  const sunset = `${formatClock((18 + (seed % 2)) % 24)}:${formatClock(10 + (seed % 40))}`

  const alert = rainChance >= 60
    ? 'Heavy rain expected later in the day. Carry an umbrella.'
    : aqi >= 100
      ? 'AQI is elevated. Limit outdoor exposure during peak traffic hours.'
      : 'Live conditions are stable and suitable for outdoor activities.'

  const summary = `${condition} conditions are dominating in ${city}. Temperature is ${currentTemp.toFixed(0)}° with ${humidity.toFixed(0)}% humidity and ${wind.toFixed(0)} km/h wind.`

  const forecast = Array.from({ length: 5 }, (_, index) => {
    const dayOffset = index + 1
    const forecastTemp = clamp(currentTemp + (index - 2) * 2 + Math.sin((hour + index * 3) / 2), 16, 36)
    const forecastRain = clamp(rainChance + index * 4 - 5, 5, 95)
    const forecastCondition = getConditionFromMood(forecastTemp, humidity, forecastRain)

    return {
      day: new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      temp: `${Math.round(forecastTemp)}°`,
      type: forecastCondition,
      icon: getConditionIcon(forecastCondition),
    }
  })

  return {
    city,
    state: city === 'Pune' ? 'Maharashtra' : 'Live Location',
    country: 'India',
    current: {
      temperature: Number(currentTemp.toFixed(0)),
      condition,
      feelsLike: Number(feelsLike.toFixed(0)),
      visibility: Number((8 + wind / 4).toFixed(1)),
      uvIndex: Number(uvIndex.toFixed(1)),
      sunrise,
      sunset,
      humidity: Number(humidity.toFixed(0)),
      airQualityIndex: Number(aqi.toFixed(0)),
      pm25: Number(pm25.toFixed(1)),
      wind: Number(wind.toFixed(0)),
      rainProbability: Number(rainChance.toFixed(0)),
      airPurity: Number(airPurity.toFixed(0)),
      alert,
      summary,
    },
    forecast,
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  if (url.pathname !== API_BASE_PATH) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  const city = url.searchParams.get('city') || 'Pune'

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  })

  res.end(JSON.stringify(buildWeatherResponse(city)))
})

server.listen(PORT, () => {
  console.log(`SmartWeather backend running at http://localhost:${PORT}${API_BASE_PATH}`)
})
