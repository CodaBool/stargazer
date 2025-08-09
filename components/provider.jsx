'use client'

import { SessionProvider } from 'next-auth/react'
import { MapProvider } from '@vis.gl/react-maplibre'
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
