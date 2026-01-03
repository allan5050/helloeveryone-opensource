import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './contexts/AuthContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Hello Everyone - Connect Through Shared Interests',
    template: '%s | Hello Everyone',
  },
  description:
    'Discover meaningful connections through shared interests and local events. Join communities, attend meetups, and build lasting friendships.',
  keywords: [
    'social networking',
    'events',
    'meetups',
    'communities',
    'interests',
    'friends',
  ],
  authors: [{ name: 'Hello Everyone Team' }],
  creator: 'Hello Everyone',
  publisher: 'Hello Everyone',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Hello Everyone',
    title: 'Hello Everyone - Connect Through Shared Interests',
    description:
      'Discover meaningful connections through shared interests and local events.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hello Everyone - Connect Through Shared Interests',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@helloeveryone',
    creator: '@helloeveryone',
    title: 'Hello Everyone - Connect Through Shared Interests',
    description:
      'Discover meaningful connections through shared interests and local events.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hello Everyone',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#6366f1' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* PWA specific meta tags */}
        <meta name="application-name" content="HelloEveryone" />
        <meta name="apple-mobile-web-app-title" content="HelloEveryone" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple-specific meta tags */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* Favicon and icons */}
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body
        className={`min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <AuthProvider>
          <div id="root">{children}</div>
        </AuthProvider>
      </body>
    </html>
  )
}
