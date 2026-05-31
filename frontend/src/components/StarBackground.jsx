import { useEffect, useRef } from 'react'

export default function StarBackground({ isDark = true, intensity = 'full' }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const isDarkRef = useRef(isDark)

  useEffect(() => {
    isDarkRef.current = isDark
  }, [isDark])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Stars (dark)
    const count = intensity === 'full' ? 220 : 110
    const darkStars = []
    for (let i = 0; i < count; i++) {
      const r = Math.random()
      darkStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.2,
        ba: Math.random() * 0.65 + 0.1,
        a: 0,
        ts: Math.random() * 0.022 + 0.004,
        to: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.035,
        col: r > 0.86 ? '#7F77DD' : r > 0.73 ? '#5DCAA5' : '#ffffff',
      })
    }

    const shooterCount = intensity === 'full' ? 5 : 2
    const shooters = []
    for (let i = 0; i < shooterCount; i++) {
      shooters.push({ on: false, t: 60 + i * 100, x: 0, y: 0, vx: 0, vy: 0, p: 0, a: 0 })
    }
    function spawnS(s) {
      s.on = true; s.p = 0
      s.x = Math.random() * canvas.width * 0.7
      s.y = Math.random() * canvas.height * 0.4
      const ang = Math.PI / 6 + Math.random() * Math.PI / 7
      const sp = 7 + Math.random() * 6
      s.vx = Math.cos(ang) * sp; s.vy = Math.sin(ang) * sp; s.a = 1
    }

    // Orbs (light)
    const orbCount = intensity === 'full' ? 16 : 8
    const lightOrbs = []
    for (let i = 0; i < orbCount; i++) {
      lightOrbs.push({
        x: Math.random() * 1200, y: Math.random() * 800,
        r: Math.random() * 110 + 50,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.16,
        phase: Math.random() * Math.PI * 2,
        col: Math.random() > 0.5 ? [64, 56, 178] : [16, 140, 103],
      })
    }
    const sparkCount = intensity === 'full' ? 160 : 70
    const lightSparks = []
    for (let i = 0; i < sparkCount; i++) {
      lightSparks.push({
        x: Math.random() * 1200, y: Math.random() * 800,
        r: Math.random() * 2.2 + 0.5,
        vx: (Math.random() - 0.5) * 0.14, vy: (Math.random() - 0.5) * 0.1,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.025 + 0.008,
        col: Math.random() > 0.5 ? [64, 56, 178] : [16, 140, 103],
      })
    }

    let tt = 0

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      tt += 0.016

      if (isDarkRef.current) {
        for (let i = 0; i < darkStars.length; i++) {
          const s = darkStars[i]
          s.x += s.vx; s.y += s.vy
          if (s.x < 0) s.x = canvas.width; if (s.x > canvas.width) s.x = 0
          if (s.y < 0) s.y = canvas.height; if (s.y > canvas.height) s.y = 0
          s.a = s.ba * (0.4 + 0.6 * Math.sin(tt * s.ts * 60 + s.to))
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fillStyle = s.col; ctx.globalAlpha = s.a; ctx.fill()
          if (s.r > 1.0 && s.a > 0.3) {
            const gc = s.col === '#7F77DD' ? 'rgba(127,119,221,' : 'rgba(93,202,165,'
            const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3.2)
            g.addColorStop(0, gc + '0.28)'); g.addColorStop(1, 'transparent')
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2)
            ctx.fillStyle = g; ctx.globalAlpha = s.a * 0.5; ctx.fill()
          }
        }
        for (let i = 0; i < shooters.length; i++) {
          const s = shooters[i]
          if (!s.on) { s.t--; if (s.t <= 0) spawnS(s); continue }
          s.x += s.vx; s.y += s.vy; s.p++
          s.a = Math.max(0, 1 - s.p / 60)
          const tx = s.x - s.vx * 9, ty = s.y - s.vy * 9
          const gr = ctx.createLinearGradient(tx, ty, s.x, s.y)
          gr.addColorStop(0, 'rgba(255,255,255,0)')
          gr.addColorStop(0.5, `rgba(210,206,255,${s.a * 0.5})`)
          gr.addColorStop(1, `rgba(255,255,255,${s.a})`)
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y)
          ctx.strokeStyle = gr; ctx.globalAlpha = s.a; ctx.lineWidth = 1.8; ctx.stroke()
          ctx.beginPath(); ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2)
          ctx.fillStyle = '#fff'; ctx.globalAlpha = s.a; ctx.fill()
          if (s.p > 65 || s.x > canvas.width || s.y > canvas.height) {
            s.on = false; s.t = 150 + Math.floor(Math.random() * 220)
          }
        }
      } else {
        for (let i = 0; i < lightOrbs.length; i++) {
          const o = lightOrbs[i]
          o.x += o.vx; o.y += o.vy
          if (o.x < -150) o.x = canvas.width + 150
          if (o.x > canvas.width + 150) o.x = -150
          if (o.y < -150) o.y = canvas.height + 150
          if (o.y > canvas.height + 150) o.y = -150
          const pulse = 0.5 + 0.5 * Math.sin(tt * 0.6 + o.phase)
          const alpha = 0.10 + 0.10 * pulse
          const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r)
          g.addColorStop(0, `rgba(${o.col[0]},${o.col[1]},${o.col[2]},${alpha})`)
          g.addColorStop(1, 'transparent')
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2)
          ctx.fillStyle = g; ctx.globalAlpha = 1; ctx.fill()
        }
        for (let i = 0; i < lightSparks.length; i++) {
          const s = lightSparks[i]
          s.x += s.vx; s.y += s.vy
          if (s.x < 0) s.x = canvas.width; if (s.x > canvas.width) s.x = 0
          if (s.y < 0) s.y = canvas.height; if (s.y > canvas.height) s.y = 0
          const a = (0.3 + 0.7 * Math.sin(tt * s.speed * 60 + s.phase)) * 0.6
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${a})`
          ctx.globalAlpha = 1; ctx.fill()
          if (s.r > 1.4 && a > 0.25) {
            const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3.5)
            g.addColorStop(0, `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${a * 0.35})`)
            g.addColorStop(1, 'transparent')
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2)
            ctx.fillStyle = g; ctx.globalAlpha = 1; ctx.fill()
          }
        }
      }

      ctx.globalAlpha = 1
      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)

    return () => {
      window.removeEventListener('resize', resize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [intensity])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
