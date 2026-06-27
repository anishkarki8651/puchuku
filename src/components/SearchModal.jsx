import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FaFilm, FaTv, FaTimes } from 'react-icons/fa'
import './SearchModal.css'

function SearchModal({ onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [mediaType, setMediaType] = useState('all')
  const [year, setYear] = useState('')
  const inputRef = useRef(null)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i)

  useEffect(() => {
    inputRef.current?.focus()

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (query.trim()) {
        searchContent(query, mediaType, year)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(searchTimer)
  }, [query, mediaType, year])

  const searchContent = async (searchQuery, type, yearVal) => {
    setLoading(true)
    try {
      const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d'
      
      let url
      if (type === 'all') {
        url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`
      } else {
        url = `https://api.themoviedb.org/3/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`
      }
      
      if (yearVal) {
        if (type === 'tv') {
          url += `&first_air_date_year=${yearVal}`
        } else if (type === 'movie') {
          url += `&primary_release_year=${yearVal}`
        }
      }
      
      const res = await fetch(url)
      const data = await res.json()
      const filtered = (data.results || []).filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
      setResults(filtered)
    } catch (error) {
      console.error('Search error:', error)
    }
    setLoading(false)
  }

  const activeFilters = []
  if (mediaType !== 'all') activeFilters.push({ type: 'mediaType', value: mediaType, label: mediaType === 'movie' ? 'Movies' : 'TV Shows' })
  if (year) activeFilters.push({ type: 'year', value: year, label: year })

  const removeFilter = (filterType) => {
    if (filterType === 'mediaType') setMediaType('all')
    if (filterType === 'year') setYear('')
  }

  const clearAllFilters = () => {
    setMediaType('all')
    setYear('')
  }

  return (
    <motion.div
      className="search-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="search-container"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search movies, TV shows..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Compact Filter Pills */}
        <div className="filter-pills">
          <button 
            className={`pill ${mediaType === 'movie' ? 'active' : ''}`}
            onClick={() => setMediaType(mediaType === 'movie' ? 'all' : 'movie')}
          >
            <FaFilm /> Movies
          </button>
          <button 
            className={`pill ${mediaType === 'tv' ? 'active' : ''}`}
            onClick={() => setMediaType(mediaType === 'tv' ? 'all' : 'tv')}
          >
            <FaTv /> TV
          </button>
          
          <select 
            className="pill-select"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">Year</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {activeFilters.length > 0 && (
            <button className="pill-clear" onClick={clearAllFilters}>
              <FaTimes /> Clear
            </button>
          )}
        </div>

        {/* Results */}
        <div className="search-results">
          {loading ? (
            <div className="search-loading">
              <div className="search-spinner"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="search-grid">
              {results.slice(0, 12).map((item) => (
                <SearchResult
                  key={item.id}
                  item={item}
                  onClick={() => {
                    const isTV = item.media_type === 'tv' || item.first_air_date !== undefined
                    const type = isTV ? 'tv' : 'movie'
                    navigate(`/watch/${type}/${item.id}`)
                    onClose()
                  }}
                />
              ))}
            </div>
          ) : query ? (
            <div className="search-empty">
              <p>No results for "{query}"</p>
            </div>
          ) : (
            <div className="search-hint">
              <p>Start typing to search</p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button className="search-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  )
}

function SearchResult({ item, onClick }) {
  const title = item.title || item.name
  const posterPath = item.poster_path
  const year = (item.release_date || item.first_air_date || '').split('-')[0]
  const isTV = item.media_type === 'tv' || item.first_air_date !== undefined
  const mediaType = isTV ? 'Series' : 'Movie'

  return (
    <div className="search-result" onClick={onClick}>
      <div className="result-image">
        {posterPath && (
          <img
            src={`https://image.tmdb.org/t/p/w185${posterPath}`}
            alt={title}
            loading="lazy"
          />
        )}
      </div>
      <div className="result-info">
        <h4 className="result-title">{title}</h4>
        <div className="result-meta">
          <span className="result-type">{mediaType}</span>
          {year && <span>{year}</span>}
        </div>
      </div>
    </div>
  )
}

export default SearchModal
