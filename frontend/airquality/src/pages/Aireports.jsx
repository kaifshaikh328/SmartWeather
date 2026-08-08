import React, { useCallback, useEffect, useState, useRef } from 'react'
import Sidebar from '../components/sidebar'
import { getDefaultCity } from '../utils/cityStorage'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
const API_BASE_URL = (() => {
  const base = rawBaseUrl.trim()
  if (!base) return '/api'
  const trimmed = base.replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
})()

function Aireports() {
  const defaultCity = getDefaultCity()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isClicked, setIsClicked] = useState(false)
  const [sidebarClicked, setSidebarClicked] = useState(false)
  const [fullReport, setFullReport] = useState('')
  const [streaming, setStreaming] = useState(false)
  const esRef = useRef(null)

  const loadAiReport = useCallback(async () => {
    setIsClicked(true)
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/weather?city=${encodeURIComponent(defaultCity)}`)

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
  }, [defaultCity])

  // Start Server-Sent Events stream to receive the full Ollama report
  const startAiStream = useCallback(() => {
    setIsClicked(true)
    setStreaming(true)
    setFullReport('')
    setError('')

    const url = `${API_BASE_URL}/weather/stream?city=${encodeURIComponent(defaultCity)}`

    // Close previous connection if any
    if (esRef.current) {
      try { esRef.current.close() } catch (e) {}
      esRef.current = null
    }

    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'chunk') {
          setFullReport(prev => prev + (data.text || ''))
        } else if (data.type === 'metadata') {
          // optionally use metadata
        } else if (data.type === 'complete') {
          setStreaming(false)
          try { es.close() } catch (err) {}
          esRef.current = null
        } else if (data.type === 'error') {
          setError(data.message || 'Stream error')
          setStreaming(false)
          try { es.close() } catch (err) {}
          esRef.current = null
        }
      } catch (parseErr) {
        // If not JSON, append raw data
        setFullReport(prev => prev + e.data)
      }
    }

    es.onerror = (err) => {
      setError('Stream connection error')
      setStreaming(false)
      if (esRef.current) {
        try { esRef.current.close() } catch (e) {}
        esRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    loadAiReport()
  }, [loadAiReport])

  // cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (esRef.current) {
        try { esRef.current.close() } catch (e) {}
        esRef.current = null
      }
    }
  }, [])

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
            onClick={startAiStream}
          >
            Generate Full AI Report
          </button>

          {streaming && (
            <div className="mt-4 text-sm text-slate-100">
              Streaming full AI report...
            </div>
          )}

          {fullReport && (
            <pre className="mt-4 p-4 bg-white/5 rounded-lg text-slate-100 overflow-auto whitespace-pre-wrap">
              {fullReport}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

export default Aireports