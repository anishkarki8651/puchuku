// Video Modal with Multi-Source Streaming Support
// Auto-switches to working source, manual selection available

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaFilm, FaTv, FaTimes, FaSync, FaCheck, FaExclamationTriangle, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute, FaCog, FaWifi } from 'react-icons/fa';
import './VideoModal.css';

// All streaming sources
const STREAM_SOURCES = [
  { name: 'VidLink', id: 'vidlink', type: 'embed' },
  { name: 'Embed Su', id: 'embedsu', type: 'embed' },
  { name: 'SuperEmbed', id: 'superembed', type: 'embed' },
  { name: 'AutoEmbed', id: 'autoembed', type: 'embed' },
  { name: '2Embed', id: '2embed', type: 'embed' },
  { name: 'Vidplay', id: 'vidplay', type: 'embed' },
];

// Get URL for a source
const getSourceUrl = (source, id, type, season, episode) => {
  const mediaType = type === 'tv' ? 'tv' : 'movie';

  switch (source.id) {
    case 'vidlink':
      return mediaType === 'tv'
        ? `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=ffffff&secondaryColor=aaaaaa&iconColor=ffffff&autoplay=false`
        : `https://vidlink.pro/movie/${id}?primaryColor=ffffff&secondaryColor=aaaaaa&iconColor=ffffff&autoplay=false`;
    case 'embedsu':
      return mediaType === 'tv'
        ? `https://embed.su/embed/tv/${id}/${season}/${episode}`
        : `https://embed.su/embed/movie/${id}`;
    case 'superembed':
      return `https://multiembed.mov/?video_id=${id}&tmdb=1${mediaType === 'tv' ? `&s=${season}&e=${episode}` : ''}`;
    case 'autoembed':
      return mediaType === 'tv'
        ? `https://autoembed.co/tv/tmdb-${id}-${season}-${episode}`
        : `https://autoembed.co/movie/tmdb-${id}`;
    case '2embed':
      return mediaType === 'tv'
        ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${id}`;
    case 'vidplay':
      return mediaType === 'tv'
        ? `https://vidplay.top/embedtv/${id}&s=${season}&e=${episode}`
        : `https://vidplay.top/embed/${id}`;
    default:
      return '';
  }
};

