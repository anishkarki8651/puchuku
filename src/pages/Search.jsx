import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus, FaCheck, FaFilter, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { searchContent, getImageUrl, discoverMedia } from '../api/tmdb';
import { useAuth } from '../contexts/AuthContext';
import { apiGetMyList, apiAddToMyList, apiRemoveFromMyList } from '../api/backend';
import { GENRES } from '../api/config';
import VideoModal from '../components/VideoModal';
import './Search.css';

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(query);
  const [selectedItem, setSelectedItem] = useState(null);
  const [myListIds, setMyListIds] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mediaType, setMediaType] = useState('movie');
  const [filters, setFilters] = useState({
    genre: '',
    year: '',
    ratingFrom: '',
    ratingTo: '',
    sortBy: 'popularity.desc'
  });
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toastRef = useRef(null);

  // Check if we're in filter mode (no query but have filters)
  const isFilterMode = !query && (filters.genre || filters.year || filters.ratingFrom || filters.ratingTo);

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      
      if (isFilterMode) {
        // Use discover API with filters
        const options = {};
        if (filters.genre) options.genre = filters.genre;
        if (filters.year) options.year = parseInt(filters.year);
        if (filters.ratingFrom) options.ratingFrom = parseFloat(filters.ratingFrom);
        if (filters.ratingTo) options.ratingTo = parseFloat(filters.ratingTo);
        if (filters.sortBy) options.sortBy = filters.sortBy;
        
        const data = await discoverMedia(mediaType, options);
        setResults(data);
      } else if (query.trim()) {
        // Regular text search
        const data = await searchContent(query);
        setResults(data.filter(item => item.media_type === 'movie' || item.media_type === 'tv'));
      } else {
        setResults([]);
      }
      
      setLoading(false);
    };

    performSearch();
  }, [query, isFilterMode, filters, mediaType]);

  // Fetch My List IDs
  useEffect(() => {
    if (!isAuthenticated) return;
    apiGetMyList()
      .then(list => {
        const ids = new Set(list.map(i => `${i.id}-${i.media_type}`));
        setMyListIds(ids);
      })
      .catch(() => { });
  }, [isAuthenticated]);

  const showToast = (message, type = 'success') => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ message, type });
    toastRef.current = setTimeout(() => setToast(null), 2500);
  };

  const handleToggleList = async (e, item) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    const mediaType = item.media_type;
    const key = `${item.id}-${mediaType}`;
    try {
      if (myListIds.has(key)) {
        await apiRemoveFromMyList(item.id, mediaType);
        setMyListIds(prev => { const n = new Set(prev); n.delete(key); return n; });
        showToast('Removed from My List', 'remove');
      } else {
        await apiAddToMyList({ ...item, media_type: mediaType });
        setMyListIds(prev => new Set(prev).add(key));
        showToast('Added to My List ✓', 'success');
      }
    } catch {
      showToast('Something went wrong', 'error');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
      // Clear filters when searching
      setFilters({
        genre: '',
        year: '',
        ratingFrom: '',
        ratingTo: '',
        sortBy: 'popularity.desc'
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Clear query when applying filters
    setSearchParams({});
  };

  const handleMediaTypeChange = (type) => {
    setMediaType(type);
  };

  const clearFilters = () => {
    setFilters({
      genre: '',
      year: '',
      ratingFrom: '',
      ratingTo: '',
      sortBy: 'popularity.desc'
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const filteredResults = results.filter(
    (item) => item.media_type === 'movie' || item.media_type === 'tv'
  );

  return (
    <div className="search-page">
      <div className="search-header">
        <form onSubmit={handleSearch} className="search-form">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search for movies, TV shows..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </form>
        <button 
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Filters
        </button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="filter-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="filter-section">
              <label>Type</label>
              <div className="filter-buttons">
                <button 
                  className={mediaType === 'movie' ? 'active' : ''}
                  onClick={() => handleMediaTypeChange('movie')}
                >
                  Movies
                </button>
                <button 
                  className={mediaType === 'tv' ? 'active' : ''}
                  onClick={() => handleMediaTypeChange('tv')}
                >
                  TV Shows
                </button>
              </div>
            </div>

            <div className="filter-section">
              <label>Genre</label>
              <select 
                value={filters.genre} 
                onChange={(e) => handleFilterChange('genre', e.target.value)}
              >
                <option value="">All Genres</option>
                {Object.entries(GENRES[mediaType]).map(([name, id]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <div className="filter-section">
              <label>Year</label>
              <select 
                value={filters.year} 
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="filter-section">
              <label>Rating</label>
              <div className="filter-range">
                <select 
                  value={filters.ratingFrom} 
                  onChange={(e) => handleFilterChange('ratingFrom', e.target.value)}
                >
                  <option value="">Min</option>
                  {[1,2,3,4,5,6,7,8,9].map(r => (
                    <option key={r} value={r}>{r}+</option>
                  ))}
                </select>
                <span>to</span>
                <select 
                  value={filters.ratingTo} 
                  onChange={(e) => handleFilterChange('ratingTo', e.target.value)}
                >
                  <option value="">Max</option>
                  {[2,3,4,5,6,7,8,9,10].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-section">
              <label>Sort By</label>
              <select 
                value={filters.sortBy} 
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="popularity.desc">Most Popular</option>
                <option value="popularity.asc">Least Popular</option>
                <option value="vote_average.desc">Highest Rated</option>
                <option value="vote_average.asc">Lowest Rated</option>
                <option value="release_date.desc">Newest</option>
                <option value="release_date.asc">Oldest</option>
              </select>
            </div>

            <button className="clear-filters-btn" onClick={clearFilters}>
              <FaTimes /> Clear Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="search-content">
        {loading ? (
          <div className="search-loading">
            <div className="loader"></div>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="no-results">
            <h2>{isFilterMode ? 'No results match your filters' : query ? `No results found for "${query}"` : 'Search or use filters to find content'}</h2>
            <p>{isFilterMode ? 'Try adjusting your filters' : 'Try searching for something else'}</p>
          </div>
        ) : (
          <>
            <h2 className="results-title">
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} 
              {query && <> for "{query}"</>}
              {isFilterMode && <>({mediaType}s)</>}
            </h2>

            <div className="results-grid">
              {filteredResults.map((item) => (
                <div
                  key={`${item.media_type}-${item.id}`}
                  className="result-card"
                  onClick={() => setSelectedItem(item)}
                >
                  <img
                    src={getImageUrl(item.poster_path, '/w342', 'poster')}
                    alt={item.title || item.name}
                    className="result-poster"
                  />
                  <div className="item-overlay">
                    <div className="item-play">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    className={`card-watchlist-btn ${myListIds.has(`${item.id}-${item.media_type}`) ? 'in-list' : ''}`}
                    onClick={(e) => handleToggleList(e, item)}
                    title={myListIds.has(`${item.id}-${item.media_type}`) ? 'Remove from My List' : 'Add to My List'}
                  >
                    {myListIds.has(`${item.id}-${item.media_type}`) ? <FaCheck /> : <FaPlus />}
                  </button>
                  <div className="result-info">
                    <h3>{item.title || item.name}</h3>
                    <div className="result-meta">
                      <span className="result-year">
                        {(item.release_date || item.first_air_date)?.split('-')[0]}
                      </span>
                      <span className="result-type">
                        {item.media_type === 'tv' ? 'TV Series' : 'Movie'}
                      </span>
                      <span className="result-rating">
                        {item.vote_average?.toFixed(1)} ★
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedItem && (
        <VideoModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`card-toast ${toast.type}`}
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            transition={{ duration: 0.3 }}
            style={{ position: 'fixed', bottom: '100px', left: '50%' }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Search;