const iconMap = {
	Clear: '☀️',
	Clouds: '☁️',
	Rain: '🌧️',
	Drizzle: '🌦️',
	Thunderstorm: '⛈️',
	Snow: '❄️',
	Mist: '🌫️',
	Smoke: '💨',
	Haze: '🌫️',
	Dust: '🌪️',
	Fog: '🌫️',
	Sand: '🏜️',
	Ash: '🌋',
	Squall: '💨',
	Tornado: '🌪️',
}

function normalizeKey(str = '') {
	if (typeof str !== 'string') return ''
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function getConditionIcon(condition) {
	const key = normalizeKey(condition)
	return iconMap[key] || iconMap.Clouds
}

export function formatTemperature(value, unit = 'C', decimals = 1) {
	if (value == null || Number.isNaN(Number(value))) return '--'
	let temp = Number(value)
	if (unit === 'F') temp = temp * 9 / 5 + 32
	const symbol = unit === 'F' ? '°F' : '°C'
	return `${temp.toFixed(decimals)}${symbol}`
}

export function formatValue(value, decimals = 1) {
	if (value == null || Number.isNaN(Number(value))) return '--'
	return Number(value).toFixed(decimals)
}

export function formatWindSpeed(speed, unit = 'm/s', decimals = 1) {
	if (speed == null || Number.isNaN(Number(speed))) return '--'
	let s = Number(speed)
	if (unit === 'km/h') s = s * 3.6
	if (unit === 'mph') s = s * 2.23694
	return `${s.toFixed(decimals)} ${unit}`
}

export function getAQIStatus(aqi) {
	if (aqi == null || Number.isNaN(Number(aqi))) return 'Unknown'
	const v = Number(aqi)
	if (v <= 50) return 'Good'
	if (v <= 100) return 'Moderate'
	if (v <= 150) return 'Unhealthy for Sensitive Groups'
	if (v <= 200) return 'Unhealthy'
	if (v <= 300) return 'Very Unhealthy'
	return 'Hazardous'
}

export function getPM25Status(pm25) {
	if (pm25 == null || Number.isNaN(Number(pm25))) return 'Unknown'
	const v = Number(pm25)
	if (v <= 12) return 'Good'
	if (v <= 35.4) return 'Moderate'
	if (v <= 55.4) return 'Unhealthy for Sensitive Groups'
	if (v <= 150.4) return 'Unhealthy'
	if (v <= 250.4) return 'Very Unhealthy'
	return 'Hazardous'
}

export function getHumidityStatus(humidity) {
	if (humidity == null || Number.isNaN(Number(humidity))) return 'Unknown'
	const h = Number(humidity)
	if (h < 30) return 'Dry'
	if (h <= 60) return 'Comfortable'
	return 'Humid'
}

export function getWindStatus(speed) {
	if (speed == null || Number.isNaN(Number(speed))) return 'Unknown'
	const s = Number(speed) // assume m/s input
	if (s < 1) return 'Calm'
	if (s < 5) return 'Light breeze'
	if (s < 10) return 'Breeze'
	if (s < 20) return 'Strong breeze'
	return 'Gale or higher'
}