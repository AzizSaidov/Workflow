import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'

const SIZES = {
  sm:  { mark: 26, font: 17, gap: 8,  ring: 2 },
  md:  { mark: 34, font: 22, gap: 10, ring: 2.5 },
  lg:  { mark: 48, font: 32, gap: 13, ring: 3 },
}

export default function Logo({ size = 'md', to = '/', style = {}, isDark: isDarkProp }) {
  const { isDark: storeIsDark } = useThemeStore()
  const isDark = isDarkProp !== undefined ? isDarkProp : storeIsDark
  const s = SIZES[size] || SIZES.md

  return (
    <>
      <style>{`
        @keyframes logoRingSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes logoGlow {
          0%, 100% { filter: brightness(1) saturate(1); }
          50%       { filter: brightness(1.25) saturate(1.3); }
        }
        @keyframes logoFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Link to={to} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: s.gap, ...style }}>

        {/* ── Mark ── */}
        <div style={{ position: 'relative', width: s.mark, height: s.mark, flexShrink: 0 }}>
          {/* Outer spinning gradient ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #7F77DD 0%, #5DCAA5 45%, #AFA9EC 70%, #7F77DD 100%)',
            animation: 'logoRingSpin 3.5s linear infinite',
          }} />
          {/* Inner fill — matches bg */}
          <div style={{
            position: 'absolute',
            inset: s.ring,
            borderRadius: '50%',
            background: isDark ? '#07070E' : '#F0F5FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* W glyph */}
            <svg width={s.mark * 0.52} height={s.mark * 0.42} viewBox="0 0 20 16" fill="none">
              <path
                d="M1 1L5 15L10 7L15 15L19 1"
                stroke="url(#wGrad)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="wGrad" x1="1" y1="1" x2="19" y2="15" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7F77DD" />
                  <stop offset="100%" stopColor="#5DCAA5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Glow halo */}
          <div style={{
            position: 'absolute', inset: -4,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(127,119,221,0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* ── Text ── */}
        <span style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: s.font,
          letterSpacing: '-0.5px',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'baseline',
          animation: 'logoFadeUp 0.5s ease both',
        }}>
          <span style={{ color: isDark ? '#fff' : '#0E1629' }}>work</span>
          <span style={{
            background: 'linear-gradient(90deg, #7F77DD 0%, #5DCAA5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'logoGlow 3.5s ease-in-out infinite 1.2s',
          }}>
            flow
          </span>
        </span>

      </Link>
    </>
  )
}
