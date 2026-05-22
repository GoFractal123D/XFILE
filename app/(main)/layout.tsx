import { AppProvider } from '@/lib/context'
import { PlaylistProvider } from '@/lib/playlist-context'
import { Header } from '@/components/header'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppProvider>
      <PlaylistProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </PlaylistProvider>
    </AppProvider>
  )
}
