'use client'
import { useEffect, useRef, useState } from 'react'

export default function StarsBackground({ children, delay = 1, travelTime = 0.5 }) {
  const canvasRef = useRef()
  const [zIndex, setZIndex] = useState(100)
  const [showStatic, setShowStatic] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let w = canvas.width = canvas.offsetWidth
    let h = canvas.height = canvas.offsetHeight
    const numStars = 300
    let animationFrame
    let fadeAlpha = 0

    class Star {
      constructor(isStatic = false) {
        this.isStatic = isStatic
        this.reset()
        if (isStatic) {
          this.radius = 0.4 + Math.random() * 0.4
          this.color = this.pickColor()
        }
      }

      reset() {
        this.x = (Math.random() - 0.5) * w
        this.y = (Math.random() - 0.5) * h
        this.z = Math.random() * w
        this.pz = this.z
      }

      pickColor() {
        const palette = [
          'rgba(255,255,255,1)',
          'rgba(255,245,200,0.9)',
          'rgba(200,200,255,0.9)',
          'rgba(255,200,200,0.9)',
        ]
        return palette[Math.floor(Math.random() * palette.length)]
      }

      getScreenCoords() {
        const sx = (this.x / this.z) * w + w / 2
        const sy = (this.y / this.z) * h + h / 2
        return { sx, sy }
      }

      update(speed) {
        this.pz = this.z
        this.z -= speed
        if (this.z < 1) this.reset()
      }

      drawTrail(ctx, alpha = 1) {
        if (this.z <= 0.1) return

        const { sx, sy } = this.getScreenCoords()
        const px = (this.x / this.pz) * w + w / 2
        const py = (this.y / this.pz) * h + h / 2

        const dx = sx - px
        const dy = sy - py
        const len = Math.sqrt(dx * dx + dy * dy)

        const stretch = Math.min(120, 600 / (this.z * 2000)) // more aggressive stretch



        const tx = sx + (dx / len) * stretch
        const ty = sy + (dy / len) * stretch

        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(tx, ty)
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`

        ctx.lineWidth = Math.min(8, 200 / this.z)
        // ctx.lineWidth = Math.min(60, 800 / this.z)

        ctx.stroke()
      }

      drawDot(ctx, alpha = 1) {
        const { sx, sy } = this.getScreenCoords()
        ctx.beginPath()
        ctx.arc(sx, sy, this.radius, 0, Math.PI * 2)
        const [r, g, b] = this.color.match(/\d+/g)
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.fill()
      }
    }

    const warpStars = Array.from({ length: numStars }, () => new Star())
    const staticStars = Array.from({ length: numStars }, () => new Star(true))

    const baseSpeed = 8.0
    let startTime = null
    let fadeStart = null
    const fadeDuration = 4 // seconds

    function animateWarp(timestamp) {
      if (!startTime) startTime = timestamp
      const elapsed = (timestamp - startTime) / 1000
      const warpEnd = delay + travelTime

      ctx.clearRect(0, 0, w, h)

      if (elapsed < warpEnd) {
        let speed = 0
        let alpha = 1

        if (elapsed >= delay) {
          const progress = (elapsed - delay) / travelTime
          speed = baseSpeed * (1 - Math.exp(-8 * progress))

          const timeRemaining = warpEnd - elapsed
          if (timeRemaining < 0.1) {
            alpha = Math.max(0, timeRemaining / 0.1)
          }
        }

        for (const star of warpStars) {
          star.update(speed)
          star.drawTrail(ctx, alpha)
        }

        animationFrame = requestAnimationFrame(animateWarp)
      } else {
        if (!fadeStart) {
          fadeStart = timestamp
          setZIndex(1)
          setShowStatic(true)
        }

        const fadeElapsed = (timestamp - fadeStart) / 1000
        fadeAlpha = Math.min(fadeElapsed / fadeDuration, 1)

        for (const star of staticStars) {
          star.drawDot(ctx, fadeAlpha)
        }

        if (fadeAlpha < 1) {
          animationFrame = requestAnimationFrame(animateWarp)
        }
      }
    }

    animationFrame = requestAnimationFrame(animateWarp)

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
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ backgroundColor: 'transparent', zIndex, position: 'absolute' }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
