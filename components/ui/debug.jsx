'use client'
import { useEffect, useState } from 'react'
import { useMap } from '@vis.gl/react-maplibre'

export default function Debug() {
  const { map: wrapper } = useMap()
  const [zoom, setZoom] = useState(null)

  // local if http
  const isDebug = process.env.NEXT_PUBLIC_URL.includes("http://")

  useEffect(() => {
    if (!isDebug) return
    if (!wrapper) return

    // set initial zoom
    setZoom(wrapper.getZoom().toFixed(2))

    const handleZoom = () => {
      setZoom(wrapper.getZoom().toFixed(2))
    }

    wrapper.on('zoom', handleZoom)
    return () => {
      wrapper.off('zoom', handleZoom)
    }
  }, [wrapper, isDebug])

  if (!isDebug || zoom === null) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '5px',
        left: '60px',
        fontSize: '12px',
        color: 'white',
        background: 'rgba(0,0,0,0.6)',
        padding: '2px 4px',
        borderRadius: '2px',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      zoom: {zoom}
    </div>
  )
}
