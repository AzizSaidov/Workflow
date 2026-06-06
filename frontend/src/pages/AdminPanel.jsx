import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import { adminApi } from '../api/admin'
import { siteSettingsApi } from '../api/siteSettings'
import useSiteStore from '../store/siteStore'
import useToastStore from '../store/toastStore'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Avatar from '../components/Avatar'
import Tag from '../components/Tag'
import Button from '../components/Button'

const NAV_ITEMS = [
  { key: 'stats',    icon: 'chart-bar',       label: 'Обзор' },
  { key: 'users',    icon: 'users',           label: 'Пользователи' },
  { key: 'projects', icon: 'briefcase',       label: 'Проекты' },
  { key: 'wallets',  icon: 'wallet',          label: 'Кошельки' },
  { key: 'finance',  icon: 'receipt',         label: 'Транзакции' },
  { key: 'disputes', icon: 'alert-triangle',  label: 'Споры' },
  { key: 'reports',  icon: 'flag',            label: 'Жалобы' },
  { key: 'audit',    icon: 'history',         label: 'Журнал' },
  { key: 'settings', icon: 'settings',        label: 'Настройки' },
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
    projects: <ProjectsSection />,
    wallets:  <WalletsSection />,
    finance:  <TransactionsSection />,
    disputes: <DisputesSection />,
    reports:  <ReportsSection />,
    audit:    <AuditSection />,
    settings: <SettingsSection />,
  }

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.25 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 80px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>

          <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 100 }}>
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
                      background: active ? (isDark ? 'rgba(127,119,221,0.14)' : 'rgba(59,91,219,0.09)') : 'transparent',
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

          <div style={{ flex: 1, minWidth: 0 }}>
            {SECTION_COMPONENTS[section]}
          </div>

        </div>
      </div>
    </div>
  )
}


