'use client'

import { motion } from 'framer-motion'
import {
  Users,
  Film,
  Play,
  Eye,
  TrendingUp,
  Clock,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { contents, mockUsers } from '@/lib/data'
import Link from 'next/link'

const stats = [
  {
    label: 'Utilisateurs actifs',
    value: '12,847',
    change: '+12%',
    trend: 'up',
    icon: Users,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    label: 'Titres disponibles',
    value: contents.length.toString(),
    change: '+3',
    trend: 'up',
    icon: Film,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    label: 'Lectures en cours',
    value: '3,421',
    change: '+8%',
    trend: 'up',
    icon: Play,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    label: 'Vues totales',
    value: '847K',
    change: '-2%',
    trend: 'down',
    icon: Eye,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
]

const recentActivity = [
  { type: 'user', message: 'Nouvel utilisateur inscrit: Marie D.', time: 'Il y a 5 min' },
  { type: 'content', message: '"Horizon Stellaire" ajouté au catalogue', time: 'Il y a 1h' },
  { type: 'view', message: '1000 vues sur "Éclipse" aujourd\'hui', time: 'Il y a 2h' },
  { type: 'user', message: 'Nouvel abonnement premium: Lucas M.', time: 'Il y a 3h' },
  { type: 'content', message: 'Mise à jour de "Néon City"', time: 'Il y a 5h' },
]

const topContent = contents.slice(0, 5).map((c, i) => ({
  ...c,
  views: Math.floor(Math.random() * 50000 + 10000),
  rank: i + 1,
}))

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Aperçu de votre plateforme de streaming
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div
                className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {stat.change}
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Contenus populaires</h2>
            <Link
              href="/admin/analytics"
              className="text-sm text-primary hover:underline"
            >
              Voir tout
            </Link>
          </div>
          <div className="space-y-4">
            {topContent.map((content) => (
              <div
                key={content.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <span className="text-2xl font-bold text-muted-foreground w-8">
                  {content.rank}
                </span>
                <img
                  src={content.thumbnail}
                  alt={content.title}
                  className="w-12 h-16 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{content.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {content.type === 'movie' ? 'Film' : 'Série'} • {content.year}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{content.views.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">vues</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold mb-6">Activité récente</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    activity.type === 'user'
                      ? 'bg-blue-500/10'
                      : activity.type === 'content'
                      ? 'bg-primary/10'
                      : 'bg-green-500/10'
                  }`}
                >
                  {activity.type === 'user' ? (
                    <Users className="w-4 h-4 text-blue-500" />
                  ) : activity.type === 'content' ? (
                    <Film className="w-4 h-4 text-primary" />
                  ) : (
                    <Eye className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold">Tendances du jour</h3>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Science-Fiction</span>
              <span className="font-medium">+24%</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Thriller</span>
              <span className="font-medium">+18%</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Drama</span>
              <span className="font-medium">+12%</span>
            </li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="font-semibold">Temps de visionnage</h3>
          </div>
          <p className="text-3xl font-bold mb-1">2h 34min</p>
          <p className="text-sm text-muted-foreground">Moyenne par utilisateur/jour</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="font-semibold">Taux de rétention</h3>
          </div>
          <p className="text-3xl font-bold mb-1">87%</p>
          <p className="text-sm text-muted-foreground">Des utilisateurs reviennent</p>
        </div>
      </motion.div>
    </div>
  )
}
