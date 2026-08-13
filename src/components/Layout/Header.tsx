import { Search, Settings, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchableItems } from '../../data/curriculum'

export default function Header() {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (normalized.length < 2) return []
    return searchableItems
      .filter((item) => item.text.toLowerCase().includes(normalized))
      .slice(0, 7)
  }, [query])

  return (
    <header className="topbar">
      <div>
        <div className="brand__title">Virtual Laboratory</div>
        <div className="small-muted">The simulation is the product.</div>
      </div>
      <div className="search-box">
        <input
          aria-label="Search subjects, classes, chapters, concepts, and simulations"
          placeholder="Search electric field, titration, optics..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Search size={18} aria-hidden />
        {results.length > 0 ? (
          <div className="search-results">
            {results.map((result) => (
              <Link className="search-result" key={result.id} to={result.url} onClick={() => setQuery('')}>
                <strong>{result.title}</strong>
                <div className="small-muted">
                  {result.kind} · {result.subtitle}
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      <div className="toolbar">
        <button className="icon-button" aria-label="Settings and theme" type="button">
          <Settings size={18} />
        </button>
        <button className="icon-button" aria-label="Profile" type="button">
          <User size={18} />
        </button>
      </div>
    </header>
  )
}
