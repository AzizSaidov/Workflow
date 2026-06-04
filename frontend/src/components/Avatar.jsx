import { useState, useEffect } from 'react'

const COLORS = [
  '#7F77DD', '#1D9E75', '#5DCAA5', '#F59E0B',
  '#F97316', '#A78BFA', '#F87171', '#60A5FA',
]

function colorFor(name) {
  if (!name) return COLORS[0]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

export default function Avatar({ src, name, size = 44, online = false, style = {} }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [src])

  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0, ...style }}>
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: colorFor(name),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: Math.round(size * 0.35),
          color: '#fff',
          flexShrink: 0,
          userSelect: 'none',
        }}>
          {initials}
        </div>
      )}
      {online && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: Math.round(size * 0.22), height: Math.round(size * 0.22),
          borderRadius: '50%',
          background: '#1D9E75',
          border: '2px solid var(--bg)',
        }} />
      )}
    </div>
  )
}
