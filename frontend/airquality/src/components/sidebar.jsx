import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Sidebar({ onButtonClick }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleButtonClick = (path) => {
    if (onButtonClick) {
      onButtonClick()
    }
    navigate(path)
  }

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Forecast', path: '/Forcast' },
    { label: 'Air Quality', path: '/Airquality' },
    { label: 'AI Insights', path: '/Aireports' },
  ]

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
        {navItems.map(({ label, path }) => {
          const isActive = location.pathname === path

          return (
            <button
              key={label}
              onClick={() => handleButtonClick(path)}
              className={`w-full py-3 rounded-2xl font-medium transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:scale-[1.01] ${
                isActive
                  ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/30'
                  : 'bg-white/10 text-white hover:bg-cyan-300 hover:text-black'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
