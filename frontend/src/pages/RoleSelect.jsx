import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import ThemeToggle from '../components/ThemeToggle'

export default function RoleSelect() {
  const navigate = useNavigate()
  const { isDark } = useThemeStore()
  const [hovered, setHovered] = useState(null)

  const choose = (role) => navigate('/register', { state: { role } })

  const textColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.75)'
  const textHover = '#fff'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* Logo + ThemeToggle + login — top bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px', color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
            work<span style={{ color: '#7F77DD' }}>flow</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ThemeToggle />
          <Link to="/login" style={{ fontSize: 13, color: textColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = textHover}
            onMouseLeave={e => e.currentTarget.style.color = textColor}
          >
            Уже есть аккаунт
            <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
          </Link>
        </div>
      </div>

      {/* Divider line */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: '50%', width: '0.5px',
        background: 'rgba(255,255,255,0.08)',
        zIndex: 5, pointerEvents: 'none',
        transform: `scaleX(${hovered ? 2 : 1})`,
        transition: 'transform 0.4s ease',
      }} />

      {/* Center badge */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 6, pointerEvents: 'none',
        background: 'rgba(13,13,24,0.9)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: '50%', width: 52, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 0 32px rgba(0,0,0,0.6)',
        fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
        letterSpacing: 0.5,
      }}>
        или
      </div>

      {/* CLIENT panel */}
      <Panel
        role="client"
        hovered={hovered}
        onHover={setHovered}
        onClick={() => choose('client')}
        bg={isDark
          ? 'linear-gradient(160deg, #0D0B1E 0%, #110F2A 40%, #0A0A18 100%)'
          : 'linear-gradient(160deg, #2D2880 0%, #3D37A0 40%, #252070 100%)'}
        accent="#7F77DD"
        accentRgb="127,119,221"
        icon="building"
        title="Я заказчик"
        subtitle="Нанимаю специалистов"
        desc="Размещаю проекты, выбираю лучших фрилансеров и оплачиваю через безопасное эскроу."
        features={[
          { icon: 'plus', text: 'Публикую проекты' },
          { icon: 'users', text: 'Выбираю из заявок' },
          { icon: 'shield-check', text: 'Эскроу-защита' },
          { icon: 'star', text: 'Отзывы и рейтинги' },
        ]}
        side="left"
      />

      {/* FREELANCER panel */}
      <Panel
        role="freelancer"
        hovered={hovered}
        onHover={setHovered}
        onClick={() => choose('freelancer')}
        bg={isDark
          ? 'linear-gradient(160deg, #071812 0%, #0A1F16 40%, #061210 100%)'
          : 'linear-gradient(160deg, #0D6B4E 0%, #0F8060 40%, #0A5540 100%)'}
        accent="#1D9E75"
        accentRgb="29,158,117"
        icon="code"
        title="Я фрилансер"
        subtitle="Нахожу проекты"
        desc="Ищу интересные задачи, подаю заявки и получаю гарантированную оплату за работу."
        features={[
          { icon: 'search', text: 'Нахожу проекты' },
          { icon: 'send', text: 'Подаю заявки' },
          { icon: 'briefcase', text: 'Портфолио и профиль' },
          { icon: 'wallet', text: 'Гарантированная оплата' },
        ]}
        side="right"
      />
    </div>
  )
}

function Panel({ role, hovered, onHover, onClick, bg, accent, accentRgb, icon, title, subtitle, desc, features, side }) {
  const isActive = hovered === role
  const isDimmed = hovered && hovered !== role

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover(role)}
      onMouseLeave={() => onHover(null)}
      style={{
        flex: 1, position: 'relative', cursor: 'pointer',
        background: bg, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'flex 0.5s cubic-bezier(0.4,0,0.2,1)',
        flex: isActive ? 1.15 : isDimmed ? 0.85 : 1,
      }}
    >
      {/* Animated glow */}
      <div style={{
        position: 'absolute',
        top: side === 'left' ? '20%' : '15%',
        left: side === 'left' ? '15%' : '20%',
        width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${accentRgb},${isActive ? 0.22 : 0.1}) 0%, transparent 65%)`,
        transition: 'opacity 0.4s',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%',
        right: side === 'left' ? '10%' : '15%',
        width: 280, height: 280, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${accentRgb},${isActive ? 0.12 : 0.05}) 0%, transparent 65%)`,
        transition: 'opacity 0.4s',
        pointerEvents: 'none',
      }} />

      {/* Overlay dim */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `rgba(0,0,0,${isDimmed ? 0.35 : 0})`,
        transition: 'background 0.4s',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
        padding: '0 48px', maxWidth: 420,
        transform: `translateY(${isActive ? -8 : 0}px)`,
        transition: 'transform 0.4s ease',
      }}>

        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 22,
          background: `rgba(${accentRgb},${isActive ? 0.2 : 0.12})`,
          border: `1px solid rgba(${accentRgb},${isActive ? 0.4 : 0.2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28,
          transition: 'all 0.3s',
          transform: `scale(${isActive ? 1.08 : 1})`,
          boxShadow: isActive ? `0 0 40px rgba(${accentRgb},0.25)` : 'none',
        }}>
          <i className={`ti ti-${icon}`} style={{ fontSize: 34, color: accent, transition: 'font-size 0.3s' }} />
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800,
          letterSpacing: '-1.5px', color: '#fff', lineHeight: 1,
          marginBottom: 8,
        }}>
          {title}
        </h2>
        <div style={{ fontSize: 14, color: `rgba(${accentRgb},0.9)`, fontWeight: 500, marginBottom: 18 }}>
          {subtitle}
        </div>

        {/* Description */}
        <p style={{
          fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7,
          fontWeight: 300, marginBottom: 32, maxWidth: 300,
        }}>
          {desc}
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 36, width: '100%', maxWidth: 280 }}>
          {features.map(({ icon: fi, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `rgba(${accentRgb},0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ti-${fi}`} style={{ fontSize: 13, color: accent }} />
              </div>
              {text}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '14px 32px', borderRadius: 14,
          background: isActive ? accent : `rgba(${accentRgb},0.15)`,
          border: `1px solid rgba(${accentRgb},${isActive ? 0 : 0.3})`,
          color: '#fff', fontSize: 15, fontWeight: 700,
          fontFamily: 'Syne, sans-serif', letterSpacing: '-0.3px',
          transition: 'all 0.3s',
          boxShadow: isActive ? `0 8px 30px rgba(${accentRgb},0.35)` : 'none',
        }}>
          <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
          Выбрать
        </div>
      </div>
    </div>
  )
}
