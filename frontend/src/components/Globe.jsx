import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import GlobeGL from 'react-globe.gl'
import useThemeStore from '../store/themeStore'

// City database for floating labels
const CITY_DB = [
  { flag: '🇹🇯', name: 'Душанбе',  lat: 38.56, lng: 68.77 },
  { flag: '🇺🇿', name: 'Ташкент',  lat: 41.30, lng: 69.24 },
  { flag: '🇰🇿', name: 'Алматы',   lat: 43.22, lng: 76.85 },
  { flag: '🇷🇺', name: 'Москва',   lat: 55.75, lng: 37.62 },
  { flag: '🇩🇪', name: 'Берлин',   lat: 52.52, lng: 13.40 },
  { flag: '🇮🇹', name: 'Рим',      lat: 41.90, lng: 12.50 },
  { flag: '🇬🇧', name: 'Лондон',   lat: 51.51, lng: -0.13 },
  { flag: '🇦🇪', name: 'Дубай',    lat: 25.20, lng: 55.27 },
  { flag: '🇫🇷', name: 'Париж',    lat: 48.86, lng:  2.35 },
  { flag: '🇮🇳', name: 'Дели',     lat: 28.61, lng: 77.21 },
  { flag: '🇨🇳', name: 'Шанхай',   lat: 31.22, lng: 121.47 },
  { flag: '🇹🇷', name: 'Стамбул',  lat: 41.01, lng: 28.97 },
  { flag: '🇺🇸', name: 'Нью-Йорк', lat: 40.71, lng: -74.01 },
  { flag: '🇧🇷', name: 'Сан-Паулу',lat: -23.55, lng: -46.63 },
]

