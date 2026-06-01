import { useEffect, useState } from 'react'
import useThemeStore from '../store/themeStore'
import { adminApi } from '../api/admin'
import useToastStore from '../store/toastStore'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Avatar from '../components/Avatar'
import Tag from '../components/Tag'
import Button from '../components/Button'

const TABS = ['Статистика', 'Пользователи', 'Кошельки', 'Споры', 'Жалобы']

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
          {tab === 2 && <WalletTab />}
          {tab === 3 && <DisputesTab />}
          {tab === 4 && <ReportsTab />}
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
    { icon: 'wallet', label: 'Выплачено ($)', value: '$' + Number(stats.total_released || 0).toLocaleString(), color: 'var(--accent-green)' },
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

const ROLE_LABELS = { client: 'Заказчик', freelancer: 'Фрилансер', admin: 'Администратор' }

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(null)
  const toast = useToastStore(s => s.show)

  const load = () => {
    setLoading(true)
    adminApi.getUsers().then(r => setUsers(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const action = async (fn, id, key, successMsg) => {
    setActioning(id + key)
    try {
      await fn(id)
      toast(successMsg || 'Выполнено', 'success')
      load()
    } catch (e) {
      toast(e?.response?.data?.detail || 'Ошибка', 'error')
    } finally {
      setActioning(null)
    }
  }

  const handleRoleChange = async (u, newRole) => {
    if (newRole === u.role) return
    if (!window.confirm(`Сменить роль пользователя "${u.full_name}" на "${ROLE_LABELS[newRole]}"?`)) return
    setActioning(u.id + 'role')
    try {
      await adminApi.changeRole(u.id, newRole)
      toast(`Роль изменена на "${ROLE_LABELS[newRole]}"`, 'success')
      load()
    } catch (e) {
      toast(e?.response?.data?.detail || 'Ошибка смены роли', 'error')
    } finally {
      setActioning(null)
    }
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
            {['Пользователь', 'Роль', 'Email', 'Статус', 'Верификация', 'Действия'].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
              <td style={{ padding: '10px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar src={u.avatar_url} name={u.full_name} size={32} />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{u.full_name}</span>
                </div>
              </td>
              <td style={{ padding: '10px 16px' }}>
                <select
                  value={u.role}
                  disabled={actioning === u.id + 'role'}
                  onChange={e => handleRoleChange(u, e.target.value)}
                  style={{
                    background: 'var(--bg)', border: '0.5px solid var(--border)',
                    borderRadius: 8, padding: '4px 8px', fontSize: 12,
                    color: u.role === 'admin' ? '#F87171' : u.role === 'client' ? 'var(--accent)' : 'var(--accent-green)',
                    cursor: 'pointer', outline: 'none',
                  }}
                >
                  <option value="client">Заказчик</option>
                  <option value="freelancer">Фрилансер</option>
                  <option value="admin">Администратор</option>
                </select>
              </td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</td>
              <td style={{ padding: '10px 16px' }}>
                <Tag color={u.is_banned ? 'red' : 'green'}>{u.is_banned ? 'Заблокирован' : 'Активен'}</Tag>
              </td>
              <td style={{ padding: '10px 16px' }}>
                {u.is_verified
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--accent-green)' }}>
                      <i className="ti ti-rosette-discount-check" style={{ fontSize: 15 }} /> Верифицирован
                    </span>
                  : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                }
              </td>
              <td style={{ padding: '10px 16px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {u.role !== 'admin' && (
                    <>
                      <Button size="sm" variant={u.is_banned ? 'green' : 'danger'}
                        loading={actioning === u.id + 'ban'}
                        onClick={() => action(
                          u.is_banned ? adminApi.unbanUser : adminApi.banUser,
                          u.id, 'ban',
                          u.is_banned ? 'Пользователь разблокирован' : 'Пользователь заблокирован'
                        )}>
                        {u.is_banned ? 'Разблок.' : 'Блок.'}
                      </Button>
                      {!u.is_verified && (
                        <Button size="sm" variant="outline" icon="rosette-discount-check"
                          loading={actioning === u.id + 'verify'}
                          onClick={() => action(adminApi.verifyUser, u.id, 'verify', 'Пользователь верифицирован')}>
                          Верифицировать
                        </Button>
                      )}
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

function WalletTab() {
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToastStore(s => s.show)

  useEffect(() => { adminApi.getUsers().then(r => setUsers(r.data || [])).catch(() => {}) }, [])

  const handleTopup = async () => {
    if (!selected || !amount || !reason) return
    setLoading(true)
    try {
      const { data } = await adminApi.topupWallet(selected, parseFloat(amount), reason)
      toast(`Баланс пополнен. Новый баланс: $${Number(data.balance).toLocaleString()}`, 'success')
      setAmount(''); setReason(''); setSelected('')
    } catch (e) {
      toast(e?.response?.data?.detail || 'Ошибка пополнения', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 540 }}>
      <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
          <i className="ti ti-wallet" style={{ marginRight: 8, color: 'var(--accent-green)' }} />
          Пополнение кошелька пользователя
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Пользователь</label>
            <select value={selected} onChange={e => setSelected(e.target.value)} className="input" style={{ width: '100%' }}>
              <option value="">— Выберите пользователя —</option>
              {users.filter(u => u.role !== 'admin').map(u => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Сумма ($)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input" placeholder="500" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Причина</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="input" placeholder="Тестовое пополнение" style={{ width: '100%' }} />
          </div>
          <Button variant="green" icon="plus" loading={loading} onClick={handleTopup}>Пополнить</Button>
        </div>
      </div>
    </div>
  )
}

function DisputesTab() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(null)
  const toast = useToastStore(s => s.show)

  const load = () => { setLoading(true); adminApi.getDisputes().then(r => setDisputes(r.data || [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const action = async (fn, id, msg) => {
    setActioning(id)
    try { await fn(id); toast(msg, 'success'); load() } catch (e) { toast(e?.response?.data?.detail || 'Ошибка', 'error') } finally { setActioning(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {loading ? <Spinner /> : disputes.length === 0 ? (
        <Empty icon="ti-thumb-up" text="Активных споров нет" />
      ) : disputes.map(tx => (
        <div key={tx.id} style={{ background: 'var(--bg-card)', border: '0.5px solid rgba(239,159,39,0.25)', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Транзакция · {tx.id.slice(0, 8)}...</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#EF9F27' }}>${Number(tx.amount).toLocaleString()}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(tx.created_at).toLocaleDateString('ru-RU')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="green" size="sm" icon="arrow-right" loading={actioning === tx.id + 'rel'} onClick={() => action(adminApi.releaseDispute, tx.id, 'Выплата выполнена')}>
              Выплатить фрилансеру
            </Button>
            <Button variant="danger" size="sm" icon="arrow-back-up" loading={actioning === tx.id + 'ref'} onClick={() => action(adminApi.refundDispute, tx.id, 'Возврат выполнен')}>
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
  const toast = useToastStore(s => s.show)

  const load = () => { setLoading(true); adminApi.getReports().then(r => setReports(r.data || [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const resolve = async (id) => {
    setActioning(id)
    try { await adminApi.resolveReport(id); toast('Жалоба отмечена решённой', 'success'); load() }
    catch (e) { toast(e?.response?.data?.detail || 'Ошибка', 'error') }
    finally { setActioning(null) }
  }

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
