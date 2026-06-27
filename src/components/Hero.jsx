import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getVideos } from '../api/tmdb'
import { useLayoutAnimation } from '../contexts/LayoutAnimationContext'
import './Hero.css'

// Generate layout ID for hero image morph
const getHeroLayoutId = (id) => `hero-${id}`

const Hero = ({ featured }) => {
  const navigate = useNavigate()
  const { registerHeroAnimation } = useLayoutAnimation()
  const [isLoaded, setIsLoaded] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [showTrailer, setShowTrailer] = useState(false)
  const [trailerKey, setTrailerKey] = useState(null)
  const heroRef = useRef(null)

  const handleWatch = () => {
    if (featured) {
      const isTV = featured.media_type === 'tv' || featured.first_air_date !== undefined
      const mediaType = isTV ? 'tv' : 'movie'
      const layoutId = getHeroLayoutId(featured.id)
      
      // Register hero animation for morph transition
      registerHeroAnimation(layoutId, featured.backdrop_path || featured.poster_path)
      
      // Navigate with state for layout animation
      navigate(`/watch/${mediaType}/${featured.id}`, {
        state: {
          heroLayoutId: layoutId,
          heroImage: featured.backdrop_path || featured.poster_path,
          fromHero: true
        }
      })
    }
  }

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!featured) return;

    const isTV = featured.media_type === 'tv' || featured.first_air_date !== undefined
    const mediaType = isTV ? 'tv' : 'movie'

    const timer = setTimeout(async () => {
      try {
        const videos = await getVideos(mediaType, featured.id)
        const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
          videos.find(v => v.site === 'YouTube')

        if (trailer) {
          setTrailerKey(trailer.key)
          setShowTrailer(true)
        }
      } catch (err) {
        console.error('Error fetching hero trailer:', err)
      }
    }, 3000)

    return () => {
      clearTimeout(timer)
      setShowTrailer(false)
      setTrailerKey(null)
    }
  }, [featured])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      setMousePos({ x: x * 20, y: y * 20 })
    }

    const hero = heroRef.current
    if (hero) {
      hero.addEventListener('mousemove', handleMouseMove)
    }
    return () => {
      if (hero) hero.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  if (!featured) return (
    <div className="hero-skeleton">
      <div className="hero-skeleton-bg" />
      <div className="hero-skeleton-content">
        <div className="skeleton-title" />
        <div className="skeleton-subtitle" />
        <div className="skeleton-buttons" />
      </div>
    </div>
  )

  const { title, name, overview, poster_path, backdrop_path, release_date, first_air_date,
    vote_average, media_type, runtime, episode_run_time, genres = [] } = featured

  const displayTitle = title || name
  const year = (release_date || first_air_date)?.split('-')[0] || 'N/A'
  const rating = vote_average?.toFixed(1) || 'N/A'

  // Handle runtime for both movies and TV shows
  let displayRuntime = 'N/A'
  if (runtime) {
    const hours = Math.floor(runtime / 60)
    const minutes = runtime % 60
    displayRuntime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  } else if (episode_run_time && episode_run_time.length > 0) {
    displayRuntime = `${episode_run_time[0]}m`
  }

  const isTV = media_type === 'tv' || featured.first_air_date !== undefined
  const genreName = genres[0]?.name || (isTV ? 'TV Series' : 'Movie')

  return (
    <section className="hero" ref={heroRef}>
      {/* Layer 0: Background Video */}
      {showTrailer && trailerKey && (
        <div className="hero-video-container">
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0&loop=1&playlist=${trailerKey}`}
            className="hero-video-iframe"
            frameBorder="0"
            allow="autoplay; encrypted-media"
          />
        </div>
      )}

      {/* Layer 1: Background Image */}
      <div className={`hero-bg-layer ${showTrailer ? 'hide-image' : ''}`}>
        <img
          src={backdrop_path ? `https://image.tmdb.org/t/p/original${backdrop_path}` : (poster_path ? `https://image.tmdb.org/t/p/original${poster_path}` : '')}
          alt={displayTitle}
          className="hero-bg-img"
        />
        <div className="hero-bg-blur" />
      </div>

      {/* Layer 2: Gradient Overlay */}
      <div className="hero-gradient-overlay" />

      {/* Layer 3: Film Grain */}
      <div className="hero-grain" />

      {/* Layer 4: Radial Glow */}
      <div className="hero-glow" />

      {/* Content */}
      <div className={`hero-content ${isLoaded ? 'loaded' : ''}`}>

        {/* Left: Main Content */}
        <div className="hero-main">
          {/* Brand Tag */}


          {/* Title */}
          <h1
            className="hero-title"
            style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.3}px)` }}
          >
            {displayTitle}
          </h1>

          {/* Metadata Row */}
          <div
            className="hero-meta"
            style={{ animationDelay: '0.4s' }}
          >
            <span className="hero-meta-rating">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {rating}
            </span>
            <span className="hero-meta-dot">•</span>
            <span>{year}</span>
            <span className="hero-meta-dot">•</span>
            <span>{genreName}</span>
            <span className="hero-meta-dot">•</span>
            {/* <span>{displayRuntime}</span> */}
            <span className="hero-meta-badge">4K</span>
          </div>

          {/* Subtitle */}
          <p
            className="hero-subtitle"
            style={{ animationDelay: '0.5s' }}
          >
            {overview?.slice(0, 180)}
            {(overview?.length || 0) > 180 && '...'}
          </p>

          {/* CTA Buttons */}
          <div
            className="hero-actions"
            style={{ animationDelay: '0.6s' }}
          >
            <button
              className="hero-btn hero-btn-primary"
              onClick={handleWatch}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Now
            </button>
            <button className="hero-btn hero-btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add to List
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hero-scroll">
        <span>Scroll to explore</span>
        <div className="hero-scroll-line">
          <div className="hero-scroll-dot" />
        </div>
      </div>
    </section>
  )
}

export default Hero
