import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaArrowUp, FaPlus, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getTrending,
  getPopular,
  getTopRated,
  getNowPlaying,
  getOnTheAir,
  getByGenre
} from '../api/tmdb';
import { useAuth } from '../contexts/AuthContext';
import { useLayoutAnimation } from '../contexts/LayoutAnimationContext';
import { apiGetMyList, apiAddToMyList, apiRemoveFromMyList } from '../api/backend';
import ContentRow from '../components/ContentRow';
import './Home.css';

// Generate unique layout ID for card animations (must match ContentRow)
const getCardLayoutId = (itemId, categoryId) => `card-${itemId}-${categoryId}`; 

// Grid item animation variants
const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.03,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

function Category() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { animatingCards, clearAllAnimations } = useLayoutAnimation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [myListIds, setMyListIds] = useState(new Set());
  const [toast, setToast] = useState(null);
  const { isAuthenticated } = useAuth();
  const toastRef = useRef(null);

  // Check if we have preloaded items from navigation state
  const preloadedItems = location.state?.preloadedItems;
  const sourceRow = location.state?.sourceRow; 

  // Clear animations after transition completes
  useEffect(() => {
    const timer = setTimeout(() => {
      clearAllAnimations();
    }, 1000);
    return () => clearTimeout(timer);
  }, [clearAllAnimations]);

  const fetchData = async (pageNumber = 1) => {
    if (pageNumber > 1) setFetchingMore(true);
    else setLoading(true);

    let data = [];
    let pageTitle = '';
    const [type, category, extra] = id.split('-');

    try {
      if (id === 'trending') {
        data = await getTrending('all', 'week', pageNumber);
        pageTitle = 'Trending Weekly';
      } else if (category === 'trending') {
        data = await getTrending(type, 'week', pageNumber);
        pageTitle = `Trending ${type === 'movie' ? 'Movies' : 'TV Shows'}`;
      } else if (category === 'popular') {
        data = await getPopular(type, pageNumber);
        pageTitle = `Popular ${type === 'movie' ? 'Movies' : 'TV Shows'}`;
      } else if (category === 'top_rated') {
        data = await getTopRated(type, pageNumber);
        pageTitle = `Top Rated ${type === 'movie' ? 'Movies' : 'TV Shows'}`;
      } else if (category === 'now_playing' || category === 'on_the_air') {
        data = type === 'movie' ? await getNowPlaying(pageNumber) : await getOnTheAir(pageNumber);
        pageTitle = type === 'movie' ? 'Now Playing in Theaters' : 'Currently On Air';
      } else if (category === 'genre' && extra) {
        data = await getByGenre(type, extra, pageNumber);
        pageTitle = `${type === 'movie' ? 'Movie' : 'TV'} Collection`;
      }

      if (data.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => pageNumber === 1 ? data : [...prev, ...data]);
        setTitle(pageTitle);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  useEffect(() => {
    // If we have preloaded items from the "See All" transition, use them first
    if (preloadedItems && preloadedItems.length > 0) {
      setItems(preloadedItems);
      setLoading(false);
      // Still fetch fresh data to ensure we have latest
      fetchData(1);
    } else {
      setItems([]);
      setPage(1);
      setHasMore(true);
      fetchData(1);
    }
  }, [id, preloadedItems]);

  useEffect(() => {
    const handleScroll = () => {
      // Check for Back to Top visibility
      if (window.scrollY > 800) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }

      // Check for Infinite Scroll
      if (loading || fetchingMore || !hasMore) return;

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchData(nextPage);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, loading, fetchingMore, hasMore, id]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
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

  return (
    <main className="category-page">
      <div className="category-header">
        <button className="back-btn-minimal" onClick={() => navigate(-1)}>
          <FaArrowLeft />
          <span>Back</span>
        </button>
        <h1 className="category-title">{title}</h1>
      </div>

      <motion.div 
        className="category-grid"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.02
            }
          }
        }}
      >
        {items.map((item, index) => {
          // Check if this card should animate from previous position
          const layoutId = sourceRow && index < 10 ? getCardLayoutId(item.id, sourceRow) : null;
          
          return (
            <motion.article
              key={`${item.id}-${index}`}
              className="category-item-card"
              layoutId={layoutId}
              custom={index}
              variants={gridItemVariants}
              initial={layoutId ? false : "hidden"}
              animate="visible"
              whileHover={{ 
                scale: 1.05, 
                zIndex: 10,
                transition: { duration: 0.2 }
              }}
              onClick={() => navigate(`/watch/${item.media_type || (item.first_air_date ? 'tv' : 'movie')}/${item.id}`)}
            >
              <div className="item-poster-wrapper">
                <img
                  src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                  alt={item.title || item.name}
                  loading="lazy"
                />
                <div className="item-overlay">
                  <div className="item-play">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <button
                  className={`card-watchlist-btn ${myListIds.has(`${item.id}-${item.media_type || (item.first_air_date ? 'tv' : 'movie')}`) ? 'in-list' : ''}`}
                  onClick={(e) => handleToggleList(e, item)}
                  title={myListIds.has(`${item.id}-${item.media_type || (item.first_air_date ? 'tv' : 'movie')}`) ? 'Remove from My List' : 'Add to My List'}
                >
                  {myListIds.has(`${item.id}-${item.media_type || (item.first_air_date ? 'tv' : 'movie')}`) ? <FaCheck /> : <FaPlus />}
                </button>
              </div>
              <div className="item-info">
                <h3>{item.title || item.name}</h3>
                <div className="item-meta">
                  <span>{(item.release_date || item.first_air_date || '').split('-')[0]}</span>
                  <span className="rating-pill">{item.vote_average?.toFixed(1)} ★</span>
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.div>

      {fetchingMore && (
        <div className="loading-more">
          <div className="loader small"></div>
        </div>
      )}

      {items.length > 0 && (
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              className="back-to-top"
              onClick={scrollToTop}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              whileTap={{ scale: 0.9 }}
              title="Back to Top"
            >
              <FaArrowUp />
            </motion.button>
          )}
        </AnimatePresence>
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

      <style jsx="true">{`
        .category-page {
          padding: 120px 5vw 60px;
          min-height: 100vh;
          position: relative;
        }

        /* Watchlist Button in Grid */
        .category-item-card {
          position: relative;
          cursor: pointer;
        }

        .category-item-card .card-watchlist-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10;
          opacity: 0;
          transform: scale(0.8);
        }

        .category-item-card:hover .card-watchlist-btn {
          opacity: 1;
          transform: scale(1);
        }

        .category-item-card .card-watchlist-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.15);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .category-item-card .card-watchlist-btn.in-list {
          background: rgba(34, 197, 94, 0.7);
          border-color: rgba(34, 197, 94, 0.5);
          opacity: 1;
          transform: scale(1);
        }

        .category-item-card .card-watchlist-btn.in-list:hover {
          background: rgba(239, 68, 68, 0.7);
          border-color: rgba(239, 68, 68, 0.5);
        }

        /* Toast Styling */
        .card-toast {
          padding: 0.7rem 1.4rem;
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #fff;
          z-index: 1000;
          pointer-events: none;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
        }

        .card-toast.success { border-color: rgba(34, 197, 94, 0.4); color: #22c55e; }
        .card-toast.remove { border-color: rgba(251, 191, 36, 0.4); color: #fbbf24; }
        .card-toast.error { border-color: rgba(239, 68, 68, 0.4); color: #ef4444; }

        .category-page {
          padding: 120px 5vw 60px;
          min-height: 100vh;
        }
        
        .category-header {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        .back-btn-minimal {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 0.8rem 1.2rem;
          border-radius: 50px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          transition: all 0.3s ease;
        }
        
        .back-btn-minimal:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(-5px);
        }
        
        .category-title {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -1px;
        }
        
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 2rem;
        }
        
        .category-item-card {
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .category-item-card:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .item-poster-wrapper {
          position: relative;
          aspect-ratio: 2/3;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 1rem;
          background: #111;
        }
        
        .item-poster-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .item-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          height: 100%;
          transition: opacity 0.3s ease;
        }
        
        .category-item-card:hover .item-overlay {
          opacity: 1;
        }
        
        .item-play {
          width: 48px;
          height: 48px;
          background: #fff;
          color: #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: scale(0.8);
          transition: transform 0.3s ease;
        }
        
        .category-item-card:hover .item-play {
          transform: scale(1);
        }
        
        .item-info h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .item-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .rating-pill {
          color: #fbbf24;
          font-weight: 600;
        }
        
        @media (max-width: 768px) {
          .category-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 1rem;
          }
          
          .category-title {
            font-size: 1.8rem;
          }
        }

        .loading-more, .no-more {
          display: flex;
          justify-content: center;
          padding: 4rem 0;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.9rem;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .loader.small {
          width: 30px;
          height: 30px;
          border-width: 2px;
        }

        .back-to-top {
          position: fixed;
          bottom: 40px;
          right: 40px;
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          cursor: pointer;
          z-index: 1000;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        @media (max-width: 768px) {
          .back-to-top {
            bottom: 24px;
            right: 24px;
            width: 48px;
            height: 48px;
          }
        }
      `}</style>
    </main>
  );
}

export default Category;
