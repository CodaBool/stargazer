'use client'

import { SessionProvider } from 'next-auth/react'
import { MapProvider } from 'react-map-gl/maplibre'
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from './ui/tooltip'

export default function Provider({ children }) {
  return (
    <SessionProvider>
      <Toaster />
      <TooltipProvider>
        <MapProvider>
          {children}
        </MapProvider>
      </TooltipProvider>
    </SessionProvider>
  )
}
