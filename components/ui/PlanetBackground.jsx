'use client'
import React, { useState, useEffect, Suspense } from 'react'
import StarsBackground from './starbackground'
import dynamic from 'next/dynamic'
import { debounce } from '@/lib/utils'

const LazyThreejsPlanet = dynamic(() => import('../threejsPlanet'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black rounded" />,
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
  const [planetSize, setPlanetSize] = useState()

  useEffect(() => {
    const computeSize = debounce(() => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const size = Math.floor(Math.min(vw, vh) * 0.9)
      setPlanetSize(size)
    }, 200)

    computeSize()
    window.addEventListener('resize', computeSize)
    return () => window.removeEventListener('resize', computeSize)
  }, [])

  if (!planetSize) return null

  return (
    <StarsBackground>
      <div className="fixed inset-0 flex items-center justify-center">
        <div style={{ width: planetSize, height: planetSize }}>
          <Suspense fallback={<div className="w-full h-full bg-black rounded" />}>
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
