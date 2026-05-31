import { useEffect, useRef } from 'react'

export default function StarBackground({ isDark = true, intensity = 'full' }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const isDarkRef = useRef(isDark)
  const canvasAlphaRef = useRef(1)
  const fadingRef = useRef(false)

  useEffect(() => {
    if (isDarkRef.current === isDark) return
    // Fade out → switch → fade in
    fadingRef.current = true
    canvasAlphaRef.current = 1
    const fadeOut = setInterval(() => {
      canvasAlphaRef.current -= 0.07
      if (canvasAlphaRef.current <= 0) {
        canvasAlphaRef.current = 0
        isDarkRef.current = isDark
        clearInterval(fadeOut)
        const fadeIn = setInterval(() => {
          canvasAlphaRef.current += 0.07
          if (canvasAlphaRef.current >= 1) {
            canvasAlphaRef.current = 1
            fadingRef.current = false
            clearInterval(fadeIn)
          }
        }, 16)
      }
    }, 16)
    return () => clearInterval(fadeOut)
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

    // === LIGHT THEME: mesh blobs + dot grid ===
    const blobCount = intensity === 'full' ? 6 : 4
    const lightBlobs = []
    const blobColors = [
      [80, 72, 213],   // purple
      [13, 146, 104],  // green
      [128, 121, 224], // light purple
      [80, 72, 213],
      [13, 146, 104],
      [100, 90, 220],
    ]
    for (let i = 0; i < blobCount; i++) {
      lightBlobs.push({
        x: Math.random() * 1400,
        y: Math.random() * 900,
        r: Math.random() * 260 + 140,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.13,
        phase: Math.random() * Math.PI * 2,
        col: blobColors[i % blobColors.length],
      })
    }
    // Dot grid
    const dotGridSpacing = intensity === 'full' ? 38 : 52
    // Floating colored particles
    const particleCount = intensity === 'full' ? 55 : 25
    const lightParticles = []
    for (let i = 0; i < particleCount; i++) {
      const c = Math.random() > 0.5 ? [80, 72, 213] : [13, 146, 104]
      lightParticles.push({
        x: Math.random() * 1400,
        y: Math.random() * 900,
        r: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.09,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.006,
        col: c,
      })
    }

    let tt = 0

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      tt += 0.016

      const masterAlpha = canvasAlphaRef.current
      if (masterAlpha < 0.01) {
        animRef.current = requestAnimationFrame(frame)
        return
      }
      ctx.globalAlpha = masterAlpha

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
        // --- Mesh blobs ---
        for (let i = 0; i < lightBlobs.length; i++) {
          const o = lightBlobs[i]
          o.x += o.vx; o.y += o.vy
          if (o.x < -300) o.x = canvas.width + 300
          if (o.x > canvas.width + 300) o.x = -300
          if (o.y < -300) o.y = canvas.height + 300
          if (o.y > canvas.height + 300) o.y = -300
          const pulse = 0.5 + 0.5 * Math.sin(tt * 0.4 + o.phase)
          const alpha = 0.14 + 0.10 * pulse
          const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r)
          g.addColorStop(0, `rgba(${o.col[0]},${o.col[1]},${o.col[2]},${alpha})`)
          g.addColorStop(0.5, `rgba(${o.col[0]},${o.col[1]},${o.col[2]},${alpha * 0.4})`)
          g.addColorStop(1, 'transparent')
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2)
          ctx.fillStyle = g; ctx.globalAlpha = 1; ctx.fill()
        }

        // --- Dot grid ---
        const cols = Math.ceil(canvas.width / dotGridSpacing) + 1
        const rows = Math.ceil(canvas.height / dotGridSpacing) + 1
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const dx = c * dotGridSpacing
            const dy = r * dotGridSpacing
            const wave = Math.sin(tt * 0.8 + dx * 0.012 + dy * 0.009) * 0.5 + 0.5
            const a = 0.06 + 0.07 * wave
            ctx.beginPath()
            ctx.arc(dx, dy, 1.2, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(80,72,213,${a})`
            ctx.globalAlpha = 1
            ctx.fill()
          }
        }

        // --- Floating particles ---
        for (let i = 0; i < lightParticles.length; i++) {
          const s = lightParticles[i]
          s.x += s.vx; s.y += s.vy
          if (s.x < 0) s.x = canvas.width; if (s.x > canvas.width) s.x = 0
          if (s.y < 0) s.y = canvas.height; if (s.y > canvas.height) s.y = 0
          const a = (0.35 + 0.45 * Math.sin(tt * s.speed * 60 + s.phase))
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${a * 0.55})`
          ctx.globalAlpha = 1; ctx.fill()
          if (s.r > 1.8) {
            const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4)
            g.addColorStop(0, `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${a * 0.2})`)
            g.addColorStop(1, 'transparent')
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2)
            ctx.fillStyle = g; ctx.globalAlpha = 1; ctx.fill()
          }
        }
      }

      ctx.globalAlpha = masterAlpha
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
