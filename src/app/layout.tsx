import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/globals.css'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/components/providers/query-provider'

// Load Inter font
const inter = Inter({ subsets: ['latin'] })

// Metadata for SEO
export const metadata: Metadata = {
  title: 'LucidNote - AI-Powered Notes & Creativity Platform',
  description: 'Declutter your mind. Organize your thoughts with AI summaries, smart notes, and creative tools.',
  keywords: ['note taking', 'AI notes', 'productivity', 'Gemini', 'summarization'],
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