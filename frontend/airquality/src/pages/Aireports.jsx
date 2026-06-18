import React from 'react'
import Sidebar from '../components/sidebar'

function Aireports() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[320px_1fr] gap-6">
        <Sidebar />
      </div>
    </div>
  )
}

export default Aireports