import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Starfield } from '@/components/starfield'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TestZen - Mindful Focus Sessions',
  description: 'A calming meditation and focus session tracker with XP and badge rewards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Starfield 
          density={200}
          color="rgba(163, 163, 163, 1)"
          baseSpeed={0.5}
          hoverSpeedMultiplier={3}
          glowIntensity={0.8}
        />
        {children}
      </body>
    </html>
  )
}
