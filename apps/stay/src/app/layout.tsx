import type { Metadata } from 'next'
import './globals.css'
import { SkipLink } from '@/components/SkipLink'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Stay — Commission-free holiday lets',
  description:
    'Find and offer tourist rentals — flats, houses, and rooms — with zero commission. Public infrastructure for the accommodation economy.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SkipLink href="#main-content" />
        <SiteHeader />
        <main id="main-content">{children}</main>
      </body>
    </html>
  )
}
