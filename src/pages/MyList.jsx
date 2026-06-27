import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiGetMyList, apiRemoveFromMyList } from '../api/backend';
import './Home.css';

function MyList() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchList();
    }, [isAuthenticated]);

    const fetchList = async () => {
        setLoading(true);
        try {
            const data = await apiGetMyList();
            setItems(data);
        } catch (err) {
            console.error('Failed to fetch My List:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (e, tmdbId, mediaType) => {
        e.stopPropagation();
        try {
            await apiRemoveFromMyList(tmdbId, mediaType);
            setItems(prev => prev.filter(i => !(i.id === tmdbId && i.media_type === mediaType)));
        } catch (err) {
            console.error('Failed to remove:', err);
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
        <main className="mylist-page">
            <div className="mylist-header">
                <button className="back-btn-minimal" onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                    <span>Back</span>
                </button>
                <h1 className="mylist-title">My List</h1>
            </div>

            {items.length === 0 ? (
                <div className="mylist-empty">
                    <div className="empty-icon">📋</div>
                    <h2>Your list is empty</h2>
                    <p>Start adding movies and TV shows to your personal collection</p>
                    <Link to="/" className="browse-btn">Browse Content</Link>
                </div>
            ) : (
                <div className="mylist-grid">
                    <AnimatePresence>
                        {items.map((item, index) => (
                            <motion.article
                                key={`${item.id}-${item.media_type}`}
                                className="mylist-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.4, delay: index * 0.03 }}
                                onClick={() => navigate(`/watch/${item.media_type}/${item.id}`)}
                            >
                                <div className="mylist-poster">
                                    <img
                                        src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                                        alt={item.title}
                                        loading="lazy"
                                    />
                                    <div className="mylist-overlay">
                                        <div className="mylist-play">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                        <button
                                            className="mylist-remove"
                                            onClick={(e) => handleRemove(e, item.id, item.media_type)}
                                            title="Remove from list"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                                <div className="mylist-info">
                                    <h3>{item.title}</h3>
                                    <div className="mylist-meta">
                                        <span>{(item.release_date || '').split('-')[0]}</span>
                                        <span className="mylist-rating">{item.vote_average?.toFixed(1)} ★</span>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <style jsx="true">{`
        .mylist-page {
          padding: 120px 5vw 60px;
          min-height: 100vh;
        }
        .mylist-header {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 3rem;
        }
        .back-btn-minimal {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
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
          background: rgba(255,255,255,0.1);
          transform: translateX(-5px);
        }
        .mylist-title {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -1px;
        }
        .mylist-empty {
          text-align: center;
          padding: 8rem 2rem;
          color: rgba(255,255,255,0.5);
        }
        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }
        .mylist-empty h2 {
          font-size: 1.8rem;
          color: #fff;
          margin-bottom: 0.5rem;
        }
        .mylist-empty p {
          margin-bottom: 2rem;
        }
        .browse-btn {
          display: inline-block;
          padding: 0.9rem 2rem;
          background: #fff;
          color: #000;
          border-radius: 50px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .browse-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255,255,255,0.1);
        }
        .mylist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 2rem;
        }
        .mylist-card {
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mylist-card:hover {
          transform: translateY(-10px);
        }
        .mylist-poster {
          position: relative;
          aspect-ratio: 2/3;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 1rem;
          background: #111;
        }
        .mylist-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .mylist-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .mylist-card:hover .mylist-overlay {
          opacity: 1;
        }
        .mylist-play {
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
        .mylist-card:hover .mylist-play {
          transform: scale(1);
        }
        .mylist-remove {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(239, 68, 68, 0.8);
          border: none;
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.8rem;
        }
        .mylist-remove:hover {
          background: #ef4444;
          transform: scale(1.1);
        }
        .mylist-info h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mylist-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
        }
        .mylist-rating {
          color: #fbbf24;
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .mylist-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 1rem;
          }
          .mylist-title { font-size: 1.8rem; }
        }
      `}</style>
        </main>
    );
}

export default MyList;