export default function Globe({
  locations = [],
  width = 480,
  height = 480,
  showLegend = true,
  showLabels = true,
}) {
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
      lat: l.lat, lng: l.lng, role: l.role,
      color: l.role === 'me' ? '#FF4444' : l.role === 'client' ? '#7F77DD' : '#1D9E75',
      size: l.role === 'me' ? 1.05 : 0.6,
      label: l.role === 'me' ? 'Вы' : l.role === 'client' ? 'Заказчик' : 'Фрилансер',
    })), [locations])

  // Arcs — connections between clients and freelancers
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

  // Pulsing rings — "me" dot + most active cluster
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

  // City floating labels — only for cities that have nearby users
  const cityLabels = useMemo(() => {
    if (!showLabels || width < 420) return []
    return CITY_DB.filter(city =>
      locations.some(l =>
        l.lat != null &&
        Math.abs(l.lat - city.lat) < 3 &&
        Math.abs(l.lng - city.lng) < 3
      )
    )
  }, [locations, showLabels, width])

  // Click dot → pause rotation for 2s so tooltip is readable
  const handlePointClick = useCallback(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    controls.autoRotate = false
    setTimeout(() => { controls.autoRotate = true }, 2000)
  }, [])

  const earthTexture = isDark ? '/earth-night.jpg' : '/earth-blue-marble.jpg'
  const fadeRgb = isDark ? '7,7,14' : '248,247,255'

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
        @keyframes globeIn {
          from { opacity:0; transform:scale(0.94); }
          to   { opacity:1; transform:scale(1); }
        }
      `}</style>

      {/* Deep space glow behind the globe */}
      <div style={{
        position: 'absolute', inset: '-15%', borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(127,119,221,0.14) 0%, rgba(29,158,117,0.06) 50%, transparent 70%)'
          : 'radial-gradient(circle, rgba(80,72,213,0.11) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Orbital ring 1 — purple, medium speed */}
      {loaded && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: width * 1.09, height: width * 1.09,
          borderRadius: '50%',
          border: '1px solid rgba(127,119,221,0.2)',
          boxShadow: '0 0 12px rgba(127,119,221,0.06) inset',
          animation: 'orbitSpin1 16s linear infinite',
          pointerEvents: 'none', zIndex: 0,
        }}>
          <div style={{
            position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)',
            width: 7, height: 7, borderRadius: '50%',
            background: '#7F77DD',
            boxShadow: '0 0 10px #7F77DD, 0 0 20px rgba(127,119,221,0.5)',
          }} />
        </div>
      )}

      {/* Orbital ring 2 — green, slow */}
      {loaded && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: width * 1.17, height: width * 1.17,
          borderRadius: '50%',
          border: '0.5px solid rgba(29,158,117,0.15)',
          animation: 'orbitSpin2 26s linear infinite',
          pointerEvents: 'none', zIndex: 0,
        }}>
          <div style={{
            position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)',
            width: 5, height: 5, borderRadius: '50%',
            background: '#1D9E75',
            boxShadow: '0 0 8px #1D9E75, 0 0 16px rgba(29,158,117,0.4)',
          }} />
        </div>
      )}

      {/* Orbital ring 3 — faint, fast */}
      {loaded && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: width * 1.04, height: width * 1.04,
          borderRadius: '50%',
          border: '0.5px solid rgba(255,255,255,0.06)',
          animation: 'orbitSpin3 10s linear infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />
      )}

      {/* Skeleton */}
      {!loaded && <GlobeSkeleton size={width} isDark={isDark} />}

      {/* Globe */}
      <div style={{
        position: 'relative', zIndex: 1,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.6s ease',
        animation: loaded ? 'globeIn 0.7s ease' : 'none',
      }}>
        <GlobeGL
          ref={globeRef}
          width={width}
          height={height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={earthTexture}
          atmosphereColor={isDark ? '#9B93F0' : '#5048D5'}
          atmosphereAltitude={0.26}

          pointsData={points}
          pointColor="color"
          pointAltitude={0.03}
          pointRadius="size"
          pointLabel={p =>
            `<div style="background:rgba(10,10,20,0.93);border:0.5px solid rgba(255,255,255,0.13);` +
            `border-radius:8px;padding:5px 11px;font-family:DM Sans,sans-serif;font-size:12px;` +
            `color:#fff;pointer-events:none;backdrop-filter:blur(8px);` +
            `box-shadow:0 2px 12px rgba(0,0,0,0.5);">${p.label}</div>`
          }
          onPointClick={handlePointClick}

          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={() => ['rgba(127,119,221,0.85)', 'rgba(29,158,117,0.85)']}
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

          htmlElementsData={cityLabels}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude={0.2}
          htmlElement={d => {
            const el = document.createElement('div')
            el.style.cssText = [
              'display:flex', 'align-items:center', 'gap:5px',
              'background:rgba(7,7,14,0.88)',
              'border:0.5px solid rgba(127,119,221,0.32)',
              'border-radius:20px', 'padding:3px 9px 3px 5px',
              "font-family:'DM Sans',sans-serif", 'font-size:11px',
              'color:rgba(255,255,255,0.9)', 'white-space:nowrap',
              'pointer-events:none',
              'box-shadow:0 2px 14px rgba(0,0,0,0.55)',
              'backdrop-filter:blur(8px)',
            ].join(';')
            el.innerHTML = `<span style="font-size:13px;line-height:1">${d.flag}</span><span>${d.name}</span>`
            return el
          }}

          onGlobeReady={() => setLoaded(true)}
        />
      </div>

      {/* Vignette — globe fades into background at edges, looks like floating in space */}
      {loaded && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `radial-gradient(circle, transparent 50%, rgba(${fadeRgb},0.35) 68%, rgba(${fadeRgb},0.75) 84%, rgba(${fadeRgb},0.96) 100%)`,
          pointerEvents: 'none', zIndex: 2,
        }} />
      )}

      {/* Legend */}
      {loaded && showLegend && (
        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 14, zIndex: 4,
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
        border: `1px solid ${isDark ? 'rgba(127,119,221,0.2)' : 'rgba(80,72,213,0.15)'}`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: '2px solid transparent', borderTopColor: isDark ? '#7F77DD' : '#5048D5', borderRightColor: isDark ? 'rgba(127,119,221,0.3)' : 'rgba(80,72,213,0.3)', animation: 'spin 1.4s linear infinite' }} />
        {[20,40,60].map(p => <div key={p} style={{ position:'absolute', top:`${p}%`, left:0, right:0, height:'0.5px', background: isDark?'rgba(127,119,221,0.1)':'rgba(80,72,213,0.08)' }} />)}
        {[30,50,70].map(p => <div key={p} style={{ position:'absolute', left:`${p}%`, top:0, bottom:0, width:'0.5px', background: isDark?'rgba(127,119,221,0.1)':'rgba(80,72,213,0.08)' }} />)}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:6 }}>
          <i className="ti ti-world" style={{ fontSize:28, color: isDark?'rgba(127,119,221,0.4)':'rgba(80,72,213,0.35)' }} />
          <span style={{ fontSize:11, color: isDark?'rgba(255,255,255,0.2)':'rgba(80,72,213,0.4)', letterSpacing:1 }}>Загрузка...</span>
        </div>
      </div>
    </div>
  )
}
