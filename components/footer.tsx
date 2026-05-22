'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

const footerLinks = {
  navigation: [
    { label: 'Accueil', href: '/' },
    { label: 'Films', href: '/films' },
    { label: 'Séries', href: '/series' },
    { label: 'Video', href: '/videos' },
  ],
  legal: [
    { label: 'Conditions d\'utilisation', href: '/terms' },
    { label: 'Politique de confidentialité', href: '/privacy' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Mentions légales', href: '/legal' },
  ],
  support: [
    { label: 'Centre d\'aide', href: '/help' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Accessibilité', href: '/accessibility' },
  ],
}

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
]

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-primary">XFILE</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Vivez le cinéma autrement. Streaming premium avec les meilleurs films et séries.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-secondary/50 hover:bg-primary/20 rounded-lg transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-3">
              {footerLinks.navigation.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Légal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} XFILE. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-muted-foreground">FR</span>
            <span className="text-xs text-muted-foreground">HD</span>
            <span className="text-xs text-muted-foreground">4K UHD</span>
            <span className="text-xs text-muted-foreground">Dolby Atmos</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
