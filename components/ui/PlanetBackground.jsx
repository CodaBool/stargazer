'use client'
import React, { useState, useEffect, Suspense } from 'react'
import StarsBackground from './starbackground'
import dynamic from 'next/dynamic'
import { debounce } from '@/lib/utils'

const LazyThreejsPlanet = dynamic(() => import('../threejsPlanet'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
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
  'ring',
]

const randomIndex = Math.floor(Math.random() * PLANET_TYPES.length)
const type = PLANET_TYPES[randomIndex]

export default function PlanetBackground() {
  const [planetSize, setPlanetSize] = useState()
  const [beginWarp, setBeginWarp] = useState()

  useEffect(() => {
    const computeSize = debounce(() => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const size = Math.floor(Math.min(vw, vh) * 0.9)
      setPlanetSize(size)
    }, 200)

    setTimeout(() => {
      setBeginWarp(true)
    }, 600)

    computeSize()
    window.addEventListener('resize', computeSize)
    return () => window.removeEventListener('resize', computeSize)
  }, [])

  if (!planetSize) return null

  return (
    <StarsBackground delay={0} travelTime={1.2}>
      <div className="fixed inset-0 flex items-center justify-center">
        <div style={{ width: planetSize, height: planetSize }}>
          {beginWarp &&
            <Suspense fallback={<div className="w-full h-full" />}>
              <LazyThreejsPlanet
                type={type}
                pixels={700}
                disableListeners={true}
                width={planetSize}
                height={planetSize}
                warpDuration={1500}
                warpDistance={1}
              />
            </Suspense>
          }
        </div>
      </div>
    </StarsBackground>
  )
}
