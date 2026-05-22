'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/context'
import {
  Home,
  Film,
  Tv,
  Video,
  HardDrive,
  Heart,
  Clock,
  User,
  Settings,
  Search,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navItems = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/films', label: 'Films', icon: Film },
  { href: '/series', label: 'Séries', icon: Tv },
  { href: '/videos', label: 'Video', icon: Video },
  { href: '/offline', label: 'Hors ligne', icon: HardDrive },
]

const userNavItems = [
  { href: '/watchlist', label: 'Ma Liste', icon: Heart },
  { href: '/history', label: 'Historique', icon: Clock },
]

export function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useApp()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? 'bg-background/95 backdrop-blur-xl border-b border-border/50'
            : 'bg-gradient-to-b from-background/80 to-transparent'
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-2xl md:text-3xl font-bold tracking-tight"
              >
                <span className="text-primary">XFILE</span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`relative px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                        />
                      )}
                    </motion.div>
                  </Link>
                )
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Search */}
              <AnimatePresence>
                {isSearchOpen ? (
                  <motion.form
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    onSubmit={handleSearch}
                    className="hidden md:flex items-center"
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher..."
                        autoFocus
                        className="w-64 px-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false)
                          setSearchQuery('')
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsSearchOpen(true)}
                    className="hidden md:flex p-2 hover:bg-secondary/50 rounded-lg transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* User Menu */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hidden md:flex items-center gap-2 px-2 hover:bg-secondary/50"
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium">{user.name}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 glass">
                    {userNavItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-2">
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Administration
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login" className="hidden md:block">
                  <Button variant="default" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Connexion
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-secondary/50 rounded-lg"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 z-40 bg-background/98 backdrop-blur-xl lg:hidden overflow-auto"
          >
            <div className="p-4 space-y-6">
              {/* Mobile Search */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un film, une série..."
                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </form>

              {/* Mobile Nav Items */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </motion.div>
                    </Link>
                  )
                })}
              </nav>

              {/* User Section */}
              {isAuthenticated && user ? (
                <>
                  <div className="border-t border-border pt-4">
                    <nav className="space-y-1">
                      {userNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
                          >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                          </motion.div>
                        </Link>
                      ))}
                    </nav>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-3 px-4 mb-4">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <nav className="space-y-1">
                      <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
                        >
                          <User className="w-5 h-5" />
                          <span className="font-medium">Profil</span>
                        </motion.div>
                      </Link>
                      {user.isAdmin && (
                        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
                          >
                            <Settings className="w-5 h-5" />
                            <span className="font-medium">Administration</span>
                          </motion.div>
                        </Link>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          logout()
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 transition-colors w-full text-destructive"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Déconnexion</span>
                      </motion.button>
                    </nav>
                  </div>
                </>
              ) : (
                <div className="border-t border-border pt-4">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-primary text-primary-foreground">
                      Connexion
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
