import type { Metadata } from 'next'
import './globals.css'
import { SkipLink } from '@/components/SkipLink'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Eats — Commission-free food delivery',
  description:
    'Order food from local restaurants with zero commission. A flat infrastructure fee is the only cost — transparent and published. Public infrastructure for the food delivery economy.',
}

export default async function RootLayout({
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
