'use client'
import React, { useState, useEffect, Suspense } from 'react'
import StarsBackground from './starbackground'
import dynamic from 'next/dynamic'
import { debounce, isMobile } from '@/lib/utils'

const ismobile = isMobile()
const LazyThreejsPlanet = dynamic(() => import('../threejsPlanet'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
})

const PLANET_TYPES = [
  'moon',
  'jovian',
  'asteroid',
  'star',
  'lava_planet',
  'desert_planet',
  'ringed_planet',
]
const STAR_SCHEMES = ["blue", "orange", "red", "white", "yellow"];

// BUG: ice has bugged box around it on mobile, just remove from pool
if (!ismobile) {
  PLANET_TYPES.push('ice_planet')
}

const randomIndex = Math.floor(Math.random() * PLANET_TYPES.length)
const type = PLANET_TYPES[randomIndex]
let scheme
if (type === "star") {
  scheme = STAR_SCHEMES[Math.floor(Math.random() * STAR_SCHEMES.length)]
}

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
    <StarsBackground delay={0} travelTime={1.2} numStars={ismobile ? 40 : 300}>
      <div className="fixed inset-0 flex items-center justify-center">
        <div style={{ width: planetSize, height: planetSize }}>
          {beginWarp &&
            <Suspense fallback={<div className="w-full h-full" />}>
              <LazyThreejsPlanet
                type={type}
                schemeColor={scheme}
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
