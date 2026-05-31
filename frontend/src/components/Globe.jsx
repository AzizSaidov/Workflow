import { useEffect, useRef, useState } from 'react'
import GlobeGL from 'react-globe.gl'
import useThemeStore from '../store/themeStore'

export default function Globe({ locations = [], width = 480, height = 480 }) {
  const globeRef = useRef()
  const { isDark } = useThemeStore()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.6
    controls.enableZoom = false
    controls.enablePan = false
  }, [loaded])

  const points = locations
    .filter((l) => l.latitude != null && l.longitude != null)
    .map((l) => ({
      lat: l.latitude,
      lng: l.longitude,
      color: l.role === 'client' ? '#7F77DD' : '#1D9E75',
      size: 0.5,
    }))

  const earthTexture = isDark
    ? 'https://unpkg.com/three-globe/example/img/earth-night.jpg'
    : 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'

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
          atmosphereAltitude={0.18}
          pointsData={points}
          pointColor="color"
          pointAltitude={0.025}
          pointRadius="size"
          onGlobeReady={() => setLoaded(true)}
        />
      </div>

      {/* Legend */}
      {loaded && (
        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 16, zIndex: 2,
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
        {/* Spinning arc */}
        <div style={{
          position: 'absolute', inset: -2,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: isDark ? '#7F77DD' : '#5048D5',
          borderRightColor: isDark ? 'rgba(127,119,221,0.3)' : 'rgba(80,72,213,0.3)',
          animation: 'spin 1.4s linear infinite',
        }} />
        {/* Grid lines */}
        {[20, 40, 60].map(pct => (
          <div key={pct} style={{
            position: 'absolute',
            top: `${pct}%`, left: 0, right: 0,
            height: '0.5px',
            background: isDark ? 'rgba(127,119,221,0.1)' : 'rgba(80,72,213,0.08)',
          }} />
        ))}
        {[30, 50, 70].map(pct => (
          <div key={pct} style={{
            position: 'absolute',
            left: `${pct}%`, top: 0, bottom: 0,
            width: '0.5px',
            background: isDark ? 'rgba(127,119,221,0.1)' : 'rgba(80,72,213,0.08)',
          }} />
        ))}
        {/* Center label */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 6,
        }}>
          <i className="ti ti-world" style={{ fontSize: 28, color: isDark ? 'rgba(127,119,221,0.4)' : 'rgba(80,72,213,0.35)' }} />
          <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(80,72,213,0.4)', letterSpacing: 1 }}>
            Загрузка...
          </span>
        </div>
      </div>
    </div>
  )
}
