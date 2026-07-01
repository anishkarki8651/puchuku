import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import { LayoutAnimationProvider } from './contexts/LayoutAnimationContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Category from './pages/Category'
import Watch from './pages/Watch'
import Login from './pages/Login'
import Register from './pages/Register'
import MyList from './pages/MyList'
import Profiles from './pages/Profiles'
import Search from './pages/Search'
import { Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'
import InstallPWA from './components/InstallPWA'

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()
  
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  
  return null
}

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  }
}

const pageTransition = {
  type: 'tween',
  ease: [0.43, 0.13, 0.23, 0.96],
  duration: 0.4
}

function ProfileRequiredRoute({ children }) {
  const { isAuthenticated, activeProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (location.pathname === '/profiles') {
    return children;
  }

  if (!activeProfile) {
    return <Navigate to="/profiles" replace />;
  }

  return children;
}

// Animated wrapper for page transitions
function AnimatedPage({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ width: '100%', minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/login" element={
          <AnimatedPage><Login /></AnimatedPage>
        } />
        <Route path="/register" element={
          <AnimatedPage><Register /></AnimatedPage>
        } />

        {/* Routes that only require Authentication (Profile choosing) */}
        <Route path="/profiles" element={
          <ProfileRequiredRoute>
            <AnimatedPage><Profiles /></AnimatedPage>
          </ProfileRequiredRoute>
        } />

        {/* Routes that require both Auth and an Active Profile */}
        <Route path="/" element={
          <ProfileRequiredRoute>
            <AnimatedPage><Home /></AnimatedPage>
          </ProfileRequiredRoute>
        } />
        <Route path="/movies" element={
          <ProfileRequiredRoute>
            <AnimatedPage><Browse type="movie" /></AnimatedPage>
          </ProfileRequiredRoute>
        } />
        <Route path="/tv" element={
          <ProfileRequiredRoute>
            <AnimatedPage><Browse type="tv" /></AnimatedPage>
          </ProfileRequiredRoute>
        } />
        <Route path="/category/:id" element={
          <ProfileRequiredRoute>
            <AnimatedPage><Category /></AnimatedPage>
          </ProfileRequiredRoute>
        } />
        <Route path="/watch/:type/:id" element={
          <ProfileRequiredRoute>
            <AnimatedPage><Watch /></AnimatedPage>
          </ProfileRequiredRoute>
        } />
        <Route path="/my-list" element={
          <ProfileRequiredRoute>
            <AnimatedPage><MyList /></AnimatedPage>
          </ProfileRequiredRoute>
        } />
        <Route path="/search" element={
          <ProfileRequiredRoute>
            <AnimatedPage><Search /></AnimatedPage>
          </ProfileRequiredRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <LayoutAnimationProvider>
        <BrowserRouter>
          <ScrollToTop />
<Layout>
             <AnimatedRoutes />
           </Layout>
           {/* <InstallPWA /> */}
        </BrowserRouter>
      </LayoutAnimationProvider>
    </AuthProvider>
  )
}

export default App
