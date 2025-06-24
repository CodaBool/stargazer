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
          'rgba(255,255,255,1)',       // white
          'rgba(255,245,200,0.9)',     // yellow
          'rgba(200,200,255,0.9)',     // blue
          'rgba(255,200,200,0.9)'      // red
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
      }

      isOffscreen() {
        const sx = (this.x / this.z) * w + w / 2
        const sy = (this.y / this.z) * h + h / 2
        return sx < 0 || sx > w || sy < 0 || sy > h
      }

      drawTrail(ctx) {
        if (this.z <= 0.1 || this.isOffscreen()) return // no draw if offscreen

        const { sx, sy } = this.getScreenCoords()
        const px = (this.x / this.pz) * w + w / 2
        const py = (this.y / this.pz) * h + h / 2

        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(sx, sy)
        ctx.strokeStyle = 'white'
        ctx.lineWidth = Math.min(10, 6 / (this.z / 50))
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

    const baseSpeed = 2.0
    let startTime = null

    function animateWarp(timestamp) {
      if (!startTime) startTime = timestamp
      const elapsed = (timestamp - startTime) / 1000
      const warpEnd = delay + travelTime

      if (elapsed < warpEnd) {
        // Warp phase
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
        ctx.fillRect(0, 0, w, h)

        let speed = 0
        if (elapsed >= delay) {
          const progress = (elapsed - delay) / travelTime
          speed = baseSpeed * (1 - Math.exp(-8 * progress))
        }

        for (let i = 0; i < warpStars.length; i++) {
          const star = warpStars[i]
          star.update(speed)
          if (star.isOffscreen()) {
            warpStars[i] = new Star() // reset offscreen stars only after passing through
          } else {
            star.drawTrail(ctx)
          }
        }


        animationFrame = requestAnimationFrame(animateWarp)
      } else {
        // Static stars fade in
        if (!showStatic) {
          ctx.clearRect(0, 0, w, h)
          showStatic = true
        }

        ctx.fillStyle = "black"
        ctx.fillRect(0, 0, w, h)

        fadeAlpha = Math.min(fadeAlpha + 1 / 40, 1) // ~2s fade-in at 60fps
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
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
