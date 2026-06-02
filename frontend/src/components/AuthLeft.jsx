import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Globe from './Globe'
import { statsApi } from '../api/stats'

export default function AuthLeft({ isDark }) {
  const [locations, setLocations] = useState([])
  const [stats, setStats] = useState(null)
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    statsApi.getUserLocations().then(r => setLocations(r.data || [])).catch(() => {})
    statsApi.getGlobal().then(r => setStats(r.data)).catch(() => {})
    statsApi.getOnlineCount().then(r => setOnlineCount(r.data?.count || 0)).catch(() => {})
  }, [])

  const freelancers = stats?.total_freelancers || 0
  const completed = stats?.completed_projects || 0

  return (
    <div style={{
      width: '52%', minHeight: '100vh', position: 'relative',
      background: 'linear-gradient(160deg, #0A0A18 0%, #0D0D22 50%, #080812 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: '15%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.18) 0%, transparent 70%)', animation: 'authPulse 4s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,0.14) 0%, transparent 70%)', animation: 'authPulse 5s ease-in-out infinite 1.5s', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '55%', left: '10%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.1) 0%, transparent 70%)', animation: 'authPulse 6s ease-in-out infinite 0.8s', pointerEvents: 'none' }} />

      <style>{`
        @keyframes authPulse { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.15);opacity:1} }
        @keyframes authFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes authFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
      `}</style>

      {/* Logo */}
      <div style={{ position: 'absolute', top: 32, left: 36, zIndex: 4 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px', color: '#fff' }}>
            work<span style={{ color: '#7F77DD' }}>flow</span>
          </span>
        </Link>
      </div>

      {/* Globe */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'absolute', inset: -30, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <Globe locations={locations} width={380} height={380} />
      </div>

      {/* Badge 1 — Escrow 99% */}
      <div style={{ position: 'absolute', top: '18%', right: '8%', animation: 'authFloat 3.5s ease-in-out infinite', zIndex: 3 }}>
        <div style={{ background: 'rgba(13,13,24,0.88)', border: '0.5px solid rgba(93,202,165,0.35)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(93,202,165,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-shield-check" style={{ fontSize: 16, color: '#5DCAA5' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Эскроу-защита</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>99% фрилансеру</div>
          </div>
        </div>
      </div>

      {/* Badge 2 — Online now */}
      <div style={{ position: 'absolute', top: '28%', left: '5%', animation: 'authFloat2 4s ease-in-out infinite 0.8s', zIndex: 3 }}>
        <div style={{ background: 'rgba(13,13,24,0.88)', border: '0.5px solid rgba(127,119,221,0.3)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(127,119,221,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', display: 'inline-block', boxShadow: '0 0 6px #1D9E75' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
              {onlineCount > 0 ? onlineCount : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>онлайн сейчас</div>
          </div>
        </div>
      </div>

      {/* Badge 3 — Freelancers */}
      <div style={{ position: 'absolute', bottom: '28%', left: '6%', animation: 'authFloat 3.8s ease-in-out infinite 1.2s', zIndex: 3 }}>
        <div style={{ background: 'rgba(13,13,24,0.88)', border: '0.5px solid rgba(127,119,221,0.25)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(127,119,221,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-users" style={{ fontSize: 16, color: '#7F77DD' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
              {freelancers > 0 ? `${freelancers}+` : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>фрилансеров</div>
          </div>
        </div>
      </div>

      {/* Badge 4 — Completed projects */}
      <div style={{ position: 'absolute', bottom: '22%', right: '6%', animation: 'authFloat2 4.2s ease-in-out infinite 0.4s', zIndex: 3 }}>
        <div style={{ background: 'rgba(13,13,24,0.88)', border: '0.5px solid rgba(239,159,39,0.3)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,159,39,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-circle-check" style={{ fontSize: 16, color: '#EF9F27' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
              {completed > 0 ? `${completed}+` : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>завершено проектов</div>
          </div>
        </div>
      </div>

      {/* Bottom tagline */}
      <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, textAlign: 'center', zIndex: 2 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>
          {locations.length > 0 ? `${locations.length} пользователей на карте` : 'Фриланс-платформа нового поколения'}
        </p>
      </div>
    </div>
  )
}
