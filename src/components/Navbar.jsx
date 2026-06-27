import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { apiGetProfiles } from '../api/backend'
import './Navbar.css'

function Navbar({ onSearchClick }) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, activeProfile, profiles, setProfiles, selectProfile, clearProfile, logout } = useAuth()
  const menuRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated) {
      apiGetProfiles().then(setProfiles).catch(console.error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHidden(true)
      } else {
        setHidden(false)
      }

      setScrolled(currentScrollY > 50)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
    navigate('/')
  }

  const handleSwitchProfile = () => {
    clearProfile()
    setShowProfileMenu(false)
    navigate('/profiles')
  }

  return (
    <>
      <motion.nav
        className={`navbar ${scrolled ? 'scrolled' : ''} ${hidden ? 'hidden' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            Puchuku
          </Link>

          {/* Navigation Links */}
          <div className="navbar-links">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
            <Link to="/movies" className={`nav-link ${location.pathname === '/movies' ? 'active' : ''}`}>Movies</Link>
            <Link to="/tv" className={`nav-link ${location.pathname === '/tv' ? 'active' : ''}`}>TV Shows</Link>
            {isAuthenticated && (
              <Link to="/my-list" className={`nav-link ${location.pathname === '/my-list' ? 'active' : ''}`}>My List</Link>
            )}
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            <button className="search-btn" onClick={onSearchClick} aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            {isAuthenticated ? (
              <div className="profile-wrapper" ref={menuRef}>
                <button
                  className="profile-btn"
                  aria-label="Profile"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <div className="nav-profile-avatar">
                    {activeProfile?.avatar ? (
                      <img src={activeProfile.avatar} alt={activeProfile.name} />
                    ) : user?.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <span>{activeProfile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      className="profile-menu"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="profile-menu-header">
                        <div className="profile-menu-avatar">
                          {activeProfile?.avatar ? (
                            <img src={activeProfile.avatar} alt={activeProfile.name} />
                          ) : user?.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                          ) : (
                            <span>{activeProfile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="profile-menu-name">{activeProfile?.name || user?.name}</div>
                          <div className="profile-menu-email">{user?.email}</div>
                        </div>
                      </div>

                      <div className="profile-menu-divider" />

                      {/* Secondary Profiles List */}
                      {/* <div className="profile-menu-profiles">
                        {profiles
                          .filter(p => p.id !== activeProfile?.id)
                          .map(p => (
                            <div
                              key={p.id}
                              className="profile-menu-item secondary-profile"
                              onClick={() => {
                                selectProfile(p);
                                setShowProfileMenu(false);
                              }}
                            >
                              <img src={p.avatar} alt={p.name} className="mini-avatar" />
                              <span>{p.name}</span>
                            </div>
                          ))
                        }
                      </div> */}

                      <div className="profile-menu-divider" />
                      <Link to="/my-list" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                        My List
                      </Link>
                      <button className="profile-menu-item" onClick={() => navigate('/profiles?manage=true')}>
                        Manage Profiles
                      </button>
                      <button className="profile-menu-item" onClick={handleSwitchProfile}>
                        Switch Profile
                      </button>
                      <div className="profile-menu-divider" />
                      <button className="profile-menu-item logout" onClick={handleLogout}>
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="signin-btn">Sign In</Link>
            )}
          </div>
        </div>
      </motion.nav>

      <nav className="mobile-bottom-nav">
        <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </Link>
        
        <Link to="/movies" className={`mobile-nav-item ${location.pathname === '/movies' ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="17" x2="22" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
          </svg>
          <span>Movies</span>
        </Link>
        
        <Link to="/tv" className={`mobile-nav-item ${location.pathname === '/tv' ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
            <polyline points="17 2 12 7 7 2" />
          </svg>
          <span>TV Shows</span>
        </Link>
        
        {isAuthenticated && (
          <Link to="/my-list" className={`mobile-nav-item ${location.pathname === '/my-list' ? 'active' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>My List</span>
          </Link>
        )}
      </nav>
    </>
  )
}

export default Navbar
