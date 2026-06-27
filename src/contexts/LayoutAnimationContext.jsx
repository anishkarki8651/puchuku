import { createContext, useContext, useState, useCallback } from 'react'

const LayoutAnimationContext = createContext()

export function LayoutAnimationProvider({ children }) {
  const [animatingCards, setAnimatingCards] = useState(new Set())
  const [animatingHero, setAnimatingHero] = useState(null)

  const registerCardAnimation = useCallback((cardId) => {
    setAnimatingCards(prev => new Set([...prev, cardId]))
  }, [])

  const clearCardAnimation = useCallback((cardId) => {
    setAnimatingCards(prev => {
      const next = new Set(prev)
      next.delete(cardId)
      return next
    })
  }, [])

  const registerHeroAnimation = useCallback((heroId, imageUrl) => {
    setAnimatingHero({ id: heroId, imageUrl })
  }, [])

  const clearHeroAnimation = useCallback(() => {
    setAnimatingHero(null)
  }, [])

  const clearAllAnimations = useCallback(() => {
    setAnimatingCards(new Set())
    setAnimatingHero(null)
  }, [])

  return (
    <LayoutAnimationContext.Provider
      value={{
        animatingCards,
        animatingHero,
        registerCardAnimation,
        clearCardAnimation,
        registerHeroAnimation,
        clearHeroAnimation,
        clearAllAnimations
      }}
    >
      {children}
    </LayoutAnimationContext.Provider>
  )
}

export function useLayoutAnimation() {
  const context = useContext(LayoutAnimationContext)
  if (!context) {
    throw new Error('useLayoutAnimation must be used within a LayoutAnimationProvider')
  }
  return context
}
