import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { statsApi } from '../api/stats'
import { authApi } from '../api/auth'
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

function CategoryCard({ cat, isDark }) {
  const iconClass = cat.icon?.startsWith('ti-') ? cat.icon : `ti-${cat.icon || 'briefcase'}`
  return (
    <Link to={`/projects?category_id=${cat.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
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
        <div style={{ width: 52, height: 52, borderRadius: 14, background: isDark ? 'rgba(127,119,221,0.12)' : 'rgba(80,72,213,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ${iconClass}`} style={{ fontSize: 24, color: 'var(--accent)' }} />
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{cat.name}</span>
      </div>
    </Link>
  )
}

const SKILLS = ['React', 'Python', 'Figma', 'Node.js', 'Flutter', 'FastAPI', 'TypeScript', 'PostgreSQL', 'Vue.js', 'Docker', 'Swift', 'Go', 'Rust', 'Next.js', 'TailwindCSS', 'MongoDB', 'GraphQL', 'AWS', 'Kotlin', 'Unity']

function SkillMarquee({ isDark }) {
  const doubled = [...SKILLS, ...SKILLS]
  return (
    <div style={{ overflow: 'hidden', padding: '20px 0', position: 'relative', zIndex: 2 }}>
      <div style={{
        display: 'flex', gap: 10,
        animation: 'marquee 28s linear infinite',
        width: 'max-content',
      }}>
        {doubled.map((s, i) => (
          <div key={i} style={{
            padding: '6px 16px', borderRadius: 20,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: '0.5px solid var(--border)',
            fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {s}
          </div>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  )
}

export default function Home() {
  const { isDark } = useThemeStore()
  const { user, setUser } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [locations, setLocations] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [categories, setCategories] = useState([])
  const [projects, setProjects] = useState([])
  const [freelancers, setFreelancers] = useState([])

  useEffect(() => {
    statsApi.getGlobal().then(r => setStats(r.data)).catch(() => {})
    statsApi.getRecentProjects().then(r => setProjects(r.data?.slice(0, 6) || [])).catch(() => {})
    statsApi.getTopFreelancers().then(r => setFreelancers(r.data?.slice(0, 4) || [])).catch(() => {})
    categoriesApi.getAll().then(r => setCategories(r.data || [])).catch(() => {})
    Promise.all([
      statsApi.getUserLocations().catch(() => ({ data: [] })),
      statsApi.getOnlineCount().catch(() => ({ data: { count: 0 } })),
    ]).then(([locRes, onlineRes]) => {
      setOnlineCount(onlineRes.data?.count || 0)
      const locs = locRes.data || []
      const u = useAuthStore.getState().user
      if (u?.latitude && u?.longitude) {
        const withoutDupe = locs.filter(p =>
          !(Math.abs((p.lat || 0) - u.latitude) < 0.001 && Math.abs((p.lng || 0) - u.longitude) < 0.001)
        )
        setLocations([...withoutDupe, { lat: u.latitude, lng: u.longitude, role: 'me' }])
      } else {
        setLocations(locs)
      }
    })
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || user?.latitude || !navigator.geolocation) return
    const key = `geo-asked-${user.id}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        authApi.updateLocation(coords.latitude, coords.longitude).catch(() => {})
        setUser({ ...user, latitude: coords.latitude, longitude: coords.longitude })
      },
      () => {}
    )
  }, [user?.id])

  useEffect(() => {
    if (!user?.latitude || !user?.longitude) return
    setLocations(prev => {
      const withoutMe = prev.filter(p =>
        p.role !== 'me' &&
        !(Math.abs((p.lat || 0) - user.latitude) < 0.001 && Math.abs((p.lng || 0) - user.longitude) < 0.001)
      )
      return [...withoutMe, { lat: user.latitude, lng: user.longitude, role: 'me' }]
    })
  }, [user?.latitude, user?.longitude])

  // Hero CTA by role
  const heroCTA = () => {
    if (!user) return (
      <>
        <Link to="/role"><button className="btn btn-primary btn-lg" style={{ gap: 8 }}><i className="ti ti-rocket" />Начать бесплатно</button></Link>
        <Link to="/projects"><button className="btn btn-outline btn-lg" style={{ gap: 8 }}><i className="ti ti-search" />Найти работу</button></Link>
      </>
    )
    if (user.role === 'client') return (
      <>
        <Link to="/projects/new"><button className="btn btn-primary btn-lg" style={{ gap: 8 }}><i className="ti ti-plus" />Создать проект</button></Link>
        <Link to="/freelancers"><button className="btn btn-outline btn-lg" style={{ gap: 8 }}><i className="ti ti-users" />Найти таланты</button></Link>
      </>
    )
    if (user.role === 'freelancer') return (
      <>
        <Link to="/projects"><button className="btn btn-primary btn-lg" style={{ gap: 8 }}><i className="ti ti-search" />Найти работу</button></Link>
        <Link to="/my-work"><button className="btn btn-outline btn-lg" style={{ gap: 8 }}><i className="ti ti-briefcase" />Мои работы</button></Link>
      </>
    )
    return null
  }

  const heroTitle = () => {
    if (user?.role === 'client') return <><span className="text-gradient">Найди лучших</span><br />специалистов<br />для проекта</>
    if (user?.role === 'freelancer') return <>Найди лучшие<br /><span className="text-gradient">проекты</span><br />для роста</>
    return <>Найди лучших<br /><span className="text-gradient">специалистов</span><br />для проекта</>
  }


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
              {onlineCount > 0 ? `${onlineCount} онлайн сейчас` : 'Global Freelance Platform'}
            </div>

            {user && (
              <div className="animate-in" style={{ marginBottom: 12, animationDelay: '0.15s' }}>
                <span style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                  С возвращением, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user.full_name?.split(' ')[0]}</span> 👋
                </span>
              </div>
            )}

            <h1 className="animate-in" style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 58,
              letterSpacing: '-2.5px', lineHeight: 1.04, marginBottom: 20,
              color: 'var(--text-primary)', animationDelay: '0.2s',
            }}>
              {heroTitle()}
            </h1>

            <p className="animate-in" style={{
              fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36, maxWidth: 460, fontWeight: 300,
              animationDelay: '0.35s',
            }}>
              Эскроу-оплата, AI-ассистент и 3D-карта фрилансеров со всего мира. Начни за 5 минут.
            </p>

            <div className="animate-in" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animationDelay: '0.45s' }}>
              {heroCTA()}
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

          {/* Globe */}
          <div className="animate-fade" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', animationDelay: '0.3s' }}>
            <div style={{
              position: 'absolute', bottom: 60, right: -10, zIndex: 10,
              background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 12, padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(80,72,213,0.1)',
              animation: 'fadeInUp 0.5s ease both', animationDelay: '1.1s',
              whiteSpace: 'nowrap',
            }}>
              <i className="ti ti-shield-check" style={{ color: 'var(--accent-green)', fontSize: 15 }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Эскроу-защита</span>
            </div>
            <div style={{
              position: 'absolute', top: 30, left: -20, zIndex: 10,
              background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 12, padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(80,72,213,0.1)',
              animation: 'fadeInUp 0.5s ease both', animationDelay: '1.3s',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF4444', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Ваш город</span>
            </div>
            <div style={{ position: 'absolute', inset: '-20px', borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(127,119,221,0.12) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(80,72,213,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <Globe locations={locations} width={460} height={460} />
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <SkillMarquee isDark={isDark} />

      <div className="gradient-divider" style={{ position: 'relative', zIndex: 2 }} />

      {/* ===== STATS ===== */}
      <section style={{ position: 'relative', zIndex: 2, padding: '64px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {[
              { value: stats?.total_freelancers || 0, suffix: '+', label: 'Фрилансеров', color: 'var(--accent)' },
              { value: stats?.completed_projects || 0, suffix: '+', label: 'Проектов завершено', color: 'var(--accent-green)' },
              { value: stats?.total_clients || 0, suffix: '+', label: 'Заказчиков', color: '#EF9F27' },
              { value: Math.floor((stats?.total_paid_out || 0) / 1000), suffix: 'K$', label: 'Выплачено', color: 'var(--accent-teal)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '32px 24px', textAlign: 'center', borderRight: i < 3 ? '0.5px solid var(--border)' : 'none' }}>
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
              : Array.from({ length: 10 }).map((_, i) => <div key={i} style={{ height: 110, borderRadius: 16 }} className="skeleton" />)
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
              <div key={step} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 20, padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 20, right: 24, fontFamily: 'Syne, sans-serif', fontSize: 48, fontWeight: 800, color, opacity: 0.06, lineHeight: 1 }}>{step}</div>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <i className={`ti ti-${icon}`} style={{ fontSize: 24, color }} />
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, fontWeight: 300 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section style={{ position: 'relative', zIndex: 2, padding: '72px 0 80px' }}>
        <div className="container">
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
            maxWidth: 860, margin: '0 auto',
          }}>
            {/* For clients */}
            <div style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(127,119,221,0.13) 0%, rgba(13,13,24,0.95) 100%)'
                : 'linear-gradient(135deg, rgba(80,72,213,0.07) 0%, var(--bg-card) 100%)',
              border: '0.5px solid var(--border-hover)',
              borderRadius: 22, padding: '36px 32px',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(127,119,221,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-building" style={{ fontSize: 22, color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.5px' }}>
                  Ты заказчик?
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 300 }}>
                  Разместите проект и получите заявки от лучших специалистов уже сегодня.
                </p>
              </div>
              <Link to={user?.role === 'client' ? '/projects/new' : '/role'} style={{ marginTop: 'auto' }}>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <i className="ti ti-plus" style={{ fontSize: 14 }} />
                  {user?.role === 'client' ? 'Создать проект' : 'Стать заказчиком'}
                </button>
              </Link>
            </div>

            {/* For freelancers */}
            <div style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(29,158,117,0.1) 0%, rgba(13,13,24,0.95) 100%)'
                : 'linear-gradient(135deg, rgba(29,158,117,0.07) 0%, var(--bg-card) 100%)',
              border: '0.5px solid rgba(29,158,117,0.25)',
              borderRadius: 22, padding: '36px 32px',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(29,158,117,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-code" style={{ fontSize: 22, color: 'var(--accent-green)' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.5px' }}>
                  Ты фрилансер?
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 300 }}>
                  Найди проекты по своим навыкам и начни зарабатывать с эскроу-защитой.
                </p>
              </div>
              <Link to={user?.role === 'freelancer' ? '/projects' : '/role'} style={{ marginTop: 'auto' }}>
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(29,158,117,0.4)', color: 'var(--accent-green)' }}>
                  <i className="ti ti-search" style={{ fontSize: 14 }} />
                  {user?.role === 'freelancer' ? 'Найти проекты' : 'Стать фрилансером'}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
