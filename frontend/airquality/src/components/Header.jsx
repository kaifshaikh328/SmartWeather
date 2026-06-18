import React from 'react'

export default function Header({ locationLabel, currentDate, query, setQuery, loading, onSearch }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-xl">
      <div>
        <h2 className="text-3xl font-bold">{locationLabel}</h2>
        <p className="text-slate-300">{currentDate}</p>
      </div>

      <form className="flex gap-3 w-full md:w-auto" onSubmit={onSearch}>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search city..."
          className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 outline-none w-full md:w-80"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-400 hover:bg-cyan-300 disabled:bg-cyan-600 disabled:cursor-not-allowed text-black px-6 rounded-2xl font-semibold transition-all"
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </form>
    </div>
  )
}
