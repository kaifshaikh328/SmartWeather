import React from 'react'

export default function AirQualityCard({ item, loading }) {
  return (
    <div className="bg-slate-900/50 rounded-3xl p-5 border border-white/10 hover:scale-105 transition-all">
      <p className="text-slate-400 text-sm">{item.label}</p>
      <h3 className="text-3xl font-bold mt-2">{loading ? '—' : item.value}</h3>
      <p className="text-cyan-300 mt-2 text-sm">{loading ? 'Unknown' : item.status}</p>
    </div>
  )
}
