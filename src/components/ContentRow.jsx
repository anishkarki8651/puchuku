import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaCheck, FaTrash } from 'react-icons/fa'
import { getVideos } from '../api/tmdb'
import { useAuth } from '../contexts/AuthContext'
import { useLayoutAnimation } from '../contexts/LayoutAnimationContext'
import { apiAddToMyList, apiRemoveFromMyList, apiGetMyList } from '../api/backend'
import { removeFromContinueWatching } from '../utils/continueWatching'
import './ContentRow.css'

// Generate unique layout ID for card animations
const getCardLayoutId = (itemId, categoryId) => `card-${itemId}-${categoryId}`

function ContentRow({ title, items, categoryId, isContinueWatching = false, myListIds }) {
  const navigate = useNavigate()
  const { registerCardAnimation } = useLayoutAnimation()
  const rowRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [localItems, setLocalItems] = useState(items)

  // Sync local items when props change
  useEffect(() => {
    setLocalItems(items)
  }, [items])

  if (!localItems?.length) return null

  const handleRemoveItem = async (itemId, mediaType) => {
    await removeFromContinueWatching(itemId, mediaType)
    setLocalItems(prev => prev.filter(item => {
      const itemMediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie')
      return !(item.id === itemId && itemMediaType === mediaType)
    }))
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setStartX(e.pageX - rowRef.current.offsetLeft)
    setScrollLeft(rowRef.current.scrollLeft)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - rowRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    rowRef.current.scrollLeft = scrollLeft - walk
  }

  const handleSeeAll = () => {
    if (categoryId) {
      // Register all visible items for layout animation
      items.forEach((item, index) => {
        // Only animate first 10 items for performance
        if (index < 10) {
          registerCardAnimation(getCardLayoutId(item.id, categoryId))
        }
      })

      // Navigate with state containing the items for seamless transition
      navigate(`/category/${categoryId}`, {
        state: {
          preloadedItems: items.slice(0, 20),
          sourceRow: categoryId,
          timestamp: Date.now()
        }
      })
    }
  }

  return (
    <section className="content-row">
      <div className="row-header">
        <h2 className="row-title">{title}</h2>
        {categoryId && (
          <button className="see-all-btn" onClick={handleSeeAll}>
            See All
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      <div
        className="row-scroll"
        ref={rowRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div className="row-items">
          {localItems.map((item, index) => (
            <ContentCard
              key={item.id}
              item={item}
              index={index}
              layoutId={categoryId ? getCardLayoutId(item.id, categoryId) : null}
              isContinueWatching={isContinueWatching}
              myListIds={myListIds}
              onRemove={() => handleRemoveItem(item.id, item.media_type || (item.first_air_date ? 'tv' : 'movie'))}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function ContentCard({ item, index, layoutId, isContinueWatching = false, onRemove, myListIds }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [inMyList, setInMyList] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)
  const [removing, setRemoving] = useState(false)

  const title = item.title || item.name
  const posterPath = item.poster_path
  const backdropPath = item.backdrop_path || item.poster_path
  const rating = item.vote_average?.toFixed(1)
  const year = (item.release_date || item.first_air_date || '').split('-')[0]

  // Some endpoints don't return media_type natively, so we fallback to checking if it has a first_air_date (TV) vs release_date (Movie)
  const isTV = item.media_type === 'tv' || item.first_air_date !== undefined
  const displayType = isTV ? 'Series' : 'Movie'
  const routeType = isTV ? 'tv' : 'movie'

  // Check if item is in My List using passed IDs (optimized - no API call per card)
  useEffect(() => {
    if (!isAuthenticated) return
    // If myListIds is provided, use it; otherwise fall back to API call for backwards compatibility
    if (myListIds) {
      const key = `${item.id}-${routeType}`
      setInMyList(myListIds.has(key))
    } else {
      // Fallback: fetch from API if myListIds not provided
      apiGetMyList()
        .then(list => {
          const found = list.some(i => i.id === item.id && i.media_type === routeType)
          setInMyList(found)
        })
        .catch(() => { })
    }
  }, [isAuthenticated, item.id, routeType, myListIds])

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ message, type })
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500)
  }

  const handleToggleList = async (e) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (listLoading) return
    setListLoading(true)
    try {
      if (inMyList) {
        await apiRemoveFromMyList(item.id, routeType)
        setInMyList(false)
        showToast('Removed from My List', 'remove')
      } else {
        await apiAddToMyList({ ...item, media_type: routeType })
        setInMyList(true)
        showToast('Added to My List ✓', 'success')
      }
    } catch (err) {
      showToast('Something went wrong', 'error')
    } finally {
      setListLoading(false)
    }
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const handleClick = () => {
    let url = `/watch/${routeType}/${item.id}`
    if (item.season && item.episode) {
      url += `?s=${item.season}&e=${item.episode}`
    } else if (isContinueWatching) {
      url += `?from_continue=1`
    }
    navigate(url)
  }


  return (
    <motion.article
      className="content-card"
      layoutId={layoutId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="card-spacer"></div>
      <div className="card-expander">
        <div className="card-image-container">
          {posterPath ? (
            <>
              <img
                src={`https://image.tmdb.org/t/p/w342${posterPath}`}
                alt={title}
                className={`card-image ${imageLoaded ? 'loaded' : ''} ${isExpanded ? 'hidden' : ''}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
              <img
                src={`https://image.tmdb.org/t/p/w780${backdropPath || posterPath}`}
                alt={title}
                className={`card-image card-backdrop ${isExpanded ? 'loaded visible' : ''}`}
                loading="lazy"
              />
              <div className="card-image-placeholder"></div>
            </>
          ) : (
            <div className="card-no-image">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}

          {/* No expansion video */}

          {/* Hover Overlay */}
          <div className={`card-overlay ${isHovered && !isExpanded ? 'visible' : ''}`}>
            <div className="card-play">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isHovered && (
          <div className="card-actions">
            {isContinueWatching && (
              <button
                className="card-remove-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                title="Remove from Continue Watching"
                disabled={removing}
              >
                <FaTrash />
              </button>
            )}
            <button
              className={`card-watchlist-btn ${inMyList ? 'in-list' : ''}`}
              onClick={handleToggleList}
              title={inMyList ? 'Remove from My List' : 'Add to My List'}
            >
              {inMyList ? <FaCheck /> : <FaPlus />}
            </button>
          </div>
        )}


        <div className="card-info">
          <h3 className="card-title">{title}</h3>
          <div className="card-meta">
            <span className="card-type">{displayType}</span>
            {isTV && item.season && item.episode && (
              <span className="card-progress">S{item.season} E{item.episode}</span>
            )}
            {year && <span className="card-year">{year}</span>}
            {rating && (
              <span className="card-rating">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {rating}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`card-toast ${toast.type}`}
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            transition={{ duration: 0.3 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

export default ContentRow
