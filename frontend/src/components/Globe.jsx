import { useEffect, useRef, useState, useMemo } from 'react'
import GlobeGL from 'react-globe.gl'
import useThemeStore from '../store/themeStore'

export default function Globe({ locations = [], width = 480, height = 480, showLegend = true }) {
  const globeRef = useRef()
  const { isDark } = useThemeStore()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.5
    controls.enableZoom = false
    controls.enablePan = false
  }, [loaded])

  // Points
  const points = useMemo(() => locations
    .filter(l => l.lat != null && l.lng != null)
    .map(l => ({
      lat: l.lat,
      lng: l.lng,
      role: l.role,
      color: l.role === 'me' ? '#FF4444' : l.role === 'client' ? '#7F77DD' : '#1D9E75',
      size: l.role === 'me' ? 1.0 : 0.55,
      label: l.role === 'me' ? 'Вы' : l.role === 'client' ? 'Заказчик' : 'Фрилансер',
    })), [locations])

  // Arcs — connect clients with freelancers to show the platform in action
  const arcs = useMemo(() => {
    const clients = points.filter(p => p.role === 'client')
    const freelancers = points.filter(p => p.role === 'freelancer')
    if (clients.length === 0 || freelancers.length === 0) return []

    const result = []
    clients.forEach((c, ci) => {
      // each client connects to 1-2 freelancers (staggered to avoid clutter)
      const targets = freelancers.filter((_, fi) => (ci + fi) % 3 !== 0).slice(0, 2)
      targets.forEach(f => {
        // skip if same city (distance < 5 degrees)
        const d = Math.abs(c.lat - f.lat) + Math.abs(c.lng - f.lng)
        if (d < 5) return
        result.push({ startLat: c.lat, startLng: c.lng, endLat: f.lat, endLng: f.lng })
      })
    })
    return result.slice(0, 10)
  }, [points])

  // Rings — pulsing from "me" and high-activity cities
  const rings = useMemo(() => {
    const me = locations.find(l => l.role === 'me')
    const result = []
    if (me) result.push({ lat: me.lat, lng: me.lng, role: 'me' })
    // add a pulse ring on the biggest freelancer cluster
    const tashkent = locations.find(l => Math.abs(l.lat - 41.30) < 0.5 && Math.abs(l.lng - 69.24) < 0.5 && l.role !== 'me')
    if (tashkent) result.push({ lat: tashkent.lat, lng: tashkent.lng, role: tashkent.role })
    return result
  }, [locations])

  const earthTexture = isDark ? '/earth-night.jpg' : '/earth-blue-marble.jpg'

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(127,119,221,0.18) 0%, transparent 68%)'
          : 'radial-gradient(circle, rgba(80,72,213,0.12) 0%, transparent 68%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Skeleton while loading */}
      {!loaded && <GlobeSkeleton size={width} isDark={isDark} />}

      <div style={{ position: 'relative', zIndex: 1, opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <GlobeGL
          ref={globeRef}
          width={width}
          height={height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={earthTexture}
          atmosphereColor={isDark ? '#7F77DD' : '#5048D5'}
          atmosphereAltitude={0.22}

          // Points
          pointsData={points}
          pointColor="color"
          pointAltitude={0.028}
          pointRadius="size"
          pointLabel={p => `<div style="background:rgba(13,13,24,0.92);border:0.5px solid rgba(255,255,255,0.12);border-radius:8px;padding:6px 10px;font-family:DM Sans,sans-serif;font-size:12px;color:#fff;pointer-events:none">${p.label}</div>`}

          // Arcs — animated connections
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={() => isDark
            ? ['rgba(127,119,221,0.7)', 'rgba(29,158,117,0.7)']
            : ['rgba(80,72,213,0.65)', 'rgba(13,146,104,0.65)']}
          arcAltitudeAutoScale={0.35}
          arcStroke={0.35}
          arcDashLength={0.45}
          arcDashGap={0.3}
          arcDashAnimateTime={2800}

          // Rings — pulsing from key locations
          ringsData={rings}
          ringLat="lat"
          ringLng="lng"
          ringColor={r => r.role === 'me'
            ? t => `rgba(255,68,68,${1 - t})`
            : t => `rgba(127,119,221,${0.8 - t * 0.8})`}
          ringMaxRadius={4.5}
          ringPropagationSpeed={2.5}
          ringRepeatPeriod={1400}

          onGlobeReady={() => setLoaded(true)}
        />
      </div>

      {/* Legend */}
      {loaded && showLegend && (
        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 14, zIndex: 2,
          background: isDark ? 'rgba(13,13,24,0.75)' : 'rgba(248,247,255,0.85)',
          backdropFilter: 'blur(8px)',
          border: '0.5px solid var(--border)',
          borderRadius: 20, padding: '6px 16px',
          fontSize: 12, color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7F77DD', flexShrink: 0 }} />
            Заказчики
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
            Фрилансеры
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 20, height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #7F77DD, #1D9E75)', flexShrink: 0 }} />
            Сделки
          </span>
          {locations.some(l => l.role === 'me') && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF4444', flexShrink: 0 }} />
              Вы
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function GlobeSkeleton({ size, isDark }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: size * 0.72, height: size * 0.72,
        borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle at 35% 35%, #1a1a2e 0%, #0d0b1e 60%, #07070e 100%)'
          : 'radial-gradient(circle at 35% 35%, #e8e5f8 0%, #d8d4f0 60%, #c8c3e8 100%)',
        border: `1px solid ${isDark ? 'rgba(127,119,221,0.2)' : 'rgba(80,72,213,0.15)'}`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: -2, borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: isDark ? '#7F77DD' : '#5048D5',
          borderRightColor: isDark ? 'rgba(127,119,221,0.3)' : 'rgba(80,72,213,0.3)',
          animation: 'spin 1.4s linear infinite',
        }} />
        {[20, 40, 60].map(pct => (
          <div key={pct} style={{ position: 'absolute', top: `${pct}%`, left: 0, right: 0, height: '0.5px', background: isDark ? 'rgba(127,119,221,0.1)' : 'rgba(80,72,213,0.08)' }} />
        ))}
        {[30, 50, 70].map(pct => (
          <div key={pct} style={{ position: 'absolute', left: `${pct}%`, top: 0, bottom: 0, width: '0.5px', background: isDark ? 'rgba(127,119,221,0.1)' : 'rgba(80,72,213,0.08)' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
          <i className="ti ti-world" style={{ fontSize: 28, color: isDark ? 'rgba(127,119,221,0.4)' : 'rgba(80,72,213,0.35)' }} />
          <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(80,72,213,0.4)', letterSpacing: 1 }}>
            Загрузка...
          </span>
        </div>
      </div>
    </div>
  )
}
