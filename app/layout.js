const description = 'RPG maps with customizable content'
const title = 'Stargazer'
export const metadata = {
  title,
  description,
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL),
  openGraph: {
    title,
    description,
    url: process.env.NEXT_PUBLIC_URL,
    siteName: title,
    images: [
      {
        url: '/embed.webp', // 1200x630 recommended
        width: 1164,
        height: 1094,
        alt: description,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    creator: process.env.NEXT_PUBLIC_USER,
    images: ['/embed.webp'],
  },
  icons: {
    icon: '/icon.jpg',
    shortcut: '/icon.jpg',
    apple: '/icon.jpg',
  },
  themeColor: '#0d0d0d',
}

// allows for mobile devices to properly style
export const viewport = {
  userScalable: false,
}

import './global.css'
import "maplibre-gl/dist/maplibre-gl.css"
import '@hyvilo/maplibre-gl-draw/dist/maplibre-gl-draw.css'
import { Press_Start_2P } from 'next/font/google'
import Provider from '@/components/provider'

const _ = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  )
}
