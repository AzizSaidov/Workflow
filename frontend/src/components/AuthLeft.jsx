import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Globe from './Globe'
import { statsApi } from '../api/stats'

function Badge({ style, iconBg, icon, iconColor, top, value, label, animStyle }) {
  return (
    <div style={{ position: 'absolute', ...style, zIndex: 3, animation: animStyle }}>
      <div style={{
        background: 'rgba(10,10,20,0.9)',
        border: `0.5px solid ${iconBg}40`,
        borderRadius: 14, padding: '10px 16px',
        backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${iconBg}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            {value}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 3, whiteSpace: 'nowrap' }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthLeft({ isDark }) {
  const [locations, setLocations] = useState([])
  const [stats, setStats] = useState(null)
  const [onlineCount, setOnlineCount] = useState(null)

  useEffect(() => {
    statsApi.getUserLocations().then(r => setLocations(r.data || [])).catch(() => {})
    statsApi.getGlobal().then(r => setStats(r.data)).catch(() => {})
    statsApi.getOnlineCount().then(r => setOnlineCount(r.data?.count ?? 0)).catch(() => {})
  }, [])

  const freelancers = stats?.total_freelancers ?? null
  const completed = stats?.completed_projects ?? null

  return (
    <div style={{
      width: '52%', minHeight: '100vh', position: 'relative',
      background: 'linear-gradient(160deg, #0A0A18 0%, #0D0D22 55%, #06060F 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: '12%', left: '18%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.16) 0%, transparent 70%)', animation: 'authPulse 4s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '18%', right: '12%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,0.12) 0%, transparent 70%)', animation: 'authPulse 5s ease-in-out infinite 1.5s', pointerEvents: 'none' }} />

      <style>{`
        @keyframes authPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.2);opacity:1} }
        @keyframes authFloat  { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
        @keyframes authFloat2 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-7px)} }
      `}</style>

      {/* Logo */}
      <div style={{ position: 'absolute', top: 32, left: 36, zIndex: 4 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px', color: '#fff' }}>
            work<span style={{ color: '#7F77DD' }}>flow</span>
          </span>
        </Link>
      </div>

      {/* Globe — no legend */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'absolute', inset: -24, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <Globe locations={locations} width={380} height={380} showLegend={false} />
      </div>

      {/* Badge 1 — Escrow 99% */}
      <Badge
        style={{ top: '17%', right: '7%' }}
        animStyle="authFloat 3.5s ease-in-out infinite"
        iconBg="#5DCAA5"
        icon={<i className="ti ti-shield-check" style={{ fontSize: 17, color: '#5DCAA5' }} />}
        value="99%"
        label="эскроу фрилансеру"
      />

      {/* Badge 2 — Online */}
      <Badge
        style={{ top: '27%', left: '4%' }}
        animStyle="authFloat2 4s ease-in-out infinite 0.8s"
        iconBg="#7F77DD"
        icon={<span style={{ width: 9, height: 9, borderRadius: '50%', background: '#1D9E75', display: 'inline-block', boxShadow: '0 0 8px #1D9E75' }} />}
        value={onlineCount !== null ? String(onlineCount) : '…'}
        label="онлайн сейчас"
      />

      {/* Badge 3 — Freelancers */}
      <Badge
        style={{ bottom: '27%', left: '5%' }}
        animStyle="authFloat 3.8s ease-in-out infinite 1.2s"
        iconBg="#7F77DD"
        icon={<i className="ti ti-users" style={{ fontSize: 17, color: '#7F77DD' }} />}
        value={freelancers !== null ? `${freelancers}+` : '…'}
        label="фрилансеров"
      />

      {/* Badge 4 — Completed */}
      <Badge
        style={{ bottom: '20%', right: '5%' }}
        animStyle="authFloat2 4.2s ease-in-out infinite 0.4s"
        iconBg="#EF9F27"
        icon={<i className="ti ti-circle-check" style={{ fontSize: 17, color: '#EF9F27' }} />}
        value={completed !== null ? `${completed}+` : '…'}
        label="завершено проектов"
      />
    </div>
  )
}
