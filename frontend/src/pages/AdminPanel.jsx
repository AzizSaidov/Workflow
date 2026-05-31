import { useEffect, useState } from 'react'
import useThemeStore from '../store/themeStore'
import { adminApi } from '../api/admin'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Avatar from '../components/Avatar'
import Tag from '../components/Tag'
import Button from '../components/Button'

const TABS = ['Статистика', 'Пользователи', 'Споры', 'Жалобы']

export default function AdminPanel() {
  const { isDark } = useThemeStore()
  const [tab, setTab] = useState(0)

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.3 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-shield-lock" style={{ fontSize: 22, color: '#F87171' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)' }}>
                Панель администратора
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Управление платформой</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} style={{
                padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                background: tab === i ? (i === 0 ? 'var(--accent)' : i === 3 ? '#F87171' : 'var(--accent)') : 'transparent',
                color: tab === i ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>
                {t}
              </button>
            ))}
          </div>

          {tab === 0 && <StatsTab />}
          {tab === 1 && <UsersTab />}
          {tab === 2 && <DisputesTab />}
          {tab === 3 && <ReportsTab />}
        </div>
      </div>

      <Footer />
    </div>
  )
}

function StatsTab() {
  const [stats, setStats] = useState(null)
  useEffect(() => { adminApi.getStats().then(r => setStats(r.data)).catch(() => {}) }, [])

  const items = stats ? [
    { icon: 'users', label: 'Всего пользователей', value: stats.total_users, color: 'var(--accent)' },
    { icon: 'briefcase', label: 'Всего проектов', value: stats.total_projects, color: 'var(--accent-teal)' },
    { icon: 'circle-check', label: 'Завершено', value: stats.completed_projects, color: 'var(--accent-green)' },
    { icon: 'alert-triangle', label: 'Активных споров', value: stats.active_disputes, color: '#EF9F27' },
    { icon: 'wallet', label: 'Выплачено (TJS)', value: Number(stats.total_released || 0).toLocaleString(), color: 'var(--accent-green)' },
  ] : []

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
      {items.map(({ icon, label, value, color }) => (
        <div key={label} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ti-${icon}`} style={{ fontSize: 17, color }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.3 }}>{label}</span>
          </div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value ?? '—'}</div>
        </div>
      ))}
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(null)

  const load = () => { setLoading(true); adminApi.getUsers().then(r => setUsers(r.data || [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const action = async (fn, id) => {
    setActioning(id)
    try { await fn(id); load() } finally { setActioning(null) }
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
            {['Пользователь', 'Роль', 'Email', 'Статус', 'Действия'].map(h => (
              <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
              <td style={{ padding: '12px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar src={u.avatar_url} name={u.full_name} size={34} />
                  <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{u.full_name}</span>
                </div>
              </td>
              <td style={{ padding: '12px 20px' }}>
                <Tag color={u.role === 'admin' ? 'red' : u.role === 'client' ? 'purple' : 'green'}>
                  {u.role === 'admin' ? 'Админ' : u.role === 'client' ? 'Заказчик' : 'Фрилансер'}
                </Tag>
              </td>
              <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</td>
              <td style={{ padding: '12px 20px' }}>
                <Tag color={u.is_banned ? 'red' : 'green'}>{u.is_banned ? 'Заблокирован' : 'Активен'}</Tag>
              </td>
              <td style={{ padding: '12px 20px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {u.role !== 'admin' && (
                    <>
                      <Button size="sm" variant={u.is_banned ? 'green' : 'danger'}
                        loading={actioning === u.id + 'ban'}
                        onClick={() => action(u.is_banned ? adminApi.unbanUser : adminApi.banUser, u.id)}>
                        {u.is_banned ? 'Разблокировать' : 'Заблокировать'}
                      </Button>
                      <Button size="sm" variant="outline" icon="rosette-discount-check"
                        loading={actioning === u.id + 'verify'}
                        onClick={() => action(adminApi.verifyUser, u.id)}>
                        Верифицировать
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <div style={{ padding: '30px', textAlign: 'center' }}><i className="ti ti-loader-2" style={{ fontSize: 24, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} /></div>}
    </div>
  )
}

function DisputesTab() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(null)

  const load = () => { setLoading(true); adminApi.getDisputes().then(r => setDisputes(r.data || [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const action = async (fn, id) => { setActioning(id); try { await fn(id); load() } finally { setActioning(null) } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {loading ? <Spinner /> : disputes.length === 0 ? (
        <Empty icon="ti-thumb-up" text="Активных споров нет" />
      ) : disputes.map(tx => (
        <div key={tx.id} style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(239,159,39,0.25)', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Транзакция · {tx.id.slice(0, 8)}...</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#EF9F27' }}>{Number(tx.amount).toLocaleString()} TJS</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(tx.created_at).toLocaleDateString('ru-RU')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="green" size="sm" icon="arrow-right" loading={actioning === tx.id + 'rel'} onClick={() => action(adminApi.releaseDispute, tx.id)}>
              Выплатить фрилансеру
            </Button>
            <Button variant="danger" size="sm" icon="arrow-back-up" loading={actioning === tx.id + 'ref'} onClick={() => action(adminApi.refundDispute, tx.id)}>
              Вернуть заказчику
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReportsTab() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(null)

  const load = () => { setLoading(true); adminApi.getReports().then(r => setReports(r.data || [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const resolve = async (id) => { setActioning(id); try { await adminApi.resolveReport(id); load() } finally { setActioning(null) } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {loading ? <Spinner /> : reports.length === 0 ? (
        <Empty icon="ti-flag-off" text="Жалоб нет" />
      ) : reports.map(r => (
        <div key={r.id} style={{ background: 'var(--bg-card)', border: `0.5px solid ${r.status === 'resolved' ? 'var(--border)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Tag color={r.status === 'resolved' ? 'green' : 'red'}>{r.status === 'resolved' ? 'Решена' : 'Открыта'}</Tag>
              <Tag color="muted">{r.reason}</Tag>
            </div>
            {r.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.description}</p>}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{new Date(r.created_at).toLocaleString('ru-RU')}</div>
          </div>
          {r.status !== 'resolved' && (
            <Button variant="outline" size="sm" icon="check" loading={actioning === r.id} onClick={() => resolve(r.id)}>
              Решить
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

function Spinner() {
  return <div style={{ textAlign: 'center', padding: 40 }}><i className="ti ti-loader-2" style={{ fontSize: 28, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} /></div>
}

function Empty({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 44, color: 'var(--text-muted)', display: 'block', marginBottom: 14, opacity: 0.3 }} />
      <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{text}</p>
    </div>
  )
}
