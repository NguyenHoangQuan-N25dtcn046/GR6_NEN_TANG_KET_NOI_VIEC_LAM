import { useEffect, useRef } from 'react'

export default function CanvasBackground({ density = 0.00008, maxLinks = 100 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf
    let particles = []
    const mouse = { x: -9999, y: -9999 }

    const resize = () => {
      const parent = canvas.parentElement
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
      const count = Math.min(120, Math.max(30, Math.floor(canvas.width * canvas.height * density)))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.8 + 0.6,
      }))
    }

    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(99, 102, 241, 0.55)'
        ctx.fill()
      }

      let linked = 0
      for (let i = 0; i < particles.length && linked < maxLinks; i++) {
        for (let j = i + 1; j < particles.length && linked < maxLinks; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = dx * dx + dy * dy
          if (d < 120 * 120) {
            linked++
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(129, 140, 248, ${0.18 * (1 - d / (120 * 120))})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      for (const p of particles) {
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const d = Math.hypot(dx, dy)
        if (d < 140 && d > 0) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.strokeStyle = `rgba(129, 140, 248, ${0.35 * (1 - d / 140)})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      raf = requestAnimationFrame(step)
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    resize()
    step()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [density, maxLinks])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
