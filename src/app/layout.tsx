import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/globals.css'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/components/providers/query-provider'

// Load Inter font
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'LucidNote - Smart Note Taking App',
    template: '%s | LucidNote'
  },
  description: 'A modern note-taking application with AI-powered features for better organization and productivity.',
  keywords: ['notes', 'note-taking', 'productivity', 'AI', 'organization'],
  authors: [{ name: 'LucidNote Team' }],
  creator: 'LucidNote',
  publisher: 'LucidNote',
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
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lucid-notes.vercel.app',
    siteName: 'LucidNote',
    title: 'LucidNote - Smart Note Taking App',
    description: 'A modern note-taking application with AI-powered features for better organization and productivity.',
    images: [{
      url: 'https://lucid-notes.vercel.app/og-image.png',
      width: 1200,
      height: 630,
      alt: 'LucidNote'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LucidNote - Smart Note Taking App',
    description: 'A modern note-taking application with AI-powered features for better organization and productivity.',
    images: ['https://lucid-notes.vercel.app/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: 'your-google-site-verification',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <SonnerToaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}