function StatsSection() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getStats().then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { icon: 'users',          label: 'Пользователей',   value: stats.total_users,
      sub: `${stats.total_clients ?? 0} заказч. · ${stats.total_freelancers ?? 0} фрил.`, color: 'var(--accent)',       bg: 'rgba(127,119,221,0.1)' },
    { icon: 'briefcase',      label: 'Проектов',        value: stats.total_projects,
      sub: `${stats.open_projects ?? 0} открыто · ${stats.completed_projects ?? 0} завершено`, color: 'var(--accent-teal)',  bg: 'rgba(93,202,165,0.1)' },
    { icon: 'cash',           label: 'Выплачено',       value: `$${Number(stats.total_released || 0).toLocaleString()}`,
      sub: 'через эскроу', color: 'var(--accent-green)', bg: 'rgba(29,158,117,0.1)' },
    { icon: 'building-bank',  label: 'Доход платформы', value: `$${Number(stats.platform_revenue || 0).toLocaleString()}`,
      sub: 'комиссия', color: '#EF9F27', bg: 'rgba(239,159,39,0.1)' },
    { icon: 'alert-triangle', label: 'Активных споров', value: stats.active_disputes,
      sub: stats.banned_users ? `${stats.banned_users} забанено` : 'нет блокировок', color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
  ] : []

  return (
    <div>
      <SectionHeader icon="chart-bar" title="Обзор платформы" sub="Ключевые показатели и динамика" />

      {loading ? <Spinner /> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 20 }}>
            {cards.map(({ icon, label, value, sub, color, bg }) => (
              <div key={label} style={{
                background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                borderRadius: 18, padding: '20px 22px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ti-${icon}`} style={{ fontSize: 18, color }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.3 }}>{label}</span>
                </div>
                <div style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1,
                  fontSize: String(value ?? '').length > 7 ? 20 : 26,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {value ?? '—'}
                </div>
                {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                Динамика за 14 дней
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <Legend color="#7F77DD" label="Новые юзеры" />
                <Legend color="#5DCAA5" label="Новые проекты" />
              </div>
            </div>
            <AdminChart data={stats?.timeseries || []} />
          </div>
        </>
      )}
    </div>
  )
}


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
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
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

      {expanded && (
        <div style={{
          borderTop: '0.5px solid var(--border)',
          padding: '12px 18px',
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
          display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
        }}>

          {!isAdminUser(u) && (
            <Button size="sm" variant="outline" icon="shield"
              loading={actioning === u.id + 'role'}
              onClick={() => onMakeAdmin(u)}>
              Назначить администратором
            </Button>
          )}

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

          {!u.is_verified && !isAdminUser(u) && (
            <Button size="sm" variant="outline" icon="rosette-discount-check"
              loading={actioning === u.id + 'verify'}
              onClick={onVerify}>
              Верифицировать
            </Button>
          )}

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

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 7 }}>
                Пользователь
              </label>

              <div ref={wrapRef} style={{ position: 'relative' }}>
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
                            ? (isDark ? 'rgba(127,119,221,0.12)' : 'rgba(59,91,219,0.07)')
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

  const [banningId, setBanningId] = useState(null)
  const [banReason, setBanReason] = useState('')

  const banFromReport = async (report) => {
    setActioning(report.id)
    try {
      await adminApi.banUser(report.reported_user_id, banReason || 'Нарушение по жалобе')
      await adminApi.resolveReport(report.id)
      toast('Пользователь забанен, жалоба закрыта', 'success')
      setBanningId(null); setBanReason(''); load()
    } catch (e) { toast(e?.response?.data?.detail || 'Ошибка', 'error') }
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
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                  background: r.status === 'resolved' ? 'rgba(29,158,117,0.1)' : 'rgba(239,68,68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`ti ti-${r.status === 'resolved' ? 'check' : 'flag'}`} style={{
                    fontSize: 18, color: r.status === 'resolved' ? 'var(--accent-green)' : '#F87171',
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
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
                      background: 'rgba(127,119,221,0.1)', color: 'var(--accent)', fontWeight: 500,
                    }}>
                      {r.reason}
                    </span>
                  </div>
                  {r.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>{r.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Link to={`/profile/${r.reported_user_id}`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="ti ti-user" style={{ fontSize: 13 }} /> Нарушитель
                    </Link>
                    {r.project_id && (
                      <Link to={`/projects/${r.project_id}`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-briefcase" style={{ fontSize: 13 }} /> Проект
                      </Link>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(r.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                {r.status !== 'resolved' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    <Button variant="outline" size="sm" icon="ban"
                      onClick={() => { setBanningId(banningId === r.id ? null : r.id); setBanReason('') }}
                      style={{ borderColor: 'rgba(248,113,113,0.4)', color: '#F87171' }}>
                      Забанить
                    </Button>
                    <Button variant="outline" size="sm" icon="check"
                      loading={actioning === r.id && banningId !== r.id}
                      onClick={() => resolve(r.id)}>
                      Закрыть
                    </Button>
                  </div>
                )}
              </div>

              {banningId === r.id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '0.5px solid rgba(248,113,113,0.2)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input autoFocus value={banReason} onChange={e => setBanReason(e.target.value)}
                    placeholder="Причина бана (попадёт в журнал)…" className="input" style={{ flex: 1, minWidth: 220, fontSize: 13 }} />
                  <Button variant="primary" size="sm" icon="ban" loading={actioning === r.id}
                    onClick={() => banFromReport(r)} style={{ background: '#EF4444', borderColor: '#EF4444' }}>
                    Забанить и закрыть
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setBanningId(null); setBanReason('') }}>Отмена</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


function SettingsSection() {
  const toast           = useToastStore(s => s.show)
  const holidayMode     = useSiteStore(s => s.holidayMode)
  const setHolidayMode  = useSiteStore(s => s.setHolidayMode)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      const { data } = await siteSettingsApi.toggleHoliday()
      setHolidayMode(data.holiday_mode)
      toast(data.holiday_mode ? '❄ Новогодний режим включён' : 'Новогодний режим выключен', 'success')
    } catch {
      toast('Ошибка', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <SectionHeader icon="settings" title="Настройки сайта" sub="Глобальные параметры для всех пользователей" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>

        <div style={{
          background: holidayMode
            ? 'linear-gradient(135deg, rgba(127,119,221,0.1) 0%, rgba(93,202,165,0.08) 100%)'
            : 'var(--bg-card)',
          border: `0.5px solid ${holidayMode ? 'rgba(127,119,221,0.35)' : 'var(--border)'}`,
          borderRadius: 18, padding: '24px 28px',
          transition: 'all 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 15, fontSize: 26,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: holidayMode ? 'rgba(127,119,221,0.15)' : 'rgba(255,255,255,0.04)',
                border: '0.5px solid var(--border)',
                transition: 'all 0.3s',
              }}>
                {holidayMode ? '❄' : '🎄'}
              </div>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Новогодний режим
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {holidayMode
                    ? 'Включён — снежинки падают у всех пользователей'
                    : 'Выключен — праздничные эффекты не отображаются'}
                </div>
              </div>
            </div>

            <button
              onClick={toggle}
              disabled={loading}
              style={{
                position: 'relative', width: 52, height: 28, borderRadius: 14,
                background: holidayMode ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                border: `0.5px solid ${holidayMode ? 'var(--accent)' : 'var(--border)'}`,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.25s', flexShrink: 0, padding: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 3,
                left: holidayMode ? 26 : 3,
                width: 20, height: 20, borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.25s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10,
              }}>
                {loading && <i className="ti ti-loader-2" style={{ color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />}
              </div>
            </button>
          </div>

          {holidayMode && (
            <div style={{
              marginTop: 18, paddingTop: 16, borderTop: '0.5px solid rgba(127,119,221,0.2)',
              display: 'flex', gap: 8, flexWrap: 'wrap',
            }}>
              {['❄', '❅', '❆', '✦'].map(f => (
                <span key={f} style={{ fontSize: 20, opacity: 0.7 }}>{f}</span>
              ))}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 4 }}>
                30 снежинок активны для всех пользователей
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}


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

function Legend({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      {label}
    </span>
  )
}

function AdminChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Нет данных</div>
  }
  const W = 720, H = 180, padX = 10, padY = 18
  const n = data.length
  const maxVal = Math.max(1, ...data.map(d => Math.max(d.users || 0, d.projects || 0)))
  const x = i => padX + (i / Math.max(1, n - 1)) * (W - padX * 2)
  const y = v => H - padY - ((v || 0) / maxVal) * (H - padY * 2)
  const line = key => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(' ')
  const area = key => `${line(key)} L ${x(n - 1).toFixed(1)} ${(H - padY).toFixed(1)} L ${x(0).toFixed(1)} ${(H - padY).toFixed(1)} Z`
  const fmt = iso => { const dt = new Date(iso); return `${dt.getDate()}.${dt.getMonth() + 1}` }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="acU" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7F77DD" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7F77DD" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="acP" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5DCAA5" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#5DCAA5" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(g => (
        <line key={g} x1={padX} y1={padY + g * (H - padY * 2)} x2={W - padX} y2={padY + g * (H - padY * 2)}
          style={{ stroke: 'var(--border)' }} strokeWidth="1" />
      ))}
      <path d={area('users')} fill="url(#acU)" />
      <path d={area('projects')} fill="url(#acP)" />
      <path d={line('users')} fill="none" stroke="#7F77DD" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={line('projects')} fill="none" stroke="#5DCAA5" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(n - 1)} cy={y(data[n - 1].users)} r="3.5" fill="#7F77DD" />
      <circle cx={x(n - 1)} cy={y(data[n - 1].projects)} r="3.5" fill="#5DCAA5" />
      {data.map((d, i) => (i % 3 === 0 || i === n - 1) ? (
        <text key={i} x={x(i)} y={H - 3} fontSize="9" textAnchor="middle"
          style={{ fill: 'var(--text-muted)' }} fontFamily="DM Sans, sans-serif">{fmt(d.date)}</text>
      ) : null)}
    </svg>
  )
}


const PROJ_STATUS = {
  open:        { label: 'Открыт',   color: '#1D9E75',       bg: 'rgba(29,158,117,0.12)' },
  in_progress: { label: 'В работе', color: '#FBBF24',       bg: 'rgba(251,191,36,0.12)' },
  delivered:   { label: 'Сдан',     color: 'var(--accent)', bg: 'rgba(127,119,221,0.12)' },
  completed:   { label: 'Завершён', color: '#5DCAA5',       bg: 'rgba(93,202,165,0.12)' },
  disputed:    { label: 'Спор',     color: '#F87171',       bg: 'rgba(248,113,113,0.12)' },
  cancelled:   { label: 'Скрыт',    color: '#9CA3AF',       bg: 'rgba(156,163,175,0.12)' },
}

function ProjectsSection() {
  const [projects, setProjects]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actioning, setActioning]     = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const toast = useToastStore(s => s.show)

  const load = () => {
    setLoading(true)
    adminApi.getProjects().then(r => setProjects(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const hide = async (id) => {
    setActioning(id)
    try { await adminApi.hideProject(id); toast('Проект скрыт', 'success'); load() }
    catch (e) { toast(e?.response?.data?.detail || 'Ошибка', 'error') } finally { setActioning(null) }
  }
  const del = async (id) => {
    setActioning(id)
    try { await adminApi.deleteProject(id); toast('Проект удалён', 'info'); setConfirmDelete(null); load() }
    catch (e) { toast(e?.response?.data?.detail || 'Ошибка', 'error') } finally { setActioning(null) }
  }

  const filtered = projects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (search && !`${p.title} ${p.client_name}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <SectionHeader icon="briefcase" title="Проекты" sub={`Всего ${projects.length} · модерация контента`} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по названию или заказчику…" className="input" style={{ flex: 1, minWidth: 220, fontSize: 13 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input" style={{ fontSize: 13, maxWidth: 190 }}>
          <option value="all">Все статусы</option>
          {Object.entries(PROJ_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {loading ? <Spinner /> : filtered.length === 0 ? <Empty icon="briefcase-off" text="Проектов нет" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(p => {
            const s = PROJ_STATUS[p.status] || PROJ_STATUS.open
            return (
              <div key={p.id} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7, background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/projects/${p.id}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.title}
                  </Link>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {p.client_name} · ${Number(p.budget_min).toLocaleString()}–${Number(p.budget_max).toLocaleString()} · {p.bids_count} заявок
                  </div>
                </div>
                {confirmDelete === p.id ? (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Button variant="primary" size="sm" icon="trash" loading={actioning === p.id} onClick={() => del(p.id)} style={{ background: '#EF4444', borderColor: '#EF4444' }}>Точно удалить</Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Отмена</Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {p.status !== 'cancelled' && (
                      <Button variant="outline" size="sm" icon="eye-off" loading={actioning === p.id} onClick={() => hide(p.id)}>Скрыть</Button>
                    )}
                    <Button variant="outline" size="sm" icon="trash" onClick={() => setConfirmDelete(p.id)} style={{ borderColor: 'rgba(248,113,113,0.4)', color: '#F87171' }}>Удалить</Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


const TX_STATUS = {
  frozen:   { label: 'Эскроу',    color: '#EF9F27',             bg: 'rgba(239,159,39,0.14)' },
  released: { label: 'Выплачено', color: 'var(--accent-green)', bg: 'rgba(29,158,117,0.14)' },
  refunded: { label: 'Возврат',   color: 'var(--accent)',       bg: 'rgba(127,119,221,0.14)' },
  disputed: { label: 'Спор',      color: '#F87171',             bg: 'rgba(248,113,113,0.14)' },
}

function TransactionsSection() {
  const [txs, setTxs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    adminApi.getTransactions().then(r => setTxs(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? txs : txs.filter(t => t.status === filter)
  const turnover = txs.reduce((s, t) => s + Number(t.amount || 0), 0)

  return (
    <div>
      <SectionHeader icon="receipt" title="Транзакции" sub={`${txs.length} операций · оборот $${turnover.toLocaleString()}`} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {[['all', 'Все'], ['frozen', 'Эскроу'], ['released', 'Выплачено'], ['refunded', 'Возврат'], ['disputed', 'Спор']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: '7px 14px', borderRadius: 10, fontSize: 13,
            background: filter === k ? 'var(--accent)' : 'var(--bg-card)',
            border: filter === k ? '0.5px solid var(--accent)' : '0.5px solid var(--border)',
            color: filter === k ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: filter === k ? 600 : 400,
          }}>{l}</button>
        ))}
      </div>
      {loading ? <Spinner /> : filtered.length === 0 ? <Empty icon="receipt-off" text="Транзакций нет" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => {
            const s = TX_STATUS[t.status] || TX_STATUS.frozen
            return (
              <div key={t.id} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7, background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {t.project_id ? (
                    <Link to={`/projects/${t.project_id}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.project_title}</Link>
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t.project_title}</span>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.client_name} → {t.freelancer_name}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>${Number(t.amount).toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(t.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


const AUDIT_META = {
  ban_user:        { icon: 'ban',                     color: '#F87171',             label: 'Бан' },
  unban_user:      { icon: 'lock-open',               color: 'var(--accent-green)', label: 'Разбан' },
  verify_user:     { icon: 'rosette-discount-check',  color: 'var(--accent-teal)',  label: 'Верификация' },
  change_role:     { icon: 'user-edit',               color: 'var(--accent)',       label: 'Смена роли' },
  grant_admin:     { icon: 'shield-check',            color: '#EF9F27',             label: 'Выдан админ' },
  revoke_admin:    { icon: 'shield-off',              color: '#EF9F27',             label: 'Снят админ' },
  topup:           { icon: 'wallet',                  color: 'var(--accent-green)', label: 'Пополнение' },
  release_dispute: { icon: 'cash',                    color: 'var(--accent-green)', label: 'Спор: выплата' },
  refund_dispute:  { icon: 'arrow-back-up',           color: 'var(--accent)',       label: 'Спор: возврат' },
  resolve_report:  { icon: 'flag',                    color: 'var(--accent-green)', label: 'Жалоба закрыта' },
  hide_project:    { icon: 'eye-off',                 color: '#9CA3AF',             label: 'Проект скрыт' },
  delete_project:  { icon: 'trash',                   color: '#F87171',             label: 'Проект удалён' },
}

function AuditSection() {
  const [log, setLog]       = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    adminApi.getAuditLog().then(r => setLog(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <SectionHeader icon="history" title="Журнал действий" sub="Кто из админов что сделал" />
      {loading ? <Spinner /> : log.length === 0 ? <Empty icon="history" text="Журнал пуст" sub="Действия админов появятся здесь" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {log.map(e => {
            const m = AUDIT_META[e.action] || { icon: 'point', color: 'var(--text-muted)', label: e.action }
            return (
              <div key={e.id} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: 'rgba(127,119,221,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ti-${m.icon}`} style={{ fontSize: 16, color: m.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    <b style={{ fontWeight: 600 }}>{e.admin_name || 'Админ'}</b>
                    <span style={{ color: 'var(--text-muted)' }}> · {m.label}</span>
                    {e.target_name && <span style={{ color: 'var(--text-secondary)' }}> → {e.target_name}</span>}
                  </div>
                  {e.detail && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{e.detail}</div>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {new Date(e.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
