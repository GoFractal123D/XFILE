'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp,
  Users,
  Eye,
  Clock,
  Play,
  Film,
  Tv,
  Calendar,
} from 'lucide-react'
import { contents } from '@/lib/data'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// Mock analytics data
const viewsData = [
  { name: 'Lun', views: 12000 },
  { name: 'Mar', views: 15000 },
  { name: 'Mer', views: 18000 },
  { name: 'Jeu', views: 14000 },
  { name: 'Ven', views: 22000 },
  { name: 'Sam', views: 28000 },
  { name: 'Dim', views: 25000 },
]

const genreData = [
  { name: 'Science-Fiction', value: 35 },
  { name: 'Drama', value: 25 },
  { name: 'Thriller', value: 20 },
  { name: 'Action', value: 12 },
  { name: 'Autres', value: 8 },
]

const deviceData = [
  { name: 'Mobile', value: 45 },
  { name: 'Desktop', value: 35 },
  { name: 'TV', value: 15 },
  { name: 'Tablet', value: 5 },
]

const monthlyGrowth = [
  { month: 'Jan', users: 8500, revenue: 42000 },
  { month: 'Fév', users: 9200, revenue: 48000 },
  { month: 'Mar', users: 10100, revenue: 52000 },
  { month: 'Avr', users: 10800, revenue: 58000 },
  { month: 'Mai', users: 11500, revenue: 65000 },
  { month: 'Juin', users: 12847, revenue: 72000 },
]

const COLORS = ['hsl(var(--primary))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble des performances de la plateforme
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Vues totales</span>
          </div>
          <p className="text-2xl font-bold">847,234</p>
          <p className="text-xs text-green-500">+12% vs mois dernier</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">Temps moyen</span>
          </div>
          <p className="text-2xl font-bold">2h 34min</p>
          <p className="text-xs text-green-500">+8% vs mois dernier</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Lectures</span>
          </div>
          <p className="text-2xl font-bold">156,789</p>
          <p className="text-xs text-green-500">+15% vs mois dernier</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">Actifs</span>
          </div>
          <p className="text-2xl font-bold">3,421</p>
          <p className="text-xs text-muted-foreground">En ce moment</p>
        </div>
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Views Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Vues cette semaine</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Croissance mensuelle</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Genre Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Genres populaires</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {genreData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Device Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Appareils utilisés</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {deviceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Content Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Type de contenu</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Films</span>
                </div>
                <span className="text-sm font-medium">
                  {contents.filter((c) => c.type === 'movie').length}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${(contents.filter((c) => c.type === 'movie').length / contents.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Séries</span>
                </div>
                <span className="text-sm font-medium">
                  {contents.filter((c) => c.type === 'series').length}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{
                    width: `${(contents.filter((c) => c.type === 'series').length / contents.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total catalogue</span>
              <span className="text-lg font-bold">{contents.length}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Content Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Top 5 - Cette semaine</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 font-medium">#</th>
                <th className="text-left py-3 font-medium">Titre</th>
                <th className="text-left py-3 font-medium hidden sm:table-cell">Type</th>
                <th className="text-right py-3 font-medium">Vues</th>
                <th className="text-right py-3 font-medium hidden md:table-cell">Temps moyen</th>
              </tr>
            </thead>
            <tbody>
              {contents.slice(0, 5).map((content, index) => (
                <tr key={content.id} className="border-b border-border last:border-0">
                  <td className="py-3 font-bold text-muted-foreground">{index + 1}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={content.thumbnail}
                        alt={content.title}
                        className="w-10 h-14 rounded object-cover"
                      />
                      <span className="font-medium">{content.title}</span>
                    </div>
                  </td>
                  <td className="py-3 hidden sm:table-cell">
                    <span className="text-muted-foreground">
                      {content.type === 'movie' ? 'Film' : 'Série'}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium">
                    {Math.floor(Math.random() * 50000 + 10000).toLocaleString()}
                  </td>
                  <td className="py-3 text-right text-muted-foreground hidden md:table-cell">
                    {Math.floor(Math.random() * 60 + 30)}min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
