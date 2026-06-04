import { useEffect, useRef } from 'react'

const CHARS = ['❄', '❅', '❆', '✦']

const FLAKES = Array.from({ length: 30 }, (_, i) => ({
  id:       i,
  char:     CHARS[i % CHARS.length],
  left:     Math.random() * 100,
  size:     10 + Math.random() * 14,
  delay:    Math.random() * 10,
  duration: 7 + Math.random() * 9,
  opacity:  0.35 + Math.random() * 0.5,
  sway:     15 + Math.random() * 25,
  rotate:   Math.random() * 360,
}))

const css = `
@keyframes snowfall {
  0%   { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
  5%   { opacity: 1; }
  95%  { opacity: 1; }
  100% { transform: translateY(105vh) translateX(var(--sway)) rotate(var(--rotate)); opacity: 0; }
}
`

export default function Snowflakes() {
  return (
    <>
      <style>{css}</style>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        zIndex: 9999, overflow: 'hidden',
      }}>
        {FLAKES.map(f => (
          <div
            key={f.id}
            style={{
              position: 'absolute',
              left:     `${f.left}%`,
              top:      0,
              fontSize: f.size,
              opacity:  f.opacity,
              color:    '#fff',
              userSelect: 'none',
              '--sway':   `${f.sway * (f.id % 2 === 0 ? 1 : -1)}px`,
              '--rotate': `${f.rotate}deg`,
              animation: `snowfall ${f.duration}s ${f.delay}s linear infinite`,
            }}
          >
            {f.char}
          </div>
        ))}
      </div>
    </>
  )
}
