import { formatTemperature, formatValue } from "./weatherHelpers";

function formatTime(timestamp) {
   if (!timestamp) return '—'
   if (typeof timestamp === 'number') {
      const date = new Date(timestamp * 1000)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
   }
   return timestamp
}

export default function normalizeDashboard(payload) {
   const weather = payload?.weather || payload?.data?.current || {}
   const airQuality = payload?.air_quality || payload?.data?.air || {}
   const aiAnalysis = payload?.ai_analysis || payload?.data?.ai_analysis || ''

   const windRaw = weather.wind_speed ?? weather.wind ?? null
   const windKmh = windRaw == null ? null : Math.round(Number(windRaw) * 3.6)

   return {
      city: weather.city || 'Unknown City',
      state: weather.state || '',
      country: weather.country || '',
      current: {
         temp: formatTemperature(weather.temperature ?? weather.temp),
         condition: weather.weather_condition || weather.condition || 'Unknown',
         feelsLike: formatTemperature(weather.feels_like ?? weather.feelsLike),
         visibility: `${formatValue(weather.visibility ?? 8)} km`,
         uvIndex: formatValue(weather.uv_index ?? 3),
         sunrise: formatTime(weather.sunrise),
         sunset: formatTime(weather.sunset),
         humidity: weather.humidity,
         airQualityIndex: airQuality.air_quality_index ?? airQuality.aqi,
         pm25: airQuality.pollutants?.pm2_5 ?? airQuality.pm25,
         wind: windKmh,
         rainProbability: weather.rainProbability ?? 0,
         airPurity: 100 - (airQuality.air_quality_index ?? airQuality.aqi ?? 0) * 10,
         alert: airQuality.health_advice || 'Live climate update pending.',
         summary: aiAnalysis || 'The backend is providing live insights.',
      },
      forecast: [],
   }
}