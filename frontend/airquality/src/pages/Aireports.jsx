import React, { useCallback, useEffect, useState } from 'react'
import Sidebar from '../components/sidebar'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
const API_BASE_URL = (() => {
  if (!rawBaseUrl) return '/api'
  const trimmed = rawBaseUrl.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
})()

function Aireports() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isClicked, setIsClicked] = useState(false)
  const [sidebarClicked, setSidebarClicked] = useState(false)

  const loadAiReport = useCallback(async () => {
    setIsClicked(true)
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/weather?city=${encodeURIComponent('Pune')}`)

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`)
      }

      const payload = await response.json()

      setDashboard({
        current: {
          summary: payload?.ai_analysis || 'No live AI suggestion is available right now.',
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load AI report')
      setDashboard(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAiReport()
  }, [loadAiReport])

  const summaryText = loading
    ? 'Your AI suggestion will appear after the backend returns the live forecast.'
    : dashboard?.current?.summary || error || 'No live AI suggestion is available right now.'

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[320px_1fr] gap-6">
        <Sidebar onButtonClick={() => setSidebarClicked(true)} />
        <div className={`rounded-4xl p-6 shadow-2xl flex flex-col justify-between ${
          sidebarClicked
            ? 'bg-linear-to-br from-indigo-600 via-blue-700 to-cyan-600'
            : 'bg-linear-to-br from-indigo-600 via-blue-700 to-cyan-600'
        } text-white`}>
          <div>
            <h2 className="text-3xl font-bold">Smart AI Suggestions</h2>
            <p className="text-slate-100 mt-4 leading-relaxed">{summaryText}</p>
          </div>

          <button
            className={`mt-8 py-3 rounded-2xl font-semibold hover:scale-105 transition-all ${
              isClicked 
                ? 'bg-cyan-400 text-slate-900' 
                : 'bg-white text-black'
            }`}
            onClick={loadAiReport}
          >
            Generate Full AI Report
          </button>
        </div>
      </div>
    </div>
  )
}

export default Aireports