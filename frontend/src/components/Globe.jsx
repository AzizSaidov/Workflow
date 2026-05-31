import { useEffect, useRef, useState } from 'react'
import GlobeGL from 'react-globe.gl'
import useThemeStore from '../store/themeStore'

export default function Globe({ locations = [], width = 480, height = 480 }) {
  const globeRef = useRef()
  const { isDark } = useThemeStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.6
    controls.enableZoom = false
    controls.enablePan = false
    setReady(true)
  }, [])

  const points = locations
    .filter((l) => l.latitude != null && l.longitude != null)
    .map((l) => ({
      lat: l.latitude,
      lng: l.longitude,
      color: l.role === 'client' ? '#7F77DD' : '#1D9E75',
      size: 0.5,
    }))

  const earthTexture = isDark
    ? '//unpkg.com/three-globe/example/img/earth-night.jpg'
    : '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg'

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Glow ring */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle at 50% 50%, rgba(127,119,221,0.15) 0%, transparent 68%)'
          : 'radial-gradient(circle at 50% 50%, rgba(80,72,213,0.12) 0%, transparent 68%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <GlobeGL
          ref={globeRef}
          width={width}
          height={height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={earthTexture}
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor={isDark ? '#7F77DD' : '#5048D5'}
          atmosphereAltitude={0.18}
          pointsData={points}
          pointColor="color"
          pointAltitude={0.025}
          pointRadius="size"
          pointsMerge={false}
        />
      </div>

      {/* Legend */}
      {ready && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 16, zIndex: 2,
          background: isDark ? 'rgba(13,13,24,0.7)' : 'rgba(248,247,255,0.8)',
          backdropFilter: 'blur(8px)',
          border: '0.5px solid var(--border)',
          borderRadius: 20, padding: '6px 16px',
          fontSize: 12, color: 'var(--text-secondary)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7F77DD', display: 'inline-block' }} />
            Заказчики
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', display: 'inline-block' }} />
            Фрилансеры
          </span>
        </div>
      )}
    </div>
  )
}
