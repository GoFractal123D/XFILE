'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Film,
  Tv,
  MoreVertical,
  Eye,
  Star,
  Filter,
} from 'lucide-react'
import { contents, categories, Content } from '@/lib/data'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function ContentManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'series'>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredContents = contents.filter((content) => {
    const matchesSearch =
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || content.type === selectedType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Gestion du contenu</h1>
          <p className="text-muted-foreground">
            {contents.length} titres au total
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un contenu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau contenu</DialogTitle>
            </DialogHeader>
            <ContentForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un titre..."
            className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'movie', 'series'] as const).map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="gap-2"
            >
              {type === 'all' ? (
                <Filter className="w-4 h-4" />
              ) : type === 'movie' ? (
                <Film className="w-4 h-4" />
              ) : (
                <Tv className="w-4 h-4" />
              )}
              {type === 'all' ? 'Tout' : type === 'movie' ? 'Films' : 'Séries'}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Content Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 font-medium">Titre</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Type</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Genres</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Année</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Statut</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContents.map((content, index) => (
                <motion.tr
                  key={content.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-border hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={content.thumbnail}
                        alt={content.title}
                        className="w-10 h-14 rounded object-cover"
                      />
                      <div>
                        <p className="font-medium">{content.title}</p>
                        <p className="text-sm text-muted-foreground hidden sm:block">
                          {content.rating}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        content.type === 'movie'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-purple-500/10 text-purple-500'
                      }`}
                    >
                      {content.type === 'movie' ? (
                        <Film className="w-3 h-3" />
                      ) : (
                        <Tv className="w-3 h-3" />
                      )}
                      {content.type === 'movie' ? 'Film' : 'Série'}
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {content.genres.slice(0, 2).map((genre) => (
                        <span
                          key={genre}
                          className="px-2 py-0.5 bg-secondary text-xs rounded"
                        >
                          {genre}
                        </span>
                      ))}
                      {content.genres.length > 2 && (
                        <span className="px-2 py-0.5 text-xs text-muted-foreground">
                          +{content.genres.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="text-muted-foreground">{content.year}</span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      {content.isFeatured && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Vedette
                        </span>
                      )}
                      {content.isNew && (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs rounded-full">
                          Nouveau
                        </span>
                      )}
                      {content.isTrending && (
                        <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 text-xs rounded-full">
                          Tendance
                        </span>
                      )}
                    </div>
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
                          <Eye className="w-4 h-4" />
                          Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Edit2 className="w-4 h-4" />
                          Modifier
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

        {/* Empty State */}
        {filteredContents.length === 0 && (
          <div className="p-12 text-center">
            <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun contenu trouvé</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function ContentForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'movie' as 'movie' | 'series',
    year: new Date().getFullYear(),
    rating: '12+',
    genres: [] as string[],
    thumbnail: '',
    backdrop: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would save to a database
    console.log('Saving content:', formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1.5">Titre</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'movie' | 'series' })}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="movie">Film</option>
            <option value="series">Série</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Année</label>
          <input
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Classification</label>
          <select
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="Tous publics">Tous publics</option>
            <option value="12+">12+</option>
            <option value="16+">16+</option>
            <option value="18+">18+</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Genres</label>
          <select
            multiple
            value={formData.genres}
            onChange={(e) =>
              setFormData({
                ...formData,
                genres: Array.from(e.target.selectedOptions, (option) => option.value),
              })
            }
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 h-24"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">URL Miniature</label>
          <input
            type="url"
            value={formData.thumbnail}
            onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
            placeholder="https://..."
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">URL Backdrop</label>
          <input
            type="url"
            value={formData.backdrop}
            onChange={(e) => setFormData({ ...formData, backdrop: e.target.value })}
            placeholder="https://..."
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  )
}
