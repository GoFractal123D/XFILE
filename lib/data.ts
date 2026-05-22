export interface Content {
  id: string
  title: string
  originalTitle?: string
  description: string
  type: 'movie' | 'series'
  genres: string[]
  year: number
  rating: string
  duration?: string
  seasons?: number
  episodes?: number
  thumbnail: string
  backdrop: string
  trailerUrl?: string
  videoUrl?: string
  cast: string[]
  director?: string
  isFeatured?: boolean
  isNew?: boolean
  isTrending?: boolean
  matchScore?: number
}

export interface Category {
  id: string
  name: string
  slug: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  isAdmin: boolean
}

export interface WatchlistItem {
  contentId: string
  addedAt: Date
}

export interface HistoryItem {
  contentId: string
  watchedAt: Date
  progress: number
  duration: number
}

export const categories: Category[] = [
  { id: '1', name: 'Action', slug: 'action' },
  { id: '2', name: 'Drama', slug: 'drama' },
  { id: '3', name: 'Science-Fiction', slug: 'sci-fi' },
  { id: '4', name: 'Thriller', slug: 'thriller' },
  { id: '5', name: 'Comédie', slug: 'comedy' },
  { id: '6', name: 'Horreur', slug: 'horror' },
  { id: '7', name: 'Romance', slug: 'romance' },
  { id: '8', name: 'Animation', slug: 'animation' },
  { id: '9', name: 'Documentaire', slug: 'documentary' },
  { id: '10', name: 'Fantastique', slug: 'fantasy' },
]

