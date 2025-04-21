'use client'
import { useEffect, useRef } from 'react'

export default function StarsBackground({ children }) {
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
      constructor() { this.reset() }
      reset() {
        this.x = (Math.random() - 0.5) * w
        this.y = (Math.random() - 0.5) * h
        this.z = Math.random() * w
      }
      update() {
        this.z -= .05
        if (this.z < 1) this.reset()
      }
      draw() {
        const sx = (this.x / this.z) * w + w / 2
        const sy = (this.y / this.z) * h + h / 2
        const radius = Math.max(0, 1 - this.z / w) * 2
        ctx.beginPath()
        ctx.arc(sx, sy, radius, 0, Math.PI * 2)
        ctx.fillStyle = "white"
        ctx.fill()
      }
    }

    const stars = Array.from({ length: numStars }, () => new Star())

    function animate() {
      ctx.fillStyle = "black"
      ctx.fillRect(0, 0, w, h)
      for (const star of stars) {
        star.update()
        star.draw()
      }
      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
