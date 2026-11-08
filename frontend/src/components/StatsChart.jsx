import { useEffect, useRef } from 'react'

export default function StatsChart({ data }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height
    const pad = 16
    const entries = data || []
    const max = Math.max(1, ...entries.map((e) => e.value))
    const barW = (W - pad * 2) / entries.length

    ctx.clearRect(0, 0, W, H)

    const colors = ['#6366f1', '#34d399', '#f59e0b', '#f472b6']

    entries.forEach((entry, i) => {
      const h = ((H - pad * 2 - 20) * entry.value) / max
      const x = pad + i * barW + barW * 0.2
      const y = H - pad - 20 - h
      const w = barW * 0.6

      const grad = ctx.createLinearGradient(0, y, 0, H - pad - 20)
      grad.addColorStop(0, colors[i % colors.length])
      grad.addColorStop(1, `${colors[i % colors.length]}55`)
      ctx.fillStyle = grad
      ctx.beginPath()
      const r = Math.min(6, w / 2)
      ctx.roundRect(x, y, w, h, r)
      ctx.fill()

      ctx.fillStyle = '#475569'
      ctx.font = '600 13px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(entry.value), x + w / 2, y - 8)

      ctx.fillStyle = '#94a3b8'
      ctx.font = '12px Inter, system-ui, sans-serif'
      ctx.fillText(entry.label, x + w / 2, H - 4)
    })
  }, [data])

  return <canvas ref={canvasRef} className="h-56 w-full" aria-label="Biểu đồ thống kê" />
}