function VideoModal({ item, onClose }) {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTV, setIsTV] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(true);

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').split('-')[0];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setIsTV(item.media_type === 'tv');

    return () => {
      document.body.style.overflow = '';
    };
  }, [item]);

  useEffect(() => {
    fetchDetails();
  }, [item]);

  const fetchDetails = async () => {
    try {
      const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '9626c6d085e0e9acd174cb2563728ed1';
      const type = item.media_type === 'tv' ? 'tv' : 'movie';
      const res = await fetch(
        `https://api.themoviedb.org/3/${type}/${item.id}?api_key=${API_KEY}`
      );
      const data = await res.json();
      setDetails(data);
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  // Get current embed URL
  const getEmbedUrl = () => {
    const source = STREAM_SOURCES[currentSourceIndex];
    return getSourceUrl(source, item.id, item.media_type, season, episode);
  };

  // Auto-switch to next source on error
  const handleIframeError = useCallback(() => {
    if (currentSourceIndex < STREAM_SOURCES.length - 1) {
      setCurrentSourceIndex(prev => prev + 1);
    } else {
      setError('All sources failed. Please try again later.');
    }
  }, [currentSourceIndex]);

  // Cycle through sources
  const cycleSource = (direction) => {
    setError(null);
    if (direction === 'next') {
      setCurrentSourceIndex(prev => (prev + 1) % STREAM_SOURCES.length);
    } else {
      setCurrentSourceIndex(prev => (prev - 1 + STREAM_SOURCES.length) % STREAM_SOURCES.length);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          if (isTV && episode < (details?.seasons?.find(s => s.season_number === season)?.episode_count || 10)) {
            setEpisode(prev => prev + 1);
          }
          break;
        case 'ArrowLeft':
          if (isTV && episode > 1) {
            setEpisode(prev => prev - 1);
          }
          break;
        case 'd':
          cycleSource('next');
          break;
        case 'a':
          cycleSource('prev');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isTV, episode, season, details, currentSourceIndex]);

  return (
    <motion.div
      className="video-modal new-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="video-container player-container"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Top Bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="player-top-bar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button className="player-btn close" onClick={onClose}>
                <FaTimes />
              </button>
              <div className="player-title">
                <span className="title-text">{title}</span>
                {isTV && <span className="episode-badge">S{season} E{episode}</span>}
              </div>
              <div className="player-actions">
                <button
                  className="player-btn"
                  onClick={() => cycleSource('prev')}
                  title="Previous source (A)"
                >
                  <FaSync style={{ transform: 'scaleX(-1)' }} />
                </button>
                <button
                  className="player-btn"
                  onClick={() => cycleSource('next')}
                  title="Next source (D)"
                >
                  <FaSync />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Player */}
        <div className="video-wrapper">
          {error ? (
            <div className="player-error">
              <FaExclamationTriangle size={48} />
              <h3>Playback Error</h3>
              <p>{error}</p>
              <button onClick={() => { setError(null); setCurrentSourceIndex(0); }}>
                <FaSync /> Try Again
              </button>
            </div>
          ) : (
            <iframe
              key={currentSourceIndex} // Force reload on source change
              src={getEmbedUrl()}
              className="video-frame"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              onLoad={() => setIsLoading(false)}
              onError={handleIframeError}
            />
          )}

          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && !error && (
              <motion.div
                className="player-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="loading-spinner"></div>
                <span>Loading stream...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="player-bottom-bar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {/* Source Selector */}
              <div className="source-selector">
                <button
                  className="source-btn"
                  onClick={() => setShowSourceMenu(!showSourceMenu)}
                >
                  <FaPlay /> {STREAM_SOURCES[currentSourceIndex].name}
                </button>

                {showSourceMenu && (
                  <div className="source-menu">
                    {STREAM_SOURCES.map((source, index) => (
                      <button
                        key={source.id}
                        className={`source-option ${index === currentSourceIndex ? 'active' : ''}`}
                        onClick={() => {
                          setCurrentSourceIndex(index);
                          setShowSourceMenu(false);
                          setIsLoading(true);
                          setError(null);
                        }}
                      >
                        {index === currentSourceIndex && <FaCheck />}
                        {source.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* TV Controls */}
              {isTV && details && (
                <div className="episode-selector">
                  {details.number_of_seasons > 1 && (
                    <select
                      value={season}
                      onChange={(e) => {
                        setSeason(Number(e.target.value));
                        setEpisode(1);
                        setIsLoading(true);
                      }}
                      className="selector"
                    >
                      {Array.from({ length: details.number_of_seasons }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Season {i + 1}</option>
                      ))}
                    </select>
                  )}

                  <select
                    value={episode}
                    onChange={(e) => {
                      setEpisode(Number(e.target.value));
                      setIsLoading(true);
                    }}
                    className="selector"
                  >
                    {Array.from({ length: details.seasons?.find(s => s.season_number === season)?.episode_count || 10 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Episode {i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info */}
              <div className="player-info">
                <span className="source-indicator">
                  <FaWifi /> Source {currentSourceIndex + 1}/{STREAM_SOURCES.length}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Panel */}
        <div className="video-info">
          <h2 className="video-title">{title}</h2>
          <div className="video-meta">
            {year && <span>{year}</span>}
            {isTV ? <FaTv /> : <FaFilm />}
            {item.vote_average && (
              <span className="video-rating">
                ★ {item.vote_average.toFixed(1)}
              </span>
            )}
          </div>
          {item.overview && (
            <p className="video-overview">{item.overview}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default VideoModal;