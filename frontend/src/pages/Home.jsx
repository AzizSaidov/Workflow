import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import { statsApi } from '../api/stats'
import { categoriesApi } from '../api/categories'
import StarBackground from '../components/StarBackground'
import Globe from '../components/Globe'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProjectCard from '../components/ProjectCard'
import FreelancerCard from '../components/FreelancerCard'
import Tag from '../components/Tag'

// --- Count-up hook ---
function useCountUp(target, duration = 1800, started = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!started || !target) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
      else setValue(target)
    }
    requestAnimationFrame(step)
  }, [target, started, duration])
  return value
}

// --- Stats block ---
function StatCard({ value, suffix = '', label, color = 'var(--accent)' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const display = useCountUp(value, 1600, visible)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800, letterSpacing: '-2px', color: 'var(--text-primary)', lineHeight: 1 }}>
        {display.toLocaleString()}<span style={{ color }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
    </div>
  )
}

// --- Category card ---
// cat.icon from DB is already a full class like "ti-code"
function CategoryCard({ cat, isDark }) {
  // Support both "ti-code" and just "code"
  const iconClass = cat.icon?.startsWith('ti-') ? cat.icon : `ti-${cat.icon || 'briefcase'}`
  return (
    <Link to={`/projects?category_id=${cat.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 16, padding: '22px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        cursor: 'pointer', textAlign: 'center',
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--border-hover)'
          e.currentTarget.style.transform = 'translateY(-5px)'
          e.currentTarget.style.boxShadow = isDark ? '0 12px 40px rgba(127,119,221,0.15)' : '0 8px 32px rgba(80,72,213,0.12)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: isDark ? 'rgba(127,119,221,0.12)' : 'rgba(80,72,213,0.09)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`ti ${iconClass}`} style={{ fontSize: 24, color: 'var(--accent)' }} />
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{cat.name}</span>
      </div>
    </Link>
  )
}

export default function Home() {
  const { isDark } = useThemeStore()
  const [stats, setStats] = useState(null)
  const [locations, setLocations] = useState([])
  const [categories, setCategories] = useState([])
  const [projects, setProjects] = useState([])
  const [freelancers, setFreelancers] = useState([])

  useEffect(() => {
    statsApi.getGlobal().then(r => setStats(r.data)).catch(() => {})
    statsApi.getUserLocations().then(r => setLocations(r.data)).catch(() => {})
    statsApi.getRecentProjects().then(r => setProjects(r.data?.slice(0, 6) || [])).catch(() => {})
    statsApi.getTopFreelancers().then(r => setFreelancers(r.data?.slice(0, 4) || [])).catch(() => {})
    categoriesApi.getAll().then(r => setCategories(r.data || [])).catch(() => {})
  }, [])

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="full" />
      <div className="glow-blob glow-1" />
      <div className="glow-blob glow-2" />

      <Navbar />

      {/* ===== HERO ===== */}
      <section style={{ position: 'relative', zIndex: 2, paddingTop: 120, paddingBottom: 80 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 40, minHeight: 480 }}>
          {/* Left */}
          <div style={{ flex: 1, maxWidth: 580 }}>
            <div className="animate-in" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 20, marginBottom: 24,
              background: isDark ? 'rgba(127,119,221,0.08)' : 'rgba(80,72,213,0.08)',
              border: `0.5px solid ${isDark ? 'rgba(127,119,221,0.22)' : 'rgba(80,72,213,0.22)'}`,
              fontSize: 13, fontWeight: 500, color: 'var(--accent)',
              animationDelay: '0.1s',
            }}>
              <span className="blink" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
              {locations.length > 0 ? `${locations.length} специалистов на платформе` : 'Платформа для фрилансеров Центральной Азии'}
            </div>

            <h1 className="animate-in" style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 58,
              letterSpacing: '-2.5px', lineHeight: 1.04, marginBottom: 20,
              color: 'var(--text-primary)',
              animationDelay: '0.2s',
            }}>
              Найди лучших<br />
              <span style={{
                background: isDark
                  ? 'linear-gradient(135deg, #7F77DD 0%, #5DCAA5 100%)'
                  : 'linear-gradient(135deg, #5048D5 0%, #0D9268 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>специалистов</span><br />
              для проекта
            </h1>

            <p className="animate-in" style={{
              fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36, maxWidth: 460, fontWeight: 300,
              animationDelay: '0.35s',
            }}>
              Эскроу-оплата, AI-ассистент и 3D-карта фрилансеров со всего мира. Начни за 5 минут.
            </p>

            <div className="animate-in" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animationDelay: '0.45s' }}>
              <Link to="/role">
                <button className="btn btn-primary btn-lg" style={{ gap: 8 }}>
                  <i className="ti ti-rocket" />
                  Начать бесплатно
                </button>
              </Link>
              <Link to="/projects">
                <button className="btn btn-outline btn-lg" style={{ gap: 8 }}>
                  <i className="ti ti-search" />
                  Найти работу
                </button>
              </Link>
            </div>

            <div className="animate-in" style={{ display: 'flex', gap: 28, marginTop: 36, animationDelay: '0.55s' }}>
              {[
                { icon: 'shield-check', label: 'Эскроу-защита', color: 'var(--accent-green)' },
                { icon: 'robot', label: 'AI-ассистент', color: 'var(--accent)' },
                { icon: 'bolt', label: 'Быстрый старт', color: '#EF9F27' },
              ].map(({ icon, label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <i className={`ti ti-${icon}`} style={{ fontSize: 16, color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Globe + floating badges */}
          <div className="animate-fade" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', animationDelay: '0.3s' }}>
            {/* Floating badge — top left */}
            <div style={{
              position: 'absolute', top: 40, left: -20, zIndex: 10,
              background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 12, padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(80,72,213,0.1)',
              animation: 'fadeInUp 0.5s ease both',
              animationDelay: '0.9s',
              whiteSpace: 'nowrap',
            }}>
              <i className="ti ti-star-filled" style={{ color: '#EF9F27', fontSize: 15 }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Рейтинг 5.0</span>
            </div>
            {/* Floating badge — bottom right */}
            <div style={{
              position: 'absolute', bottom: 60, right: -10, zIndex: 10,
              background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 12, padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(80,72,213,0.1)',
              animation: 'fadeInUp 0.5s ease both',
              animationDelay: '1.1s',
              whiteSpace: 'nowrap',
            }}>
              <i className="ti ti-shield-check" style={{ color: 'var(--accent-green)', fontSize: 15 }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Эскроу-защита</span>
            </div>
            {/* Glow ring */}
            <div style={{
              position: 'absolute', inset: '-20px',
              borderRadius: '50%',
              background: isDark
                ? 'radial-gradient(circle, rgba(127,119,221,0.12) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(80,72,213,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <Globe locations={locations} width={460} height={460} />
          </div>
        </div>
      </section>

      <div className="gradient-divider" style={{ position: 'relative', zIndex: 2 }} />

      {/* ===== STATS ===== */}
      <section style={{ position: 'relative', zIndex: 2, padding: '64px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {[
              { value: stats?.total_freelancers || 0, suffix: '+', label: 'Фрилансеров', color: 'var(--accent)' },
              { value: stats?.completed_projects || 0, suffix: '+', label: 'Проектов завершено', color: 'var(--accent-green)' },
              { value: stats?.total_clients || 0, suffix: '+', label: 'Заказчиков', color: '#EF9F27' },
              { value: Math.floor((stats?.total_paid_out || 0) / 1000), suffix: 'K TJS', label: 'Выплачено', color: 'var(--accent-teal)' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '32px 24px', textAlign: 'center',
                borderRight: i < 3 ? '0.5px solid var(--border)' : 'none',
              }}>
                <StatCard {...s} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gradient-divider" style={{ position: 'relative', zIndex: 2 }} />

      {/* ===== CATEGORIES ===== */}
      <section style={{ position: 'relative', zIndex: 2, padding: '72px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Tag color="purple" style={{ marginBottom: 16 }}>Категории</Tag>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 38, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: 12 }}>
              Найди нужного специалиста
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 300 }}>
              {categories.length || 10} категорий · Сотни навыков
            </p>
          </div>

          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
            {categories.length > 0
              ? categories.map(cat => <CategoryCard key={cat.id} cat={cat} isDark={isDark} />)
              : Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ height: 110, borderRadius: 16 }} className="skeleton" />
              ))
            }
          </div>
        </div>
      </section>

      {/* ===== RECENT PROJECTS ===== */}
      {projects.length > 0 && (
        <section style={{ position: 'relative', zIndex: 2, padding: '72px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
              <div>
                <Tag color="green" style={{ marginBottom: 12 }}>Свежие проекты</Tag>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)' }}>
                  Открытые проекты
                </h2>
              </div>
              <Link to="/projects">
                <button className="btn btn-outline btn-sm" style={{ gap: 6 }}>
                  Все проекты <i className="ti ti-arrow-right" />
                </button>
              </Link>
            </div>

            <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {projects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ===== TOP FREELANCERS ===== */}
      {freelancers.length > 0 && (
        <section style={{ position: 'relative', zIndex: 2, padding: '72px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
              <div>
                <Tag color="amber" style={{ marginBottom: 12 }}>Топ таланты</Tag>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)' }}>
                  Лучшие фрилансеры
                </h2>
              </div>
              <Link to="/freelancers">
                <button className="btn btn-outline btn-sm" style={{ gap: 6 }}>
                  Все таланты <i className="ti ti-arrow-right" />
                </button>
              </Link>
            </div>

            <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {freelancers.map(f => <FreelancerCard key={f.user_id} freelancer={f} />)}
            </div>
          </div>
        </section>
      )}

      {/* ===== HOW ESCROW WORKS ===== */}
      <section style={{ position: 'relative', zIndex: 2, padding: '72px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Tag color="green" style={{ marginBottom: 16 }}>Безопасно</Tag>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 38, fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)', marginBottom: 12 }}>
              Как работает эскроу
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 300, maxWidth: 460, margin: '0 auto' }}>
              Деньги защищены на каждом этапе. Фрилансер получает оплату только после приёмки работы.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 900, margin: '0 auto' }}>
            {[
              { step: '01', icon: 'lock', title: 'Заморозка средств', desc: 'Заказчик размещает проект и замораживает оплату на эскроу-счёте. Фрилансер видит, что деньги есть.', color: 'var(--accent)' },
              { step: '02', icon: 'code', title: 'Работа выполнена', desc: 'Фрилансер выполняет задание и сдаёт работу через платформу. Заказчик проверяет результат.', color: 'var(--accent-teal)' },
              { step: '03', icon: 'check', title: 'Выплата', desc: 'После подтверждения заказчик отпускает средства. Платформа удерживает 1% комиссии.', color: 'var(--accent-green)' },
            ].map(({ step, icon, title, desc, color }) => (
              <div key={step} style={{
                background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                borderRadius: 20, padding: '32px 28px',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 20, right: 24, fontFamily: 'Syne, sans-serif', fontSize: 48, fontWeight: 800, color, opacity: 0.06, lineHeight: 1 }}>
                  {step}
                </div>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <i className={`ti ti-${icon}`} style={{ fontSize: 24, color }} />
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, fontWeight: 300 }}>{desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/role">
              <button className="btn btn-primary btn-lg" style={{ gap: 8 }}>
                Начать бесплатно <i className="ti ti-arrow-right" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
