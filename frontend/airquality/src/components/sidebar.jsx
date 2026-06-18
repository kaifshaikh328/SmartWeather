import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside className="bg-white/10 backdrop-blur-xl rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-cyan-400 flex items-center justify-center text-black font-bold text-xl">
          SW
        </div>
        <div>
          <h1 className="text-2xl font-bold">SmartWeather</h1>
          <p className="text-sm text-slate-300">AI Climate Dashboard</p>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => navigate('/')}
          className="w-full bg-cyan-400 hover:bg-cyan-300 transition-all text-black py-3 rounded-2xl font-semibold"
        >
          Dashboard
        </button>
        <button
          onClick={() => navigate('/Forcast')}
          className="w-full bg-white/10 hover:bg-white/20 transition-all py-3 rounded-2xl font-medium"
        >
          Forecast
        </button>
        <button
          onClick={() => navigate('/Airquality')}
          className="w-full bg-white/10 hover:bg-white/20 transition-all py-3 rounded-2xl font-medium"
        >
          Air Quality
        </button>
        <button
          onClick={() => navigate('/Aireports')}
          className="w-full bg-white/10 hover:bg-white/20 transition-all py-3 rounded-2xl font-medium"
        >
          AI Insights
        </button>
      </div>
    </aside>
  )
}
