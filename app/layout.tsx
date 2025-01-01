import Footer from '@/components/footer'
import Header from '@/components/header'
import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CookieProvider } from '../context/CookieCtx'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DogTownUSA',
  description: 'Welcome to DogTownUSA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <meta
        name="format-detection"
        content="telephone=no, date=no, email=no, address=no"
      />
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <CookieProvider>
          <Header />
          <main className="flex-1 container mx-auto max-w-7xl">
            {children}
          </main>
          <Toaster />
          <Footer />
        </CookieProvider>
      </body>
    </html>
  )
}

