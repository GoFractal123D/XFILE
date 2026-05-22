'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, mockUsers, Content, contents, HistoryItem, WatchlistItem } from '@/lib/data'

interface AppContextType {
  user: User | null
  setUser: (user: User | null) => void
  watchlist: WatchlistItem[]
  addToWatchlist: (contentId: string) => void
  removeFromWatchlist: (contentId: string) => void
  isInWatchlist: (contentId: string) => boolean
  history: HistoryItem[]
  addToHistory: (item: Omit<HistoryItem, 'watchedAt'>) => void
  getWatchlistContents: () => Content[]
  getHistoryContents: () => (Content & { progress: number; duration: number })[]
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('lumina_user')
    const storedWatchlist = localStorage.getItem('lumina_watchlist')
    const storedHistory = localStorage.getItem('lumina_history')
    
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
    if (storedWatchlist) {
      setWatchlist(JSON.parse(storedWatchlist))
    }
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory))
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('lumina_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('lumina_user')
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem('lumina_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  useEffect(() => {
    localStorage.setItem('lumina_history', JSON.stringify(history))
  }, [history])

  const login = async (email: string, _password: string): Promise<boolean> => {
    // Simulate login - in real app, this would call an API
    const foundUser = mockUsers.find(u => u.email === email)
    if (foundUser) {
      setUser(foundUser)
      setIsAuthenticated(true)
      return true
    }
    // For demo, create a new user
    const newUser: User = {
      id: Date.now().toString(),
      name: email.split('@')[0],
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      isAdmin: false,
    }
    setUser(newUser)
    setIsAuthenticated(true)
    return true
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('lumina_user')
  }

  const addToWatchlist = (contentId: string) => {
    if (!watchlist.some(w => w.contentId === contentId)) {
      setWatchlist(prev => [...prev, { contentId, addedAt: new Date() }])
    }
  }

  const removeFromWatchlist = (contentId: string) => {
    setWatchlist(prev => prev.filter(w => w.contentId !== contentId))
  }

  const isInWatchlist = (contentId: string) => {
    return watchlist.some(w => w.contentId === contentId)
  }

  const addToHistory = (item: Omit<HistoryItem, 'watchedAt'>) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.contentId !== item.contentId)
      return [{ ...item, watchedAt: new Date() }, ...filtered]
    })
  }

  const getWatchlistContents = () => {
    return watchlist
      .map(w => contents.find(c => c.id === w.contentId))
      .filter((c): c is Content => c !== undefined)
  }

  const getHistoryContents = () => {
    return history
      .map(h => {
        const content = contents.find(c => c.id === h.contentId)
        if (content) {
          return { ...content, progress: h.progress, duration: h.duration }
        }
        return null
      })
      .filter((c): c is Content & { progress: number; duration: number } => c !== null)
  }

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        history,
        addToHistory,
        getWatchlistContents,
        getHistoryContents,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
