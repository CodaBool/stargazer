'use client'

import { SessionProvider } from 'next-auth/react'
import { MapProvider } from 'react-map-gl/maplibre'
import { Toaster } from "@/components/ui/sonner"

export default function Provider({ children }) {
  return (
    <SessionProvider>
      <Toaster />
      <MapProvider>
        {children}
      </MapProvider>
    </SessionProvider>
  )
}
