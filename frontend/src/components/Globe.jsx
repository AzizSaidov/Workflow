import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import GlobeGL from 'react-globe.gl'
import useThemeStore from '../store/themeStore'
import useSiteStore from '../store/siteStore'


export default function Globe({
  locations = [],
  width = 480,
  height = 480,
  showLegend = true,
}) {
  const globeRef   = useRef()
  const { isDark } = useThemeStore()
  const winter     = useSiteStore(s => s.holidayMode)
  const [loaded, setLoaded] = useState(false)
  const [textureFading, setTextureFading] = useState(false)

  useEffect(() => {
    if (!loaded) return
    setTextureFading(true)
    const t = setTimeout(() => setTextureFading(false), 320)
    return () => clearTimeout(t)
  }, [isDark])

  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.5
    controls.enableZoom = false
    controls.enablePan = false
  }, [loaded])

  const points = useMemo(() => locations
    .filter(l => l.lat != null && l.lng != null)
    .map(l => ({
      lat: l.lat, lng: l.lng, role: l.role,
      color: l.role === 'me' ? '#FF4444' : l.role === 'client' ? '#7F77DD' : '#1D9E75',
      size: l.role === 'me' ? 1.05 : 0.6,
      label: l.role === 'me' ? 'Вы' : l.role === 'client' ? 'Заказчик' : 'Фрилансер',
    })), [locations])

  // Snow particles scattered across the globe in winter mode
  const SNOW_SEED = useMemo(() => {
    const pts = []
    // Polar caps — concentrated near 80–90°
    for (let i = 0; i < 18; i++) {
      pts.push({ lat:  (80 + Math.random() * 10),       lng: Math.random() * 360 - 180 })
      pts.push({ lat: -(80 + Math.random() * 10),       lng: Math.random() * 360 - 180 })
    }
    // Mid-latitude snow
    for (let i = 0; i < 20; i++) {
      pts.push({ lat: Math.random() * 120 - 60, lng: Math.random() * 360 - 180 })
    }
    return pts
  }, [])

  const allPoints = useMemo(() => {
    if (!winter) return points
    const snowPts = SNOW_SEED.map(p => ({
      ...p, role: 'snow',
      color: `rgba(${200 + Math.floor(Math.random()*55)},${230 + Math.floor(Math.random()*25)},255,0.75)`,
      size: 0.18 + Math.random() * 0.28,
      label: '',
    }))
    return [...points, ...snowPts]
  }, [points, winter, SNOW_SEED])

  const arcs = useMemo(() => {
    const clients = points.filter(p => p.role === 'client')
    const freelancers = points.filter(p => p.role === 'freelancer')
    if (!clients.length || !freelancers.length) return []
    const result = []
    clients.forEach((c, ci) => {
      freelancers
        .filter((_, fi) => (ci + fi) % 3 !== 0)
        .slice(0, 2)
        .forEach(f => {
          if (Math.abs(c.lat - f.lat) + Math.abs(c.lng - f.lng) < 5) return
          result.push({ startLat: c.lat, startLng: c.lng, endLat: f.lat, endLng: f.lng })
        })
    })
    return result.slice(0, 10)
  }, [points])

  const rings = useMemo(() => {
    const result = []
    const me = locations.find(l => l.role === 'me')
    if (me) result.push({ lat: me.lat, lng: me.lng, role: 'me' })
    const cluster = locations.find(l =>
      l.role !== 'me' && Math.abs(l.lat - 41.30) < 0.5 && Math.abs(l.lng - 69.24) < 0.5
    )
    if (cluster) result.push({ lat: cluster.lat, lng: cluster.lng, role: cluster.role })
    return result
  }, [locations])

  const handlePointClick = useCallback(() => {
    if (!globeRef.current) return
    const c = globeRef.current.controls()
    c.autoRotate = false
    setTimeout(() => { c.autoRotate = true }, 2000)
  }, [])

  const earthTexture = winter ? '/earth-blue-marble.jpg' : (isDark ? '/earth-night.jpg' : '/earth-blue-marble.jpg')
  const fadeRgb      = isDark ? '7,7,14' : '248,247,255'

  const atmoColor  = winter ? '#8ACFEA'  : (isDark ? '#9B93F0' : '#6096E8')
  const atmoAlt    = winter ? 0.35       : (isDark ? 0.26 : 0.15)
  const ring1Color = winter ? 'rgba(91,184,212,0.25)'  : 'rgba(127,119,221,0.2)'
  const ring1Dot   = winter ? '#5BB8D4'  : '#7F77DD'
  const ring1Glow  = winter ? '91,184,212' : '127,119,221'
  const ring2Color = winter ? 'rgba(72,201,176,0.18)'  : 'rgba(29,158,117,0.14)'
  const ring2Dot   = winter ? '#48C9B0'  : '#1D9E75'
  const ring2Glow  = winter ? '72,201,176' : '29,158,117'
  const arcColors  = winter
    ? () => ['rgba(91,184,212,0.85)', 'rgba(72,201,176,0.85)']
    : () => ['rgba(127,119,221,0.85)', 'rgba(29,158,117,0.85)']
  const spaceGlow  = winter
    ? 'radial-gradient(circle, rgba(91,184,212,0.15) 0%, rgba(72,201,176,0.06) 50%, transparent 70%)'
    : (isDark
      ? 'radial-gradient(circle, rgba(127,119,221,0.13) 0%, rgba(29,158,117,0.05) 50%, transparent 70%)'
      : 'radial-gradient(circle, rgba(59,91,219,0.10) 0%, transparent 65%)')

  return (
    <div style={{ position: 'relative', width, height }}>
      <style>{`
        @keyframes orbitSpin1 {
          from { transform: translate(-50%,-50%) rotateX(68deg) rotateZ(0deg); }
          to   { transform: translate(-50%,-50%) rotateX(68deg) rotateZ(360deg); }
        }
        @keyframes orbitSpin2 {
          from { transform: translate(-50%,-50%) rotateX(50deg) rotateZ(100deg); }
          to   { transform: translate(-50%,-50%) rotateX(50deg) rotateZ(460deg); }
        }
        @keyframes orbitSpin3 {
          from { transform: translate(-50%,-50%) rotateX(82deg) rotateZ(220deg); }
          to   { transform: translate(-50%,-50%) rotateX(82deg) rotateZ(580deg); }
        }
        /* clip the WebGL canvas to a circle — kills square shadow and bg bleed */
        .globe-canvas-clip { border-radius: 50%; overflow: hidden; background: transparent !important; }
        .globe-canvas-clip canvas { outline: none !important; display: block !important; box-shadow: none !important; border-radius: 50%; }
      `}</style>

      {/* Deep space glow */}
      <div style={{
        position: 'absolute', inset: '-12%', borderRadius: '50%',
        background: spaceGlow,
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Orbital ring 1 */}
      {loaded && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: width * 1.09, height: width * 1.09,
          borderRadius: '50%',
          border: `1px solid ${ring1Color}`,
          boxShadow: `0 0 10px rgba(${ring1Glow},0.06) inset`,
          animation: 'orbitSpin1 16s linear infinite',
          pointerEvents: 'none', zIndex: 0,
        }}>
          <div style={{
            position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)',
            width: 7, height: 7, borderRadius: '50%',
            background: ring1Dot,
            boxShadow: `0 0 10px ${ring1Dot}, 0 0 20px rgba(${ring1Glow},0.5)`,
          }} />
        </div>
      )}

      {/* Orbital ring 2 */}
      {loaded && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: width * 1.17, height: width * 1.17,
          borderRadius: '50%',
          border: `0.5px solid ${ring2Color}`,
          animation: 'orbitSpin2 26s linear infinite',
          pointerEvents: 'none', zIndex: 0,
        }}>
          <div style={{
            position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)',
            width: 5, height: 5, borderRadius: '50%',
            background: ring2Dot,
            boxShadow: `0 0 8px ${ring2Dot}, 0 0 16px rgba(${ring2Glow},0.4)`,
          }} />
        </div>
      )}

      {/* Orbital ring 3 — faint fast */}
      {loaded && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: width * 1.04, height: width * 1.04,
          borderRadius: '50%',
          border: '0.5px solid rgba(255,255,255,0.05)',
          animation: 'orbitSpin3 10s linear infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />
      )}

      {/* Skeleton */}
      {!loaded && <GlobeSkeleton size={width} isDark={isDark} />}

      {/* Globe — always rendered so onGlobeReady fires */}
      <div style={{ position: 'relative', zIndex: 1, opacity: loaded ? (textureFading ? 0.15 : 1) : 0, transition: textureFading ? 'opacity 0.18s ease' : 'opacity 0.7s ease', clipPath: 'circle(50% at 50% 50%)', WebkitClipPath: 'circle(50% at 50% 50%)' }}>
        <GlobeGL
          ref={globeRef}
          width={width}
          height={height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={earthTexture}
          atmosphereColor={atmoColor}
          atmosphereAltitude={atmoAlt}

          pointsData={allPoints}
          pointColor="color"
          pointAltitude={0.03}
          pointRadius="size"
          pointLabel={p => p.role === 'snow' ? false :
            `<div style="background:rgba(10,10,20,0.93);border:0.5px solid rgba(255,255,255,0.13);` +
            `border-radius:8px;padding:5px 11px;font-size:12px;color:#fff;pointer-events:none;` +
            `box-shadow:0 2px 12px rgba(0,0,0,0.5);">${p.label}</div>`
          }
          onPointClick={handlePointClick}

          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={arcColors}
          arcAltitudeAutoScale={0.4}
          arcStroke={0.45}
          arcDashLength={0.5}
          arcDashGap={0.22}
          arcDashAnimateTime={2200}

          ringsData={rings}
          ringLat="lat"
          ringLng="lng"
          ringColor={r => r.role === 'me'
            ? t => `rgba(255,68,68,${(1 - t) * 0.9})`
            : t => `rgba(127,119,221,${(1 - t) * 0.85})`}
          ringMaxRadius={5.5}
          ringPropagationSpeed={3}
          ringRepeatPeriod={1100}

          onGlobeReady={() => setLoaded(true)}
        />
      </div>

      {/* Vignette — edges fade to background */}
      {loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: isDark
            ? `radial-gradient(circle, transparent 44%, rgba(${fadeRgb},0.35) 62%, rgba(${fadeRgb},0.80) 78%, rgba(${fadeRgb},0.98) 100%)`
            : `radial-gradient(circle, transparent 36%, rgba(${fadeRgb},0.5) 52%, rgba(${fadeRgb},0.90) 68%, rgba(${fadeRgb},1) 80%)`,
          pointerEvents: 'none', zIndex: 2,
          borderRadius: '50%',
          overflow: 'hidden',
        }} />
      )}

      {/* ── Winter frost overlay ── */}
      {winter && loaded && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          borderRadius: '50%', pointerEvents: 'none',
          background: [
            // North pole white cap
            'radial-gradient(ellipse 70% 28% at 50% 2%, rgba(220,245,255,0.55) 0%, rgba(200,235,255,0.2) 50%, transparent 100%)',
            // South pole white cap
            'radial-gradient(ellipse 70% 22% at 50% 98%, rgba(220,245,255,0.45) 0%, rgba(200,235,255,0.15) 50%, transparent 100%)',
            // Frost creeping from edges
            'radial-gradient(circle, transparent 42%, rgba(180,225,255,0.07) 58%, rgba(200,235,255,0.18) 74%, rgba(215,240,255,0.38) 88%, rgba(230,248,255,0.6) 100%)',
            // Overall icy blue tint
            'radial-gradient(circle, rgba(91,184,212,0.06) 0%, transparent 65%)',
          ].join(','),
        }} />
      )}

      {/* Winter polar glow rings */}
      {winter && loaded && (
        <>
          <div style={{
            position: 'absolute', left: '50%', top: '6%',
            transform: 'translateX(-50%)',
            width: width * 0.38, height: width * 0.1,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(200,240,255,0.35) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 4, filter: 'blur(6px)',
          }} />
          <div style={{
            position: 'absolute', left: '50%', bottom: '6%',
            transform: 'translateX(-50%)',
            width: width * 0.3, height: width * 0.08,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(200,240,255,0.28) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 4, filter: 'blur(5px)',
          }} />
        </>
      )}


      {/* Legend */}
      {loaded && showLegend && (
        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 14, zIndex: 4,
          background: isDark ? 'rgba(13,13,24,0.75)' : 'rgba(240,245,255,0.85)',
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
            <span style={{ width: 20, height: 2, borderRadius: 2, background: 'linear-gradient(90deg,#7F77DD,#1D9E75)', flexShrink: 0 }} />
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
    <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: size * 0.72, height: size * 0.72, borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle at 35% 35%, #1a1a2e 0%, #0d0b1e 60%, #07070e 100%)'
          : 'radial-gradient(circle at 35% 35%, #e8e5f8 0%, #d8d4f0 60%, #c8c3e8 100%)',
        border: `1px solid ${isDark ? 'rgba(127,119,221,0.2)' : 'rgba(59,91,219,0.15)'}`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: '2px solid transparent', borderTopColor: isDark ? '#7F77DD' : '#3B5BDB', borderRightColor: isDark ? 'rgba(127,119,221,0.3)' : 'rgba(59,91,219,0.3)', animation: 'spin 1.4s linear infinite' }} />
        {[20,40,60].map(p => <div key={p} style={{ position:'absolute', top:`${p}%`, left:0, right:0, height:'0.5px', background: isDark?'rgba(127,119,221,0.1)':'rgba(59,91,219,0.08)' }} />)}
        {[30,50,70].map(p => <div key={p} style={{ position:'absolute', left:`${p}%`, top:0, bottom:0, width:'0.5px', background: isDark?'rgba(127,119,221,0.1)':'rgba(59,91,219,0.08)' }} />)}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:6 }}>
          <i className="ti ti-world" style={{ fontSize:28, color: isDark?'rgba(127,119,221,0.4)':'rgba(59,91,219,0.35)' }} />
          <span style={{ fontSize:11, color: isDark?'rgba(255,255,255,0.2)':'rgba(59,91,219,0.4)', letterSpacing:1 }}>Загрузка...</span>
        </div>
      </div>
    </div>
  )
}
