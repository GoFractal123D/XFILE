'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  MoreVertical,
  Shield,
  ShieldOff,
  Trash2,
  Mail,
  Calendar,
  Crown,
  User,
} from 'lucide-react'
import { mockUsers } from '@/lib/data'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Generate more mock users for the admin panel
const allUsers = [
  ...mockUsers,
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `user-${i + 4}`,
    name: `Utilisateur ${i + 4}`,
    email: `user${i + 4}@example.com`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 4}`,
    isAdmin: false,
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    subscription: Math.random() > 0.3 ? 'premium' : 'free',
  })),
]

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'premium' | 'free'>('all')

  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchesFilter = true
    if (filterType === 'admin') matchesFilter = user.isAdmin
    else if (filterType === 'premium') matchesFilter = ('subscription' in user) && user.subscription === 'premium'
    else if (filterType === 'free') matchesFilter = ('subscription' in user) && user.subscription === 'free'
    
    return matchesSearch && matchesFilter
  })

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground">
          {allUsers.length} utilisateurs enregistrés
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold">{allUsers.length}</p>
          <p className="text-sm text-muted-foreground">Total utilisateurs</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold">{allUsers.filter(u => u.isAdmin).length}</p>
          <p className="text-sm text-muted-foreground">Administrateurs</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-primary">
            {allUsers.filter(u => ('subscription' in u) && u.subscription === 'premium').length}
          </p>
          <p className="text-sm text-muted-foreground">Premium</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold">
            {allUsers.filter(u => !('subscription' in u) || u.subscription === 'free').length}
          </p>
          <p className="text-sm text-muted-foreground">Gratuit</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'admin', 'premium', 'free'] as const).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type)}
            >
              {type === 'all'
                ? 'Tous'
                : type === 'admin'
                ? 'Admins'
                : type === 'premium'
                ? 'Premium'
                : 'Gratuit'}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 font-medium">Utilisateur</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Statut</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Inscription</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Dernière connexion</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-border hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.name}</p>
                          {user.isAdmin && (
                            <Shield className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.isAdmin
                          ? 'bg-primary/10 text-primary'
                          : ('subscription' in user) && user.subscription === 'premium'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {user.isAdmin ? (
                        <>
                          <Shield className="w-3 h-3" />
                          Admin
                        </>
                      ) : ('subscription' in user) && user.subscription === 'premium' ? (
                        <>
                          <Crown className="w-3 h-3" />
                          Premium
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3" />
                          Gratuit
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className="text-muted-foreground text-sm">
                      {('createdAt' in user)
                        ? formatDate(user.createdAt as Date)
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="text-muted-foreground text-sm">
                      {('lastLogin' in user)
                        ? formatDate(user.lastLogin as Date)
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Mail className="w-4 h-4" />
                          Envoyer un email
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          {user.isAdmin ? (
                            <>
                              <ShieldOff className="w-4 h-4" />
                              Retirer admin
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              Promouvoir admin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
