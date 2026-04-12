import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Touristical Renting — Commission-free holiday lets',
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
      <body>{children}</body>
    </html>
  )
}
