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

    class Star {
      x
      y
      z
      pz
      constructor() { this.reset() }
      reset() {
        this.x = (Math.random() - 0.5) * w
        this.y = (Math.random() - 0.5) * h
        this.z = Math.random() * w
        this.pz = this.z
      }
      update(speed) {
        this.pz = this.z
        this.z -= speed
        if (this.z < 1) this.reset()
      }
      draw() {
        const sx = (this.x / this.z) * w + w / 2
        const sy = (this.y / this.z) * h + h / 2
        const px = (this.x / this.pz) * w + w / 2
        const py = (this.y / this.pz) * h + h / 2

        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(sx, sy)
        ctx.strokeStyle = "white"
        ctx.lineWidth = Math.min(10, 6 / (this.z / 50)) // Thicker streaks
        ctx.stroke()
      }
    }

    const stars = Array.from({ length: numStars }, () => new Star())

    const baseSpeed = 2.0 // MUCH faster base speed
    let startTime = null
    let animationStopped = false

    function animateWarp(timestamp) {
      if (!startTime) startTime = timestamp
      const elapsed = (timestamp - startTime) / 1000

      ctx.fillStyle = "rgba(0, 0, 0, 0.05)" // lower alpha = longer trails
      ctx.fillRect(0, 0, w, h)

      let speed
      if (elapsed < delay) {
        speed = 0
      } else if (elapsed < delay + travelTime) {
        const progress = (elapsed - delay) / travelTime
        speed = baseSpeed * (1 - Math.exp(-8 * progress)) // ramp up
      } else {
        if (!animationStopped) {
          for (const star of stars) star.draw()
          animationStopped = true
          return
        }
        return
      }

      for (const star of stars) {
        star.update(speed)
        star.draw()
      }

      animationFrame = requestAnimationFrame(animateWarp)
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
