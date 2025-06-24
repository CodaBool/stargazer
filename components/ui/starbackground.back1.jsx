'use client'
import { useEffect, useRef } from 'react'

export default function StarsBackground({ children, delay = 1, travelTime = 0.5 }) {
  const canvasRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = canvas.width = canvas.offsetWidth
    let h = canvas.height = canvas.offsetHeight
    const numStars = 300
    let animationFrame
    let showStatic = false

    class Star {
      constructor() {
        this.reset()
        this.radius = 0.4 + Math.random() * 0.4

        this.color = this.pickColor()
      }
      reset() {
        this.x = (Math.random() - 0.5) * w
        this.y = (Math.random() - 0.5) * h
        this.z = Math.random() * w
        this.pz = this.z
      }
      pickColor() {
        const palette = [
          'rgba(255,255,255,1)', // white
          'rgba(255,245,200,0.8)', // yellow
          'rgba(200,200,255,0.8)', // blue
          'rgba(255,200,200,0.8)'  // red
        ]
        return palette[Math.floor(Math.random() * palette.length)]
      }
      update(speed) {
        this.pz = this.z
        this.z -= speed
        if (this.z < 1) this.reset()
      }
      draw(ctx, mode = 'warp') {
        const sx = (this.x / this.z) * w + w / 2
        const sy = (this.y / this.z) * h + h / 2

        if (mode === 'warp') {
          const px = (this.x / this.pz) * w + w / 2
          const py = (this.y / this.pz) * h + h / 2

          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(sx, sy)
          ctx.strokeStyle = this.color
          ctx.lineWidth = Math.min(10, 6 / (this.z / 50))
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.arc(sx, sy, this.radius, 0, Math.PI * 2)
          ctx.fillStyle = this.color
          ctx.fill()
        }
      }
    }

    const stars = Array.from({ length: numStars }, () => new Star())

    const baseSpeed = 2.0
    let startTime = null

    function animate(timestamp) {
      if (!startTime) startTime = timestamp
      const elapsed = (timestamp - startTime) / 1000
      const totalDuration = delay + travelTime

      // Exponential speed decay after delay
      let speed = 0
      if (elapsed >= delay && elapsed < totalDuration) {
        const t = (elapsed - delay) / travelTime
        speed = baseSpeed * Math.exp(-4 * t)
      } else if (elapsed >= totalDuration) {
        speed = 0
      }

      const isWarping = elapsed < totalDuration

      // Trail alpha fades in sync with speed
      const trailAlpha = isWarping ? Math.max(0.02, speed / baseSpeed * 0.2) : 1
      ctx.fillStyle = isWarping
        ? `rgba(0,0,0,${trailAlpha})`
        : 'rgb(0,0,0)'
      ctx.fillRect(0, 0, w, h)

      for (const star of stars) {
        if (isWarping) {
          star.update(speed)
          star.draw(ctx, 'warp')
        } else {
          if (!showStatic) {
            ctx.fillStyle = 'black'
            ctx.fillRect(0, 0, w, h)
            showStatic = true
          }
          star.draw(ctx, 'static')
        }
      }

      if (isWarping) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    const handleResize = () => {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", handleResize)
    }
  }, [delay, travelTime])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
