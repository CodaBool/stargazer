// can write embed rules here for platforms like twitter
export const metadata = {
  title: 'Stargazer',
  description: 'RPG maps with customizable content',
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
