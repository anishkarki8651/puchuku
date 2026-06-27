import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'
import SearchModal from './SearchModal'
import '../App.css'

function Layout({ children }) {
    const [showSearch, setShowSearch] = useState(false)
    const location = useLocation()
    const isWatch = location.pathname.startsWith('/watch')
    const isAuth = location.pathname === '/login' || location.pathname === '/register'
    const hideChrome = isWatch || isAuth

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' || (e.key === 'k' && e.metaKey)) {
                e.preventDefault()
                setShowSearch(true)
            }
            if (e.key === 'Escape') {
                setShowSearch(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <div className="app">
            {!hideChrome && <Navbar onSearchClick={() => setShowSearch(true)} />}

            <main className={`main-content ${!hideChrome ? 'with-bottom-nav' : ''}`}>
                {children}
            </main>

            {!hideChrome && (
                <footer className="footer">
                    <div className="footer-content">
                        <div className="footer-grid">
                            <div className="footer-brand">
                                <div className="footer-logo">Puchuku</div>
                                <p className="footer-tagline">Your gateway to infinite entertainment. Stream movies and TV shows in stunning cinematic quality.</p>
                            </div>
                            <div className="footer-section">
                                <h4>Browse</h4>
                                <div className="footer-links">
                                    <a href="/">Home</a>
                                    <a href="/movies">Movies</a>
                                    <a href="/tv">TV Shows</a>
                                    <a href="#">New Releases</a>
                                </div>
                            </div>
                            <div className="footer-section">
                                <h4>Genres</h4>
                                <div className="footer-links">
                                    <a href="#">Action</a>
                                    <a href="#">Comedy</a>
                                    <a href="#">Drama</a>
                                    <a href="#">Sci-Fi</a>
                                </div>
                            </div>
                            <div className="footer-section">
                                <h4>Help</h4>
                                <div className="footer-links">
                                    <a href="#">FAQ</a>
                                    <a href="#">Contact</a>
                                    <a href="#">Terms</a>
                                    <a href="#">Privacy</a>
                                </div>
                            </div>
                        </div>
                        <div className="footer-bottom">
                            <p>© 2024 Puchuku. All rights reserved.</p>
                            <p>Powered by TMDB</p>
                        </div>
                    </div>
                </footer>
            )}

            <AnimatePresence>
                {showSearch && (
                    <SearchModal
                        onClose={() => setShowSearch(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default Layout