export const contents: Content[] = [
  {
    id: '1',
    title: 'Horizon Stellaire',
    originalTitle: 'Stellar Horizon',
    description: 'Dans un futur lointain, une équipe d\'explorateurs découvre une anomalie spatiale qui pourrait changer le destin de l\'humanité. Une odyssée visuelle époustouflante aux confins de l\'univers connu.',
    type: 'movie',
    genres: ['Science-Fiction', 'Drama', 'Thriller'],
    year: 2024,
    rating: '16+',
    duration: '2h 38min',
    thumbnail: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&h=1080&fit=crop',
    trailerUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    cast: ['Emma Laurent', 'Marc Chen', 'Sofia Reyes', 'James Morton'],
    director: 'Alexandre Dubois',
    isFeatured: true,
    isTrending: true,
    matchScore: 98,
  },
  {
    id: '2',
    title: 'Les Ombres du Passé',
    originalTitle: 'Shadows of the Past',
    description: 'Un détective tourmenté plonge dans une enquête qui le ramène aux traumatismes de son enfance. Entre illusions et réalité, il devra affronter ses démons les plus profonds.',
    type: 'movie',
    genres: ['Thriller', 'Drama'],
    year: 2024,
    rating: '18+',
    duration: '2h 12min',
    thumbnail: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1920&h=1080&fit=crop',
    cast: ['Vincent Moreau', 'Isabelle Blanc', 'Thomas Wright'],
    director: 'Claire Fontaine',
    isNew: true,
    matchScore: 95,
  },
  {
    id: '3',
    title: 'Éclipse',
    description: 'Une série qui explore les secrets d\'une ville côtière où rien n\'est ce qu\'il paraît. Chaque épisode révèle une nouvelle couche de mystère.',
    type: 'series',
    genres: ['Drama', 'Thriller', 'Fantastique'],
    year: 2024,
    rating: '16+',
    seasons: 2,
    episodes: 16,
    thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080&fit=crop',
    cast: ['Marie Dubois', 'Pierre Martin', 'Anne-Sophie Laurent'],
    isTrending: true,
    matchScore: 92,
  },
  {
    id: '4',
    title: 'Néon City',
    originalTitle: 'Neon City',
    description: 'Dans une mégapole futuriste, une hackeuse d\'élite découvre un complot qui menace de détruire le fragile équilibre entre humains et intelligence artificielle.',
    type: 'movie',
    genres: ['Science-Fiction', 'Action', 'Thriller'],
    year: 2023,
    rating: '16+',
    duration: '2h 05min',
    thumbnail: 'https://images.unsplash.com/photo-1515705576963-95cad62945b6?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1515705576963-95cad62945b6?w=1920&h=1080&fit=crop',
    cast: ['Liu Wei', 'Sarah Connor', 'Raj Patel'],
    director: 'Yuki Tanaka',
    matchScore: 89,
  },
  {
    id: '5',
    title: 'La Dernière Danse',
    description: 'Un danseur de ballet atteint le sommet de sa carrière mais un accident tragique va bouleverser sa vie. Une histoire de résilience et de rédemption.',
    type: 'movie',
    genres: ['Drama', 'Romance'],
    year: 2024,
    rating: '12+',
    duration: '1h 58min',
    thumbnail: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=1920&h=1080&fit=crop',
    cast: ['Lucas Bernard', 'Elena Vasquez', 'Jean-Pierre Beaumont'],
    director: 'Sophie Martin',
    isNew: true,
    matchScore: 94,
  },
  {
    id: '6',
    title: 'Territoire Sauvage',
    description: 'Une série documentaire immersive explorant les écosystèmes les plus reculés de la planète, capturant la beauté brute de la nature.',
    type: 'series',
    genres: ['Documentaire'],
    year: 2024,
    rating: 'Tous publics',
    seasons: 1,
    episodes: 8,
    thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop',
    cast: ['Narration: David Attenborough'],
    matchScore: 97,
  },
  {
    id: '7',
    title: 'Chroniques de l\'Au-delà',
    description: 'Une anthologie surnaturelle où chaque épisode raconte une histoire différente à la frontière entre le monde des vivants et des morts.',
    type: 'series',
    genres: ['Horreur', 'Fantastique', 'Thriller'],
    year: 2023,
    rating: '18+',
    seasons: 3,
    episodes: 24,
    thumbnail: 'https://images.unsplash.com/photo-1509248961725-aec71f0bb1c2?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1509248961725-aec71f0bb1c2?w=1920&h=1080&fit=crop',
    cast: ['Ensemble cast variable'],
    isTrending: true,
    matchScore: 88,
  },
  {
    id: '8',
    title: 'Le Dernier Samuraï',
    originalTitle: 'The Last Samurai',
    description: 'Japon, 1877. Un guerrier légendaire lutte pour préserver les traditions ancestrales face à la modernisation forcée de l\'empire.',
    type: 'movie',
    genres: ['Action', 'Drama', 'Historique'],
    year: 2024,
    rating: '16+',
    duration: '2h 45min',
    thumbnail: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&h=1080&fit=crop',
    cast: ['Ken Watanabe', 'Hiroyuki Sanada', 'Rinko Kikuchi'],
    director: 'Takeshi Kitano',
    isFeatured: true,
    matchScore: 96,
  },
  {
    id: '9',
    title: 'Amour à Paris',
    description: 'Une comédie romantique moderne où deux étrangers se rencontrent par hasard dans la Ville Lumière et découvrent que le destin a ses propres plans.',
    type: 'movie',
    genres: ['Romance', 'Comédie'],
    year: 2024,
    rating: '12+',
    duration: '1h 52min',
    thumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&h=1080&fit=crop',
    cast: ['Léa Seydoux', 'Adam Driver', 'Marion Cotillard'],
    director: 'Céline Sciamma',
    isNew: true,
    matchScore: 91,
  },
  {
    id: '10',
    title: 'Cyber Protocol',
    description: 'Dans un monde où la conscience humaine peut être téléchargée, une équipe d\'agents spéciaux traque les criminels qui exploitent cette technologie.',
    type: 'series',
    genres: ['Science-Fiction', 'Action', 'Thriller'],
    year: 2024,
    rating: '16+',
    seasons: 2,
    episodes: 20,
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&h=1080&fit=crop',
    cast: ['Zendaya', 'Oscar Isaac', 'Tilda Swinton'],
    isFeatured: true,
    isTrending: true,
    matchScore: 93,
  },
  {
    id: '11',
    title: 'Les Enfants du Silence',
    description: 'Un film poignant sur une famille sourde qui doit protéger ses enfants dans un monde où le son est devenu une arme mortelle.',
    type: 'movie',
    genres: ['Thriller', 'Drama', 'Horreur'],
    year: 2023,
    rating: '16+',
    duration: '1h 48min',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1920&h=1080&fit=crop',
    cast: ['Emily Blunt', 'Cillian Murphy', 'Millicent Simmonds'],
    director: 'John Krasinski',
    matchScore: 90,
  },
  {
    id: '12',
    title: 'Révolution Culinaire',
    description: 'Suivez les parcours extraordinaires de chefs émergents qui révolutionnent la gastronomie mondiale avec des approches innovantes et durables.',
    type: 'series',
    genres: ['Documentaire'],
    year: 2024,
    rating: 'Tous publics',
    seasons: 1,
    episodes: 6,
    thumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=600&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1920&h=1080&fit=crop',
    cast: ['Divers chefs internationaux'],
    isNew: true,
    matchScore: 87,
  },
]

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alexandre',
    email: 'alex@example.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    isAdmin: true,
  },
  {
    id: '2',
    name: 'Marie',
    email: 'marie@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    isAdmin: false,
  },
  {
    id: '3',
    name: 'Lucas',
    email: 'lucas@example.com',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop',
    isAdmin: false,
  },
]

export const getContentById = (id: string): Content | undefined => {
  return contents.find(c => c.id === id)
}

export const getContentsByType = (type: 'movie' | 'series'): Content[] => {
  return contents.filter(c => c.type === type)
}

export const getContentsByGenre = (genre: string): Content[] => {
  return contents.filter(c => c.genres.some(g => g.toLowerCase() === genre.toLowerCase()))
}

export const getFeaturedContent = (): Content[] => {
  return contents.filter(c => c.isFeatured)
}

export const getTrendingContent = (): Content[] => {
  return contents.filter(c => c.isTrending)
}

export const getNewContent = (): Content[] => {
  return contents.filter(c => c.isNew)
}

export const searchContent = (query: string): Content[] => {
  const lowerQuery = query.toLowerCase()
  return contents.filter(c => 
    c.title.toLowerCase().includes(lowerQuery) ||
    c.description.toLowerCase().includes(lowerQuery) ||
    c.genres.some(g => g.toLowerCase().includes(lowerQuery)) ||
    c.cast.some(a => a.toLowerCase().includes(lowerQuery))
  )
}
