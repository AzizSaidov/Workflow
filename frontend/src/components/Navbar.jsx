import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import ThemeToggle from './ThemeToggle'
import Avatar from './Avatar'
import NotificationBell from './NotificationBell'

// Role-based nav config
function getNavLinks(user) {
  if (!user) {
    return [
      { to: '/projects', label: 'Найти работу', icon: 'briefcase' },
      { to: '/freelancers', label: 'Найти таланты', icon: 'users' },
    ]
  }
  if (user.role === 'client') {
    return [
      { to: '/', label: 'Главная', icon: 'home' },
      { to: '/dashboard', label: 'Мои проекты', icon: 'layout-dashboard' },
      { to: '/freelancers', label: 'Найти таланты', icon: 'users' },
      { to: '/chats', label: 'Чаты', icon: 'messages' },
    ]
  }
  if (user.role === 'freelancer') {
    return [
      { to: '/', label: 'Главная', icon: 'home' },
      { to: '/projects', label: 'Найти работу', icon: 'search' },
      { to: '/my-work', label: 'Мои работы', icon: 'briefcase' },
      { to: '/dashboard', label: 'Мои заявки', icon: 'layout-dashboard' },
      { to: '/chats', label: 'Чаты', icon: 'messages' },
    ]
  }
  if (user.role === 'admin') {
    return [
      { to: '/', label: 'Главная', icon: 'home' },
      { to: '/admin', label: 'Панель', icon: 'shield-lock' },
      { to: '/projects', label: 'Проекты', icon: 'briefcase' },
      { to: '/freelancers', label: 'Пользователи', icon: 'users' },
    ]
  }
  return []
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const { isDark } = useThemeStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const searchRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path) => path === '/'
    ? location.pathname === '/'
    : location.pathname === path || location.pathname.startsWith(path + '/')

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchVal.trim()) return
    navigate(`/projects?search=${encodeURIComponent(searchVal.trim())}`)
    setSearchVal('')
    setSearchOpen(false)
  }

  const navLinks = getNavLinks(user)

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px', height: 64,
      background: scrolled
        ? isDark ? 'rgba(7,7,14,0.95)' : 'rgba(248,247,255,0.96)'
        : isDark ? 'rgba(7,7,14,0.5)' : 'rgba(248,247,255,0.7)',
      borderBottom: scrolled
        ? isDark ? '0.5px solid rgba(255,255,255,0.07)' : '0.5px solid rgba(80,72,213,0.12)'
        : '0.5px solid transparent',
      backdropFilter: 'blur(18px)',
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <span style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20,
          letterSpacing: '-0.5px', color: 'var(--text-primary)',
        }}>
          work<span style={{ color: 'var(--accent)' }}>flow</span>
        </span>
      </Link>

      {/* Center nav */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {navLinks.map(({ to, label, icon }) => {
          const active = isActive(to)
          return (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, fontSize: 13.5, fontWeight: active ? 500 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? (isDark ? 'rgba(127,119,221,0.12)' : 'rgba(80,72,213,0.08)') : 'transparent',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <i className={`ti ti-${icon}`} style={{ fontSize: 15, color: active ? 'var(--accent)' : 'inherit' }} />
                {label}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
          {searchOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              border: '0.5px solid var(--border)', borderRadius: 8, padding: '4px 10px',
              transition: 'all 0.2s' }}>
              <input
                ref={searchRef}
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                onBlur={() => { if (!searchVal) setSearchOpen(false) }}
                placeholder="Поиск проектов…"
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  fontSize: 13, color: 'var(--text-primary)', width: 180,
                }}
              />
              <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <i className="ti ti-arrow-right" style={{ fontSize: 14, color: 'var(--accent)' }} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setSearchOpen(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 8px', borderRadius: 8, color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <i className="ti ti-search" style={{ fontSize: 18 }} />
            </button>
          )}
        </form>

        <ThemeToggle />

        {isAuthenticated() ? (
          <>
            <NotificationBell />

            {/* Client: create project CTA */}
            {user?.role === 'client' && (
              <Link to="/projects/new" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary btn-sm" style={{ fontSize: 12.5, padding: '6px 14px' }}>
                  <i className="ti ti-plus" style={{ fontSize: 13 }} />
                  Проект
                </button>
              </Link>
            )}

            {/* Avatar dropdown */}
            <div ref={menuRef} style={{ cursor: 'pointer', position: 'relative' }} onClick={() => setMenuOpen(!menuOpen)}>
              <Avatar src={user?.avatar_url} name={user?.full_name} size={34} online />

              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 44, right: 0,
                  background: 'var(--bg-card)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 14, padding: '6px 0',
                  minWidth: 200,
                  boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 40px rgba(0,0,0,0.12)',
                  zIndex: 200,
                }}>
                  {/* User info */}
                  <div style={{ padding: '10px 16px 12px', borderBottom: '0.5px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar src={user?.avatar_url} name={user?.full_name} size={36} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                          {user?.full_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {user?.role === 'client' ? 'Заказчик' : user?.role === 'freelancer' ? 'Фрилансер' : 'Администратор'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  {[
                    user?.role !== 'admin' && { to: `/profile/${user?.id}`, icon: 'user', label: 'Профиль' },
                    { to: '/dashboard', icon: 'layout-dashboard', label: 'Дашборд' },
                    { to: '/wallet', icon: 'wallet', label: 'Кошелёк' },
                    { to: '/favorites', icon: 'heart', label: 'Избранное' },
                    { to: '/ai', icon: 'robot', label: 'AI-ассистент' },
                    user?.role === 'admin' && { to: '/admin', icon: 'shield-lock', label: 'Панель админа' },
                  ].filter(Boolean).map(({ to, icon, label }) => (
                    <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 16px', fontSize: 13.5,
                      color: 'var(--text-secondary)', textDecoration: 'none',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(127,119,221,0.07)' : 'rgba(80,72,213,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <i className={`ti ti-${icon}`} style={{ fontSize: 15, color: 'var(--accent)' }} />
                      {label}
                    </Link>
                  ))}

                  <div style={{ borderTop: '0.5px solid var(--border)', marginTop: 4 }} />
                  <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 16px', fontSize: 13.5,
                    color: '#F87171', background: 'none', border: 'none', cursor: 'pointer',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <i className="ti ti-logout" style={{ fontSize: 15 }} />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="btn btn-outline btn-sm">Войти</button>
            </Link>
            <Link to="/role">
              <button className="btn btn-primary btn-sm">Начать</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
