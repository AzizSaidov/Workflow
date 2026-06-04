import { useEffect, useState, useCallback, useRef } from 'react'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import { adminApi } from '../api/admin'
import useToastStore from '../store/toastStore'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Avatar from '../components/Avatar'
import Tag from '../components/Tag'
import Button from '../components/Button'

const NAV_ITEMS = [
  { key: 'stats',    icon: 'chart-bar',       label: 'Обзор' },
  { key: 'users',    icon: 'users',            label: 'Пользователи' },
  { key: 'wallets',  icon: 'wallet',           label: 'Кошельки' },
  { key: 'disputes', icon: 'alert-triangle',   label: 'Споры' },
  { key: 'reports',  icon: 'flag',             label: 'Жалобы' },
]

const ROLE_COLORS = { client: 'var(--accent)', freelancer: 'var(--accent-green)', admin: '#F87171' }
const ROLE_LABELS = { client: 'Заказчик', freelancer: 'Фрилансер', admin: 'Администратор' }
const isAdminUser = (u) => u?.is_admin || u?.role === 'admin'

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
      <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function Empty({ icon, text, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '72px 0' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
        background: 'rgba(127,119,221,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={`ti ti-${icon}`} style={{ fontSize: 28, color: 'var(--text-muted)', opacity: 0.4 }} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{text}</p>
      {sub && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

export default function AdminPanel() {
  const { isDark } = useThemeStore()
  const [section, setSection] = useState('stats')

  const SECTION_COMPONENTS = {
    stats:    <StatsSection />,
    users:    <UsersSection />,
    wallets:  <WalletsSection />,
    disputes: <DisputesSection />,
    reports:  <ReportsSection />,
  }

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.25 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 80px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 100 }}>
            {/* Brand */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, padding: '0 4px',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(239,68,68,0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ti ti-shield-lock" style={{ fontSize: 20, color: '#F87171' }} />
              </div>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  Admin Panel
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Workflow</div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {NAV_ITEMS.map(item => {
                const active = section === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => setSection(item.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 12,
                      background: active ? (isDark ? 'rgba(127,119,221,0.14)' : 'rgba(80,72,213,0.09)') : 'transparent',
                      border: active ? '0.5px solid rgba(127,119,221,0.25)' : '0.5px solid transparent',
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: 14, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' } }}
                  >
                    <i className={`ti ti-${item.icon}`} style={{ fontSize: 17 }} />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* ── Main content ─────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {SECTION_COMPONENTS[section]}
          </div>

        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────── STATS ─────────────────────────────── */

function StatsSection() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getStats().then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { icon: 'users',            label: 'Пользователей',    value: stats.total_users,         color: 'var(--accent)',       bg: 'rgba(127,119,221,0.1)' },
    { icon: 'briefcase',        label: 'Проектов',         value: stats.total_projects,       color: 'var(--accent-teal)',  bg: 'rgba(93,202,165,0.1)' },
    { icon: 'circle-check',     label: 'Завершено',        value: stats.completed_projects,   color: 'var(--accent-green)', bg: 'rgba(29,158,117,0.1)' },
    { icon: 'alert-triangle',   label: 'Активных споров',  value: stats.active_disputes,      color: '#EF9F27',             bg: 'rgba(239,159,39,0.1)' },
    { icon: 'cash',             label: 'Выплачено ($)',    value: `$${Number(stats.total_released || 0).toLocaleString()}`, color: 'var(--accent-green)', bg: 'rgba(29,158,117,0.1)' },
  ] : []

  return (
    <div>
      <SectionHeader icon="chart-bar" title="Обзор платформы" sub="Ключевые показатели" />

      {loading ? <Spinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {cards.map(({ icon, label, value, color, bg }) => (
            <div key={label} style={{
              background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 18, padding: '22px 24px',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ti-${icon}`} style={{ fontSize: 18, color }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.3 }}>{label}</span>
              </div>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1,
                fontSize: String(value ?? '').length > 7 ? 18 : String(value ?? '').length > 5 ? 22 : 28,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {value ?? '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────── USERS ─────────────────────────────── */

function UsersSection() {
  const { user: me } = useAuthStore()
  const [users,         setUsers]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [actioning,     setActioning]     = useState(null)
  const [roleFilter,    setRoleFilter]    = useState('all')
  const [blockedFilter, setBlockedFilter] = useState(false)
  const toast = useToastStore(s => s.show)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.getUsers().then(r => setUsers(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const blockedCount = users.filter(u => u.is_banned).length

  const filtered = users.filter(u => {
    const matchSearch  = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole    = roleFilter === 'all'
      || (roleFilter === 'admin' ? isAdminUser(u) : u.role === roleFilter && !isAdminUser(u))
    const matchBlocked = !blockedFilter || u.is_banned
    return matchSearch && matchRole && matchBlocked
  })

  const doAction = async (fn, id, key, msg) => {
    setActioning(id + key)
    try {
      await fn(id)
      toast(msg, 'success')
      load()
    } catch (e) {
      toast(e?.response?.data?.detail || 'Ошибка', 'error')
    } finally {
      setActioning(null)
    }
  }

  const handleMakeAdmin = async (u) => {
    if (!window.confirm(`Назначить "${u.full_name}" администратором? Роль (${ROLE_LABELS[u.role]}) сохранится.`)) return
    setActioning(u.id + 'role')
    try {
      await adminApi.grantAdmin(u.id)
      toast(`${u.full_name} теперь администратор`, 'success')
      load()
    } catch (e) {
      toast(e?.response?.data?.detail || 'Ошибка', 'error')
    } finally { setActioning(null) }
  }

  const handleDemoteAdmin = async (u) => {
    if (!window.confirm(`Снять с "${u.full_name}" права администратора?`)) return
    setActioning(u.id + 'role')
    try {
      await adminApi.revokeAdmin(u.id)
      toast('Права администратора сняты', 'success')
      load()
    } catch (e) {
      toast(e?.response?.data?.detail || 'Ошибка', 'error')
    } finally { setActioning(null) }
  }

  return (
    <div>
      <SectionHeader icon="users" title="Пользователи" sub={`${users.length} зарегистрировано`} />

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="input"
            style={{ paddingLeft: 36, width: '100%' }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="input"
          style={{ minWidth: 150 }}
        >
          <option value="all">Все роли</option>
          <option value="client">Заказчики</option>
          <option value="freelancer">Фрилансеры</option>
          <option value="admin">Администраторы</option>
        </select>

        <button
          onClick={() => setBlockedFilter(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '0 16px', borderRadius: 10, height: 42,
            background: blockedFilter ? 'rgba(239,68,68,0.12)' : 'var(--bg-card)',
            border: blockedFilter ? '0.5px solid rgba(239,68,68,0.35)' : '0.5px solid var(--border)',
            color: blockedFilter ? '#F87171' : 'var(--text-muted)',
            fontSize: 13, fontWeight: blockedFilter ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
        >
          <i className="ti ti-lock" style={{ fontSize: 14 }} />
          Заблокированные
          {blockedCount > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 6,
              background: blockedFilter ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
              color: blockedFilter ? '#F87171' : 'var(--text-muted)',
            }}>{blockedCount}</span>
          )}
        </button>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <Empty icon="user-off" text="Пользователи не найдены" sub={search ? 'Попробуйте другой запрос' : undefined} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(u => (
            <UserCard
              key={u.id}
              u={u}
              actioning={actioning}
              onBan={() => doAction(adminApi.banUser, u.id, 'ban', 'Пользователь заблокирован')}
              onUnban={() => doAction(adminApi.unbanUser, u.id, 'unban', 'Пользователь разблокирован')}
              onVerify={() => doAction(adminApi.verifyUser, u.id, 'verify', 'Пользователь верифицирован')}
              onMakeAdmin={handleMakeAdmin}
              onDemoteAdmin={handleDemoteAdmin}
              isSelf={u.id === me?.id}

            />
          ))}
        </div>
      )}
    </div>
  )
}

function UserCard({ u, actioning, onBan, onUnban, onVerify, onMakeAdmin, onDemoteAdmin, isSelf }) {
  const { isDark } = useThemeStore()
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: u.is_banned
        ? '0.5px solid rgba(239,68,68,0.3)'
        : '0.5px solid var(--border)',
      borderRadius: 16, overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
        {/* Avatar + name */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar src={u.avatar_url} name={u.full_name} size={42} />
          {u.is_banned && (
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 16, height: 16, borderRadius: '50%',
              background: '#F87171', border: '2px solid var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-lock" style={{ fontSize: 8, color: '#fff' }} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: u.is_banned ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: u.is_banned ? 'line-through' : 'none' }}>
              {u.full_name}
            </span>
            {u.is_verified && (
              <i className="ti ti-rosette-discount-check" style={{ fontSize: 15, color: 'var(--accent-green)', flexShrink: 0 }} />
            )}
            {u.is_banned && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.12)', color: '#F87171', fontWeight: 600 }}>
                Заблокирован
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
        </div>

        {/* Role badges */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {u.role !== 'admin' && (
            <div style={{
              padding: '4px 10px', borderRadius: 8,
              background: `${ROLE_COLORS[u.role]}18`,
              color: ROLE_COLORS[u.role],
              fontSize: 12, fontWeight: 600,
            }}>
              {ROLE_LABELS[u.role]}
            </div>
          )}
          {isAdminUser(u) && (
            <div style={{
              padding: '4px 10px', borderRadius: 8,
              background: 'rgba(239,68,68,0.12)', color: '#F87171',
              fontSize: 12, fontWeight: 600,
            }}>
              Администратор
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '4px 6px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <i className={`ti ti-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: 16 }} />
        </button>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div style={{
          borderTop: '0.5px solid var(--border)',
          padding: '12px 18px',
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
          display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
        }}>

          {/* Grant admin (only for non-admins) */}
          {!isAdminUser(u) && (
            <Button size="sm" variant="outline" icon="shield"
              loading={actioning === u.id + 'role'}
              onClick={() => onMakeAdmin(u)}>
              Назначить администратором
            </Button>
          )}

          {/* Revoke admin — скрыто для себя */}
          {isAdminUser(u) && !isSelf && (
            <Button size="sm" variant="danger" icon="shield-off"
              loading={actioning === u.id + 'role'}
              onClick={() => onDemoteAdmin(u)}>
              Снять администратора
            </Button>
          )}
          {isAdminUser(u) && isSelf && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Нельзя снять себя
            </span>
          )}

          <div style={{ flex: 1 }} />

          {/* Verify (only non-admins) */}
          {!u.is_verified && !isAdminUser(u) && (
            <Button size="sm" variant="outline" icon="rosette-discount-check"
              loading={actioning === u.id + 'verify'}
              onClick={onVerify}>
              Верифицировать
            </Button>
          )}

          {/* Ban / Unban (only non-admins) */}
          {!isAdminUser(u) && (
            u.is_banned ? (
              <Button size="sm" variant="green" icon="lock-open"
                loading={actioning === u.id + 'unban'}
                onClick={onUnban}>
                Разблокировать
              </Button>
            ) : (
              <Button size="sm" variant="danger" icon="lock"
                loading={actioning === u.id + 'ban'}
                onClick={onBan}>
                Заблокировать
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}

/* ───────────────────────────── WALLETS ─────────────────────────────── */

function WalletsSection() {
  const { isDark } = useThemeStore()
  const [users,        setUsers]        = useState([])
  const [query,        setQuery]        = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [open,         setOpen]         = useState(false)
  const [amount,       setAmount]       = useState('')
  const [reason,       setReason]       = useState('')
  const [loading,      setLoading]      = useState(false)
  const toast    = useToastStore(s => s.show)
  const wrapRef  = useRef(null)

  useEffect(() => {
    adminApi.getUsers()
      .then(r => setUsers(r.data?.filter(u => u.role !== 'admin') || []))
      .catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const fn = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const filtered = query.trim()
    ? users.filter(u =>
        u.full_name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      )
    : users

  const pick = (u) => {
    setSelectedUser(u)
    setQuery(u.full_name)
    setOpen(false)
  }

  const clear = () => {
    setSelectedUser(null)
    setQuery('')
    setOpen(false)
  }

  const handleTopup = async () => {
    if (!selectedUser || !amount || !reason) return
    setLoading(true)
    try {
      const { data } = await adminApi.topupWallet(selectedUser.id, parseFloat(amount), reason)
      toast(`Готово! Новый баланс ${selectedUser.full_name}: $${Number(data.balance).toLocaleString()}`, 'success')
      setAmount('')
      setReason('')
      clear()
    } catch (e) {
      toast(e?.response?.data?.detail || 'Ошибка пополнения', 'error')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = selectedUser && amount && parseFloat(amount) > 0 && reason

  return (
    <div>
      <SectionHeader icon="wallet" title="Пополнение кошелька" sub="Зачисление средств пользователям" />

      <div style={{ maxWidth: 520 }}>
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: 20, padding: 28,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* User picker */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 7 }}>
                Пользователь
              </label>

              <div ref={wrapRef} style={{ position: 'relative' }}>
                {/* Input */}
                <div style={{ position: 'relative' }}>
                  <i className="ti ti-search" style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 15, color: 'var(--text-muted)', pointerEvents: 'none',
                  }} />
                  <input
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelectedUser(null); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    placeholder="Поиск по имени или email..."
                    className="input"
                    style={{ paddingLeft: 36, paddingRight: 36, width: '100%' }}
                  />
                  {query && (
                    <button
                      onClick={clear}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 4, display: 'flex',
                      }}
                    >
                      <i className="ti ti-x" style={{ fontSize: 14 }} />
                    </button>
                  )}
                </div>

                {/* Dropdown */}
                {open && filtered.length > 0 && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                    borderRadius: 12, overflow: 'hidden', zIndex: 100,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
                    maxHeight: 220, overflowY: 'auto',
                  }}>
                    {filtered.slice(0, 8).map((u, i) => (
                      <button
                        key={u.id}
                        onMouseDown={e => { e.preventDefault(); pick(u) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', width: '100%',
                          background: selectedUser?.id === u.id
                            ? (isDark ? 'rgba(127,119,221,0.12)' : 'rgba(80,72,213,0.07)')
                            : 'transparent',
                          border: 'none',
                          borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                        onMouseEnter={e => { if (selectedUser?.id !== u.id) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                        onMouseLeave={e => { if (selectedUser?.id !== u.id) e.currentTarget.style.background = 'transparent' }}
                      >
                        <Avatar src={u.avatar_url} name={u.full_name} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.full_name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600, flexShrink: 0,
                          background: `${ROLE_COLORS[u.role]}18`, color: ROLE_COLORS[u.role],
                        }}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {open && query && filtered.length === 0 && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                    borderRadius: 12, padding: '16px', zIndex: 100,
                    fontSize: 13, color: 'var(--text-muted)', textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
                  }}>
                    Никого не найдено
                  </div>
                )}
              </div>
            </div>

            {/* Selected user card */}
            {selectedUser && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(127,119,221,0.07)', border: '0.5px solid rgba(127,119,221,0.2)',
              }}>
                <Avatar src={selectedUser.avatar_url} name={selectedUser.full_name} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedUser.full_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {selectedUser.email} ·{' '}
                    <span style={{ color: ROLE_COLORS[selectedUser.role] }}>
                      {ROLE_LABELS[selectedUser.role]}
                    </span>
                  </div>
                </div>
                <i className="ti ti-circle-check" style={{ fontSize: 20, color: 'var(--accent-green)' }} />
              </div>
            )}

            {/* Amount */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 7 }}>
                Сумма ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="500"
                min="1"
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Reason */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 7 }}>
                Причина
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Тестовое пополнение"
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            <Button
              variant="green"
              icon="plus"
              loading={loading}
              onClick={handleTopup}
              style={{ width: '100%', marginTop: 4 }}
            >
              Пополнить{amount ? ` на $${amount}` : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── DISPUTES ─────────────────────────────── */

function DisputesSection() {
  const [disputes, setDisputes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [actioning, setActioning] = useState(null)
  const toast = useToastStore(s => s.show)

  const load = () => {
    setLoading(true)
    adminApi.getDisputes().then(r => setDisputes(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const doAction = async (fn, id, key, msg) => {
    setActioning(id + key)
    try { await fn(id); toast(msg, 'success'); load() }
    catch (e) { toast(e?.response?.data?.detail || 'Ошибка', 'error') }
    finally { setActioning(null) }
  }

  return (
    <div>
      <SectionHeader icon="alert-triangle" title="Споры" sub={disputes.length > 0 ? `${disputes.length} требуют рассмотрения` : 'Активных споров нет'} />

      {loading ? <Spinner /> : disputes.length === 0 ? (
        <Empty icon="thumb-up" text="Споров нет" sub="Все конфликты разрешены" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {disputes.map(tx => (
            <div key={tx.id} style={{
              background: 'var(--bg-card)',
              border: '0.5px solid rgba(239,159,39,0.25)',
              borderRadius: 18, padding: '22px 24px',
              display: 'flex', gap: 20, alignItems: 'center',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: 'rgba(239,159,39,0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ti ti-alert-triangle" style={{ fontSize: 22, color: '#EF9F27' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Транзакция #{tx.id.slice(0, 8)}
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#EF9F27', letterSpacing: '-0.5px' }}>
                  ${Number(tx.amount).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {new Date(tx.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="green" size="sm" icon="arrow-right"
                  loading={actioning === tx.id + 'rel'}
                  onClick={() => doAction(adminApi.releaseDispute, tx.id, 'rel', 'Выплата выполнена')}>
                  Фрилансеру
                </Button>
                <Button variant="danger" size="sm" icon="arrow-back-up"
                  loading={actioning === tx.id + 'ref'}
                  onClick={() => doAction(adminApi.refundDispute, tx.id, 'ref', 'Возврат выполнен')}>
                  Вернуть
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────── REPORTS ─────────────────────────────── */

function ReportsSection() {
  const [reports, setReports]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [actioning, setActioning] = useState(null)
  const [filter, setFilter]       = useState('open')
  const toast = useToastStore(s => s.show)

  const load = () => {
    setLoading(true)
    adminApi.getReports().then(r => setReports(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const resolve = async (id) => {
    setActioning(id)
    try { await adminApi.resolveReport(id); toast('Жалоба закрыта', 'success'); load() }
    catch (e) { toast(e?.response?.data?.detail || 'Ошибка', 'error') }
    finally { setActioning(null) }
  }

  const filtered = reports.filter(r => filter === 'all' ? true : filter === 'open' ? r.status !== 'resolved' : r.status === 'resolved')
  const openCount = reports.filter(r => r.status !== 'resolved').length

  return (
    <div>
      <SectionHeader icon="flag" title="Жалобы" sub={openCount > 0 ? `${openCount} открытых` : 'Открытых жалоб нет'} />

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[
          { key: 'open',     label: 'Открытые', count: openCount },
          { key: 'resolved', label: 'Закрытые', count: reports.length - openCount },
          { key: 'all',      label: 'Все',       count: reports.length },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10, fontSize: 13,
            background: filter === f.key ? 'var(--accent)' : 'var(--bg-card)',
            border: filter === f.key ? '0.5px solid var(--accent)' : '0.5px solid var(--border)',
            color: filter === f.key ? '#fff' : 'var(--text-muted)',
            cursor: 'pointer', fontWeight: filter === f.key ? 600 : 400,
            transition: 'all 0.15s',
          }}>
            {f.label}
            <span style={{
              fontSize: 11, padding: '1px 6px', borderRadius: 6, fontWeight: 700,
              background: filter === f.key ? 'rgba(255,255,255,0.2)' : 'rgba(127,119,221,0.12)',
              color: filter === f.key ? '#fff' : 'var(--accent)',
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <Empty icon="flag-off" text="Жалоб нет" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(r => (
            <div key={r.id} style={{
              background: 'var(--bg-card)',
              border: `0.5px solid ${r.status === 'resolved' ? 'var(--border)' : 'rgba(239,68,68,0.22)'}`,
              borderRadius: 16, padding: '18px 22px',
              display: 'flex', alignItems: 'flex-start', gap: 16,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: r.status === 'resolved' ? 'rgba(29,158,117,0.1)' : 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`ti ti-${r.status === 'resolved' ? 'check' : 'flag'}`} style={{
                  fontSize: 18, color: r.status === 'resolved' ? 'var(--accent-green)' : '#F87171',
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 7, fontWeight: 600,
                    background: r.status === 'resolved' ? 'rgba(29,158,117,0.12)' : 'rgba(239,68,68,0.1)',
                    color: r.status === 'resolved' ? 'var(--accent-green)' : '#F87171',
                  }}>
                    {r.status === 'resolved' ? 'Закрыта' : 'Открыта'}
                  </span>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 7,
                    background: 'rgba(127,119,221,0.1)', color: 'var(--accent)',
                    fontWeight: 500,
                  }}>
                    {r.reason}
                  </span>
                </div>
                {r.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>{r.description}</p>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(r.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {r.status !== 'resolved' && (
                <Button variant="outline" size="sm" icon="check"
                  loading={actioning === r.id}
                  onClick={() => resolve(r.id)}>
                  Закрыть
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────── SHARED ─────────────────────────────── */

function SectionHeader({ icon, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 13,
        background: 'rgba(127,119,221,0.1)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={`ti ti-${icon}`} style={{ fontSize: 22, color: 'var(--accent)' }} />
      </div>
      <div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h1>
        {sub && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  )
}
