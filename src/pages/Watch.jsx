// Watch.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaPlay, FaPlus, FaThumbsUp, FaShare, FaListUl, FaTimes, FaCheck, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getDetails, getTVDetails, getEpisodeDetails, getTVSeasonDetails } from '../api/tmdb';
import { EMBED_SOURCES, DEFAULT_EMBED } from '../api/config';
import { addToContinueWatching } from '../utils/continueWatching';
import { getResumePosition } from '../utils/continueWatching';
import { useAuth } from '../contexts/AuthContext';
import { apiAddToMyList, apiRemoveFromMyList, apiGetMyList } from '../api/backend';
import CustomPlayer from '../components/CustomPlayer';
import './Watch.css';

function Watch() {
  const { type, id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState(DEFAULT_EMBED);
  const [season, setSeason] = useState(parseInt(searchParams.get('s')) || 1);
  const [episode, setEpisode] = useState(parseInt(searchParams.get('e')) || 1);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playerTime, setPlayerTime] = useState({ currentTime: 0, duration: 0 });
  const [episodeDetails, setEpisodeDetails] = useState(null);
  const [seasonData, setSeasonData] = useState(null);
  const [viewingSeason, setViewingSeason] = useState(parseInt(searchParams.get('s')) || 1);
  const [isSeasonLoading, setIsSeasonLoading] = useState(false);
  const [inMyList, setInMyList] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const { isAuthenticated } = useAuth();
  const iframeRef = useRef(null);
  const seasonTabsRef = useRef(null);

  // Throttle ref for saving position - prevents excessive API calls
  const lastSaveTimeRef = useRef(0);
  const SAVE_INTERVAL = 12000; // Save every 12 seconds to stay within 10-15 second range

  // Save position with throttling
  const savePosition = useCallback((currentTime) => {
    const now = Date.now();
    if (currentTime > 10 && now - lastSaveTimeRef.current >= SAVE_INTERVAL) {
      lastSaveTimeRef.current = now;
      addToContinueWatching(details, type, season, episode, currentTime);
    }
  }, [details, type, season, episode]);

  // State for HLS stream
  const [streamUrl, setStreamUrl] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [startTime, setStartTime] = useState(0); // Resume position in seconds
  const [loadingPhase, setLoadingPhase] = useState(0);
  const loadingPhases = useMemo(() => [
    { main: 'Securing stream...', sub: 'Preparing your experience' },
    { main: 'Loading content...', sub: 'Fetching from our nodes' },
    { main: 'Almost ready...', sub: 'Getting everything in place' }
  ], []);


  // Cycle through loading phases for cinematic effect
  const overlayVisible = isLoadingStream || (!!streamUrl && !playerReady);
  useEffect(() => {
    if (!overlayVisible) return;
    setLoadingPhase(0); // Reset to first phase when loading starts
    const interval = setInterval(() => {
      setLoadingPhase(prev => (prev + 1) % loadingPhases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [overlayVisible, loadingPhases.length]);

  // Detect mobile portrait mode
  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isSmall = window.innerWidth <= 768;
      setIsMobilePortrait(isPortrait && isSmall);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleScrollTabs = (direction) => {
    if (seasonTabsRef.current) {
      seasonTabsRef.current.scrollBy({ left: direction * 250, behavior: 'smooth' });
    }
  };

  // Consolidated data fetching with error handling
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = type === 'tv' ? await getTVDetails(id) : await getDetails(type, id);
        if (cancelled) return;

        setDetails(data);
        if (data) {
          // Only add to continue watching without position on initial load
          // Position will be saved during playback
          if (!searchParams.get('from_continue')) {
            addToContinueWatching(data, type, season, episode);
          }

          if (type === 'tv') {
            const [epData, sData] = await Promise.all([
              getEpisodeDetails(id, season, episode),
              getTVSeasonDetails(id, season)
            ]);
            if (!cancelled) {
              setEpisodeDetails(epData);
              setSeasonData(sData);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch details:', err);
        if (!cancelled) setDetails(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [type, id, season, episode]);

  // Fetch season data when viewing season changes (for drawer)
  useEffect(() => {
    if (type !== 'tv' || !details) return;
    let cancelled = false;

    const fetchSeasonData = async () => {
      setIsSeasonLoading(true);
      try {
        const sData = await getTVSeasonDetails(id, viewingSeason);
        if (!cancelled) setSeasonData(sData);
      } catch (err) {
        console.error('Failed to fetch season data:', err);
      } finally {
        if (!cancelled) setIsSeasonLoading(false);
      }
    };

    fetchSeasonData();
    return () => { cancelled = true; };
  }, [viewingSeason, id, type, details]);

  // Sync viewing season with current season when drawer opens
  useEffect(() => {
    if (isDrawerOpen) setViewingSeason(season);
  }, [isDrawerOpen, season]);

  // Fetch my list status
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    let cancelled = false;

    apiGetMyList()
      .then(list => {
        if (cancelled) return;
        const found = list.some(i => i.id === parseInt(id) && i.media_type === type);
        setInMyList(found);
      })
      .catch(() => { });

    return () => { cancelled = true; };
  }, [isAuthenticated, id, type]);

  // Memoized embed URL calculation
  const embedUrl = useMemo(() => {
    return EMBED_SOURCES[selectedSource](type, id, season, episode);
  }, [selectedSource, type, id, season, episode]);

 const fetchStreamUrl = useCallback(async () => {
  setIsLoadingStream(true);
  try {
    let STREAM_API_URL = import.meta.env.VITE_STREAM_API_URL || 'https://puchuku.anish-karki.com.np';

    const isLocal = STREAM_API_URL.includes('localhost') || STREAM_API_URL.includes('127.0.0.1');

    // Force https for remote hosts only
    if (!isLocal && STREAM_API_URL.startsWith('http:')) {
      STREAM_API_URL = STREAM_API_URL.replace('http:', 'https:');
    }

    const response = await fetch(`${STREAM_API_URL}/api/stream?type=${type}&id=${id}&season=${season}&episode=${episode}`);

    if (!response.ok) {
      console.error('Stream fetch failed:', response.status, response.statusText);
      setSelectedSource('vidlink');
      return;
    }

    const data = await response.json();

    if (data.proxiedUrl) {
      let finalUrl = data.proxiedUrl;
      // Only upgrade remote URLs — never localhost (it has no TLS in dev)
      if (!isLocal && finalUrl.startsWith('http:')) {
        finalUrl = finalUrl.replace('http:', 'https:');
      }
      setStreamUrl(finalUrl);

      if (data.subtitles && Array.isArray(data.subtitles)) {
        const mappedSubtitles = data.subtitles.map(sub => {
          const originalUrl = sub.file || sub.url || sub.src;
          return {
            src: `${STREAM_API_URL}/api/proxy?url=${encodeURIComponent(originalUrl)}`,
            lang: sub.language || sub.lang || 'en',
            label: sub.label || sub.language || 'English',
          };
        });
        setSubtitles(mappedSubtitles);
      }
    } else if (data.error) {
      console.error('Stream error:', data.error);
      setSelectedSource('vidlink');
    }
  } catch (err) {
    console.error('Failed to fetch stream URL:', err);
    setSelectedSource('vidlink');
  } finally {
    setIsLoadingStream(false);
  }
}, [type, id, season, episode]);

  // Clear stream URL when episode or season changes to force re-fetch
  useEffect(() => {
    setStreamUrl(null);
    setSubtitles([]);
    setStartTime(0); // Reset start time when episode changes
    setPlayerReady(false);
  }, [season, episode]);

  // Check if we should use custom player
  const useCustomPlayer = selectedSource === 'vidlink-hls' || streamUrl;

  // Fetch resume position when stream is available
  useEffect(() => {
    console.log('Resume effect triggered:', { useCustomPlayer, streamUrl: !!streamUrl, id, type, season, episode });

    if (useCustomPlayer && streamUrl) {
      console.log('Fetching resume position for:', id, type, season, episode);
      getResumePosition(parseInt(id), type, season, episode).then(resumePos => {
        console.log('Resume position found:', resumePos);
        // Subtract 3 seconds to allow user to get back into context
        const adjustedPos = Math.max(0, resumePos - 3);
        console.log('Adjusted position:', adjustedPos);
        if (adjustedPos > 0) {
          setStartTime(adjustedPos);
          console.log('Resuming from:', adjustedPos, 'seconds (original:', resumePos, '- 3s offset)');
        } else {
          console.log('No resume position or position too small');
        }
      }).catch(err => {
        console.error('Error getting resume position:', err);
      });
    } else {
      console.log('Skipping resume - custom player not ready or no stream URL');
    }
  }, [useCustomPlayer, streamUrl, id, type, season, episode]);

  // Save position on page unload (when user closes tab or navigates away without pausing)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playerTime.currentTime > 10) {
        addToContinueWatching(details, type, season, episode, playerTime.currentTime);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [details, type, season, episode]);

  // Fetch stream URL when vidlink-hls is selected
  useEffect(() => {
    if (selectedSource === 'vidlink-hls' && !streamUrl) {
      fetchStreamUrl();
    }
  }, [selectedSource, streamUrl, fetchStreamUrl]);

  // Auto-advance to next episode when current episode ends
  useEffect(() => {
    if (!details || type !== 'tv') return;

    const handleEpisodeEnded = () => {
      const maxEp = details?.seasons?.find(s => s.season_number === season)?.episode_count || 1;
      if (episode < maxEp) {
        setEpisode(episode + 1);
      } else if (season < (details?.number_of_seasons || 1)) {
        setSeason(season + 1);
        setEpisode(1);
      }
    };

    // Expose the handler for CustomPlayer
    window.__handleEpisodeEnded = handleEpisodeEnded;
    return () => { delete window.__handleEpisodeEnded; };
  }, [details, type, season, episode]);

  // Memoized player key for stable iframe re-rendering
  const playerKey = useMemo(() =>
    `${type}-${id}-${selectedSource}-s${season}-e${episode}`,
    [type, id, selectedSource, season, episode]
  );

  // Memoized event handler to avoid stale closures
  const handlePlayerEvent = useCallback((event) => {
    if (event.origin !== 'https://vidlink.pro') return;
    if (event.data?.type === 'PLAYER_EVENT') {
      const { event: eventType, currentTime, duration } = event.data.data;
      if (eventType === 'pause') setIsPaused(true);
      else if (eventType === 'play') setIsPaused(false);
      else if (eventType === 'ended' && type === 'tv') {
        // Use functional updates to get current state values
        setEpisode(prevEp => {
          const currentEp = prevEp;
          const maxEp = details?.seasons?.find(s => s.season_number === season)?.episode_count || 1;
          if (currentEp < maxEp) {
            return currentEp + 1;
          } else if (season < (details?.number_of_seasons || 1)) {
            setSeason(s => s + 1);
            return 1;
          }
          return currentEp;
        });
      }
      if (currentTime !== undefined && duration !== undefined) {
        setPlayerTime({ currentTime, duration });
      }
    }
  }, [type, season, details]);

  useEffect(() => {
    window.addEventListener('message', handlePlayerEvent);
    return () => window.removeEventListener('message', handlePlayerEvent);
  }, [handlePlayerEvent]);

  const handleToggleList = async (e) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (listLoading) return;
    setListLoading(true);
    try {
      if (inMyList) {
        await apiRemoveFromMyList(id, type);
        setInMyList(false);
      } else {
        await apiAddToMyList({ ...details, media_type: type, id: parseInt(id) });
        setInMyList(true);
      }
    } catch (err) {
      console.error('List Toggle Error:', err);
    } finally {
      setListLoading(false);
    }
  };

  const getEmbedUrl = useCallback(() => EMBED_SOURCES[selectedSource](type, id, season, episode), [selectedSource, type, id, season, episode]);

  const handleSeasonChange = (seasonNum) => setViewingSeason(seasonNum);

  const handleEpisodeChange = (episodeNum) => {
    setSeason(viewingSeason);
    setEpisode(episodeNum);
    setIsDrawerOpen(false);
  };

  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="puchuku-loader">
          <div className="loader-glow"></div>
          <div className="loader-ring"></div>
          <div className="loader-text">P</div>
        </div>
        <div className="loading-bar-container">
          <div className="loading-bar-fill"></div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="watch-error">
        <h2>Content not found</h2>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const title = details.title || details.name;
  const year = (details.release_date || details.first_air_date)?.split('-')[0];
  const seasons = details.number_of_seasons || 1;
  const episodesPerSeason = details.seasons?.find(s => s.season_number === season)?.episode_count || 1;
  const genres = details.genres?.map(g => g.name).join(', ');
  const rating = details.vote_average?.toFixed(1);

  return (
    <div className="watch-page">
      {/* HEADER */}
      <div className="watch-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
          <span>Back</span>
        </button>

        <Link to="/" className="watch-logo">Puchuku</Link>

        {type === 'tv' ? (
          <button className="episodes-btn-header" onClick={() => setIsDrawerOpen(true)}>
            <FaListUl />
            <span>Episodes</span>
          </button>
        ) : (
          <div className="episodes-btn-header" style={{ visibility: 'hidden', pointerEvents: 'none' }}>
            <FaListUl />
            <span>Episodes</span>
          </div>
        )}
      </div>

      {/* PLAYER */}
      <div className="player-container">
        {/* NEW: Dedicated Stream Loading Overlay — stays until video + subtitles are fully ready */}
        {(isLoadingStream || (streamUrl && !playerReady)) && (
          <div className="stream-loading-overlay">
            {details?.backdrop_path && (
              <div
                className="stream-loading-backdrop"
                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${details.backdrop_path})` }}
              />
            )}
            <div className="experience-loader">
              <img
                className="loader-popcorn"
                src="https://media.tenor.com/JGSUOGaaTXoAAAAM/michael-jackson-popcorn.gif"
                alt="Loading"
              />
              <div className="loader-text-container">
                <p className="loader-phase-text" key={loadingPhase}>
                  {loadingPhases[loadingPhase].main}
                </p>
                <span className="loader-subtext">{loadingPhases[loadingPhase].sub}</span>
              </div>
              <div className="loader-line-container">
                <div className="loader-line-fill"></div>
              </div>
            </div>
          </div>
        )}

        {useCustomPlayer && streamUrl ? (
          <CustomPlayer
            src={streamUrl}
            subtitles={subtitles}
            startTime={startTime}
            onReady={() => setPlayerReady(true)}
            onTimeUpdate={(time) => savePosition(time.currentTime)}
            onPlay={() => setIsPaused(false)}
            onPause={() => {
              setIsPaused(true);
              if (playerTime.currentTime > 10) savePosition(playerTime.currentTime);
            }}
            onEnded={() => {
              if (type === 'tv' && window.__handleEpisodeEnded) {
                window.__handleEpisodeEnded();
              }
            }}
          />
        ) : !isLoadingStream && (
          <iframe
            key={playerKey}
            ref={iframeRef}
            src={embedUrl}
            title={title}
            frameBorder="0"
            scrolling="no"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            className="player-iframe"
          />
        )}

        {/* Pause Info Overlay — desktop / landscape only (hidden on mobile portrait via CSS) */}
        {isPaused && (
          <div className="pause-overlay">
            {/* Washed out backdrop on the right */}
            {details.backdrop_path && (
              <div
                className="pause-backdrop"
                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${details.backdrop_path})` }}
              />
            )}

            <div className="pause-info">
              {/* Top: logo / series label */}
              <div className="pause-eyebrow">
                {type === 'tv' ? 'SERIES' : 'FILM'} &nbsp;·&nbsp; {year}
              </div>

              {/* Main title */}
              <h1 className="pause-main-title">{title}</h1>

              {/* Episode label for TV */}
              {type === 'tv' && (
                <div className="pause-ep-label">
                  <span className="pause-ep-badge">S{season} · E{episode}</span>
                  {episodeDetails?.name && (
                    <span className="pause-ep-name">{episodeDetails.name}</span>
                  )}
                </div>
              )}

              {/* Meta row: rating, badges, genres */}
              <div className="pause-meta-row">
                {rating && (
                  <span className="pause-score">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="pause-star-icon">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    {rating}
                  </span>
                )}
                <span className="pause-meta-badge">HD</span>
                <span className="pause-meta-badge">16+</span>
                {details.genres?.slice(0, 3).map(g => (
                  <span key={g.id} className="pause-genre-pill">{g.name}</span>
                ))}
              </div>

              {/* Overview */}
              <p className="pause-overview">
                {type === 'tv'
                  ? (episodeDetails?.overview || details.overview)
                  : details.overview}
              </p>

              {/* Progress bar */}
              {playerTime.duration > 0 && (
                <div className="pause-progress-wrap">
                  <div className="pause-progress-bar">
                    <div
                      className="pause-progress-fill"
                      style={{ width: `${(playerTime.currentTime / playerTime.duration) * 100}%` }}
                    />
                  </div>
                  <div className="pause-progress-times">
                    <span>{(() => {
                      const s = Math.floor(playerTime.currentTime);
                      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
                    })()}</span>
                    <span>{(() => {
                      const s = Math.floor(playerTime.duration);
                      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
                    })()}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pause-actions">
                <button
                  className={`pause-list-btn ${inMyList ? 'in-list' : ''}`}
                  onClick={handleToggleList}
                  disabled={listLoading}
                >
                  {inMyList ? <FaCheck /> : <FaPlus />}
                  <span>{inMyList ? 'In My List' : 'Add to My List'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE PORTRAIT STATIC OVERLAY — shown below player on small portrait screens */}
      {isMobilePortrait && (
        <div className="mobile-scroll-overlay">
          <div className="mobile-overlay-gradient">
            <div className="mobile-overlay-content">

              {/* Source selector + Episodes button row */}
              <div className="mobile-action-bar">
                <div className="mobile-source-controls">
                  <button
                    className="mobile-source-btn"
                    onClick={() => setShowSourceMenu(!showSourceMenu)}
                  >
                    <span className="dot"></span>
                    {selectedSource.charAt(0).toUpperCase() + selectedSource.slice(1)}
                  </button>
                  {showSourceMenu && (
                    <div className="source-menu source-menu--mobile">
                      {Object.keys(EMBED_SOURCES).map((source) => (
                        <button
                          key={source}
                          className={`source-option ${source === selectedSource ? 'active' : ''}`}
                          onClick={() => { setSelectedSource(source); setShowSourceMenu(false); }}
                        >
                          {source === 'vidlink-hls' ? 'Vidlink (HLS)' : source.charAt(0).toUpperCase() + source.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {type === 'tv' && (
                  <button className="mobile-episodes-btn" onClick={() => setIsDrawerOpen(true)}>
                    <FaListUl />
                    <span>Episodes</span>
                  </button>
                )}
              </div>

              {/* Title + meta */}
              <div className="mobile-info-section">
                <h1 className="mobile-watch-title">{title}</h1>
                <div className="mobile-watch-meta">
                  <span className="rating"><FaPlay className="inline-icon" /> {rating}</span>
                  <span>{year}</span>
                  <span>{type === 'tv' ? 'Series' : 'Movie'}</span>
                  {type === 'tv' && <span>{seasons} Season{seasons > 1 ? 's' : ''}</span>}
                </div>

                {type === 'tv' && (
                  <div className="mobile-ep-label">
                    S{season} · E{episode}
                    {episodeDetails?.name && ` — ${episodeDetails.name}`}
                  </div>
                )}

                <div className="mobile-watch-actions">
                  <button
                    className={`mobile-list-btn ${inMyList ? 'in-list' : ''}`}
                    onClick={handleToggleList}
                    disabled={listLoading}
                  >
                    {inMyList ? <FaCheck /> : <FaPlus />}
                    <span>{inMyList ? 'In My List' : 'Add to List'}</span>
                  </button>
                  <button className="mobile-icon-btn" title="Rate"><FaThumbsUp /></button>
                  <button className="mobile-icon-btn" title="Share"><FaShare /></button>
                </div>

                <p className="mobile-watch-overview">{details.overview}</p>

                {genres && (
                  <div className="mobile-watch-genres">
                    {details.genres.map(g => (
                      <span key={g.id} className="genre-tag">{g.name}</span>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* EPISODES DRAWER */}
      {type === 'tv' && details.seasons && (
        <>
          <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
          <div className={`episodes-drawer ${isDrawerOpen ? 'open' : ''}`}>
            <div className="drawer-header">
              <div className="drawer-header-content">
                <span className="drawer-subtitle">Watching</span>
                <h3 className="drawer-title">{title}</h3>
              </div>
              <button className="close-btn" onClick={() => setIsDrawerOpen(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="drawer-content">
              <div className="tabs-navigation-wrapper">
                <button className="nav-arrow-btn left" onClick={() => handleScrollTabs(-1)} aria-label="Scroll seasons left">
                  <FaChevronLeft />
                </button>
                <div className="season-tabs" ref={seasonTabsRef}>
                  {details.seasons
                    ?.filter(s => s.season_number > 0)
                    .map((s) => (
                      <button
                        key={s.season_number}
                        className={`season-tab ${s.season_number === viewingSeason ? 'active' : ''}`}
                        onClick={() => handleSeasonChange(s.season_number)}
                      >
                        Season {s.season_number}
                      </button>
                    ))}
                </div>
                <button className="nav-arrow-btn right" onClick={() => handleScrollTabs(1)} aria-label="Scroll seasons right">
                  <FaChevronRight />
                </button>
              </div>

              <div className="episode-list">
                {isSeasonLoading ? (
                  <div className="drawer-loader"><div className="spinner"></div></div>
                ) : (
                  seasonData?.episodes?.map((ep) => (
                    <button
                      key={ep.id}
                      className={`episode-card ${ep.episode_number === episode && viewingSeason === season ? 'active' : ''}`}
                      onClick={() => handleEpisodeChange(ep.episode_number)}
                    >
                      <div className="ep-thumbnail">
                        <img
                          src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : `https://image.tmdb.org/t/p/w300${details.backdrop_path}`}
                          alt={ep.name}
                        />
                        <div className="ep-number-badge">{ep.episode_number}</div>
                        {(ep.episode_number === episode && viewingSeason === season) && (
                          <div className="playing-overlay"><FaPlay /></div>
                        )}
                      </div>
                      <div className="ep-info">
                        <div className="ep-header">
                          <h4 className="ep-title">{ep.name}</h4>
                          {ep.runtime && <span className="ep-runtime">{ep.runtime}m</span>}
                        </div>
                        <p className="ep-overview">{ep.overview || 'No description available.'}</p>
                        {(ep.episode_number === episode && viewingSeason === season) && <span className="ep-playing-tag">NOW PLAYING</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Watch;