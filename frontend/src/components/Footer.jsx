import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      position: 'relative', zIndex: 2,
      borderTop: '0.5px solid var(--border)',
      padding: '40px 44px 32px',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
        gap: 40,
      }}>
        <div>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20,
            letterSpacing: '-0.5px', marginBottom: 12, color: 'var(--text-primary)',
          }}>
            work<span style={{ color: 'var(--accent)' }}>flow</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 220 }}>
            Фриланс-платформа с безопасной эскроу-оплатой и AI-ассистентом.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {['brand-telegram', 'brand-instagram', 'brand-github'].map((icon) => (
              <a key={icon} href="#" style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)',
                transition: 'background 0.2s, color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(127,119,221,0.15)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <i className={`ti ti-${icon}`} style={{ fontSize: 16 }} />
              </a>
            ))}
          </div>
        </div>

        {[
          {
            title: 'Платформа',
            links: [
              { to: '/projects', label: 'Проекты' },
              { to: '/freelancers', label: 'Фрилансеры' },
              { to: '/role', label: 'Зарегистрироваться' },
            ],
          },
          {
            title: 'Компания',
            links: [
              { to: '#', label: 'О нас' },
              { to: '#', label: 'Блог' },
              { to: '#', label: 'Карьера' },
            ],
          },
          {
            title: 'Поддержка',
            links: [
              { to: '#', label: 'Помощь' },
              { to: '#', label: 'Условия' },
              { to: '#', label: 'Конфиденциальность' },
            ],
          },
        ].map(({ title, links }) => (
          <div key={title}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
              {title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {links.map(({ to, label }) => (
                <Link key={label} to={to} style={{
                  fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="gradient-divider" style={{ margin: '32px 0 24px', maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 13, color: 'var(--text-muted)',
      }}>
        <span>© 2025 Workflow. Все права защищены.</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-shield-check" style={{ color: 'var(--accent-green)' }} />
          Эскроу-защита платежей
        </span>
      </div>
    </footer>
  )
}
