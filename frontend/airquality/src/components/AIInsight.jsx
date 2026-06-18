import React from 'react'

export default function AIInsight({ loading, loadingMessage, aiText, dashboard }) {
  const sunrise = loading ? '—' : dashboard?.current?.sunrise || '—'
  const sunset = loading ? '—' : dashboard?.current?.sunset || '—'

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-4xl p-6 border border-white/10 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">AI Weather Insight</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${loading ? 'bg-yellow-400 text-black' : 'bg-cyan-400 text-black'}`}>
          {loading ? 'PROCESSING' : 'LIVE'}
        </div>
      </div>

      <p className="text-slate-300 leading-relaxed text-[15px] whitespace-pre-wrap min-h-24">
        {loading && loadingMessage ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            {loadingMessage}
          </span>
        ) : aiText ? (
          <>{aiText}</>
        ) : (
          'No AI insight has been returned yet.'
        )}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-sm text-slate-300">Sunrise</p>
          <h3 className="text-xl font-bold mt-1">{sunrise}</h3>
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-sm text-slate-300">Sunset</p>
          <h3 className="text-xl font-bold mt-1">{sunset}</h3>
        </div>
      </div>
    </div>
  )
}
