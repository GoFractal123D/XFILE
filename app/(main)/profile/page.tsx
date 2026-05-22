'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Mail, Camera, LogOut, Shield, Bell, Globe, Moon } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useApp()
  const [notifications, setNotifications] = useState(true)
  const [autoplay, setAutoplay] = useState(true)

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen pt-24 md:pt-28 pb-12 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <User className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Connectez-vous pour accéder à votre profil</h1>
          <p className="text-muted-foreground mb-6">
            Gérez vos préférences et paramètres de compte.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-primary text-primary-foreground">
              Se connecter
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-12">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Mon Profil</h1>
          <p className="text-muted-foreground">Gérez vos informations et préférences</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
              />
              <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              {user.isAdmin && (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                  <Shield className="w-3 h-3" />
                  Administrateur
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Préférences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des alertes pour les nouveautés
                    </p>
                  </div>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Lecture automatique</p>
                    <p className="text-sm text-muted-foreground">
                      Lancer automatiquement l&apos;épisode suivant
                    </p>
                  </div>
                </div>
                <Switch checked={autoplay} onCheckedChange={setAutoplay} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Langue</p>
                    <p className="text-sm text-muted-foreground">
                      Langue de l&apos;interface
                    </p>
                  </div>
                </div>
                <select className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Account Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Compte</h3>
            <div className="space-y-3">
              {user.isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Shield className="w-4 h-4" />
                    Accéder au panneau d&apos;administration
                  </Button>
                </Link>
              )}
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full justify-start gap-2"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </Button>
            </div>
          </motion.div>

          {/* Subscription Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1">Abonnement Premium</h3>
                <p className="text-sm text-muted-foreground">
                  Accès illimité à tout le catalogue en 4K UHD
                </p>
              </div>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Gérer
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
