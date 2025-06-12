'use client'
import React, { useState, useEffect, Suspense } from 'react'
import StarsBackground from './starbackground'
import dynamic from 'next/dynamic'

// Dynamically import ThreejsPlanet without SSR, since it's WebGL
const LazyThreejsPlanet = dynamic(() => import('../threejsPlanet'), {
  ssr: false,
  loading: () => <div className="w-full h-full animate-pulse bg-black/30 rounded-lg" />,
})

const PLANET_TYPES = [
  'moon',
  'ice',
  'jovian',
  'asteroid',
  'star',
  'lava',
  'desert',
  'terrestrial',
]

const randomIndex = Math.floor(Math.random() * PLANET_TYPES.length)
const type = PLANET_TYPES[randomIndex]

export default function PlanetBackground() {
  const [planetSize, setPlanetSize] = useState(300)

  useEffect(() => {
    const computeSize = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const size = Math.floor(Math.min(vw, vh) * 0.9)
      setPlanetSize(size)
    }

    computeSize()
    window.addEventListener('resize', computeSize)
    return () => window.removeEventListener('resize', computeSize)
  }, [])

  return (
    <StarsBackground>
      <div className="flex items-center justify-center w-full h-screen">
        <div style={{ width: planetSize, height: planetSize }}>
          <Suspense fallback={<div className="w-full h-full animate-pulse bg-black/20 rounded" />}>
            <LazyThreejsPlanet
              type={type}
              pixels={700}
              disableListeners={true}
              width={planetSize}
              height={planetSize}
            />
          </Suspense>
        </div>
      </div>
    </StarsBackground>
  )
}
