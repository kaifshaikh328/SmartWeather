import React from 'react'

export default function WeatherCard({ dashboard, loading }) {
  const current = dashboard?.current || {}
  const temp = loading ? '—' : current.temp || '—'
  const condition = loading ? 'Loading...' : current.condition || 'Unknown'
  const feelsLike = loading ? '—' : current.feelsLike || '—'
  const visibility = loading ? '—' : current.visibility || '—'
  const uvIndex = loading ? '—' : current.uvIndex || '—'
  const wind = loading ? '—' : `${current.wind ?? '—'} km/h`
  const icon = loading ? '🌤️' : current.condition ? '☀️' : '🌤️'

  return (
    <div className="bg-linear-to-br from-cyan-500 via-blue-600 to-indigo-700 rounded-4xl p-8 shadow-2xl text-white">
      <div className="flex flex-col lg:flex-row lg:justify-between gap-8">
        <div>
          <p className="text-lg text-slate-100">Current Weather</p>
          <h1 className="text-7xl font-extrabold mt-3">{temp}</h1>
          <p className="text-2xl mt-2 font-medium">{condition}</p>

          <div className="flex flex-wrap gap-6 mt-8 text-sm text-slate-100">
            <div>
              <p>Feels Like</p>
              <h3 className="font-bold text-lg mt-1">{feelsLike}</h3>
            </div>
            <div>
              <p>Visibility</p>
              <h3 className="font-bold text-lg mt-1">{visibility}</h3>
            </div>
            <div>
              <p>UV Index</p>
              <h3 className="font-bold text-lg mt-1">{uvIndex}</h3>
            </div>
          </div>
        </div>

        <div className="text-[150px] flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 text-slate-100">
        <div className="bg-white/10 rounded-3xl p-5 border border-white/10">
          <p className="text-sm">Wind</p>
          <h3 className="text-xl font-bold mt-1">{wind}</h3>
        </div>
        <div className="bg-white/10 rounded-3xl p-5 border border-white/10">
          <p className="text-sm">Air Quality</p>
          <h3 className="text-xl font-bold mt-1">{loading ? '—' : current.airQualityIndex ?? '—'}</h3>
        </div>
      </div>
    </div>
  )
}
