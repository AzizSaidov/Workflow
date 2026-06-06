import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { walletApi } from '../api/wallet'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const FILTERS = [
  { key: 'all',      label: 'Все',        icon: 'layout-list' },
  { key: 'incoming', label: 'Пополнения', icon: 'arrow-down-left' },
  { key: 'outgoing', label: 'Списания',   icon: 'arrow-up-right' },
  { key: 'escrow',   label: 'Эскроу',     icon: 'lock' },
]

const STATUS_META = {
  frozen:   { label: 'Эскроу',    color: '#EF9F27',             bg: 'rgba(239,159,39,0.14)' },
  released: { label: 'Выплачено', color: 'var(--accent-green)', bg: 'rgba(29,158,117,0.14)' },
  refunded: { label: 'Возврат',   color: 'var(--accent)',       bg: 'rgba(127,119,221,0.14)' },
  disputed: { label: 'Спор',      color: '#F87171',             bg: 'rgba(248,113,113,0.14)' },
}

function MiniAvatar({ src, name }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (src) return (
    <img src={src} alt={name} style={{
      width: 24, height: 24, borderRadius: '50%', objectFit: 'cover',
      border: '1.5px solid var(--border)', flexShrink: 0,
    }} />
  )
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(127,119,221,0.22)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: 9, fontWeight: 700, color: 'var(--accent)',
      border: '1.5px solid var(--border)',
    }}>{initials}</div>
  )
}

function AmountDisplay({ value, size = 56, prefix = '$', color = 'var(--text-primary)' }) {
  const num = Number(value || 0)
  const intPart = Math.floor(num).toLocaleString('ru-RU')
  const centPart = String(Math.round((num % 1) * 100)).padStart(2, '0')
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: size * 0.38, fontWeight: 700, color, lineHeight: 1 }}>{prefix}</span>
      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: size, fontWeight: 800, letterSpacing: '-3px', color, lineHeight: 1 }}>
        {intPart}
      </span>
      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: size * 0.42, fontWeight: 400, color: color === 'var(--text-primary)' ? 'var(--text-muted)' : color, opacity: 0.55, marginLeft: 1 }}>
        .{centPart}
      </span>
    </div>
  )
}

function StatCard({ icon, label, value, color, bg, borderColor, plain }) {
  const num = Number(value || 0)
  const intPart = Math.floor(num).toLocaleString('ru-RU')
  const centPart = String(Math.round((num % 1) * 100)).padStart(2, '0')
  return (
    <div style={{
      background: bg, border: `0.5px solid ${borderColor}`,
      borderRadius: 16, padding: '18px 22px', flex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: bg, border: `0.5px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`ti ti-${icon}`} style={{ fontSize: 16, color }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 500 }}>
          {label}
        </span>
      </div>
      {plain ? (
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color, lineHeight: 1 }}>
          {intPart}
        </span>
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color }}>$</span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color, lineHeight: 1 }}>{intPart}</span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 400, color, opacity: 0.5 }}>.{centPart}</span>
        </div>
      )}
    </div>
  )
}

function groupByDate(txs, fmtGroupLabel) {
  const groups = []
  const map = {}
  txs.forEach(tx => {
    const key = fmtGroupLabel(tx.created_at)
    if (!map[key]) { map[key] = []; groups.push(key) }
    map[key].push(tx)
  })
  return groups.map(k => ({ label: k, items: map[k] }))
}

export default function Wallet() {
  const { isDark } = useThemeStore()
  const { user }   = useAuthStore()

  const [wallet,       setWallet]       = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState('all')

  useEffect(() => {
    setLoading(true)
    Promise.all([walletApi.get(), walletApi.getTransactions()])
      .then(([w, t]) => {
        setWallet(w.data)
        setTransactions(t.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const COMMISSION = 0.01

  const getDir = (tx) => {
    const isClient = tx.client?.id === user?.id
    if (tx.status === 'frozen')   return 'frozen'
    if (tx.status === 'released') return isClient ? 'out' : 'in'
    if (tx.status === 'refunded') return isClient ? 'refund_in' : 'neutral'
    return 'neutral'
  }

  const getAmountInfo = (tx) => {
    const dir = getDir(tx)
    const amt = Number(tx.amount)
    if (dir === 'frozen')    return { prefix: '',  value: amt.toFixed(2), color: '#EF9F27',             sub: 'заморожено в проекте' }
    if (dir === 'in') {
      const net = (amt * (1 - COMMISSION)).toFixed(2)
      const fee = (amt * COMMISSION).toFixed(2)
      return { prefix: '+', value: net, color: 'var(--accent-green)', sub: `−$${fee} комиссия` }
    }
    if (dir === 'out')       return { prefix: '−', value: amt.toFixed(2), color: '#F87171', sub: null }
    if (dir === 'refund_in') return { prefix: '+', value: amt.toFixed(2), color: 'var(--accent-green)', sub: 'возврат средств' }
    return { prefix: '', value: amt.toFixed(2), color: 'var(--text-muted)', sub: null }
  }

  const getCounterparty = (tx) => {
    const isClient = tx.client?.id === user?.id
    return isClient
      ? { ...(tx.freelancer || {}), role: 'Исполнитель' }
      : { ...(tx.client    || {}), role: 'Заказчик' }
  }

  const getDirStyle = (dir) => {
    if (dir === 'frozen')    return { icon: 'lock',            bg: 'rgba(239,159,39,0.12)',   color: '#EF9F27' }
    if (dir === 'out')       return { icon: 'arrow-up-right',  bg: 'rgba(248,113,113,0.12)',  color: '#F87171' }
    if (dir === 'in')        return { icon: 'arrow-down-left', bg: 'rgba(29,158,117,0.12)',   color: 'var(--accent-green)' }
    if (dir === 'refund_in') return { icon: 'arrow-back-up',   bg: 'rgba(127,119,221,0.12)',  color: 'var(--accent)' }
    return                          { icon: 'minus',            bg: 'rgba(255,255,255,0.06)',  color: 'var(--text-muted)' }
  }

  const filteredTxs = transactions.filter(tx => {
    const dir = getDir(tx)
    if (filter === 'incoming') return dir === 'in' || dir === 'refund_in'
    if (filter === 'outgoing') return dir === 'out'
    if (filter === 'escrow')   return dir === 'frozen'
    return true
  })

  const filterCount = (key) => {
    if (key === 'all') return transactions.length
    return transactions.filter(tx => {
      const dir = getDir(tx)
      if (key === 'incoming') return dir === 'in' || dir === 'refund_in'
      if (key === 'outgoing') return dir === 'out'
      if (key === 'escrow')   return dir === 'frozen'
      return false
    }).length
  }

  const totalIncoming = transactions
    .filter(tx => { const d = getDir(tx); return d === 'in' || d === 'refund_in' })
    .reduce((s, tx) => s + Number(tx.amount) * (getDir(tx) === 'in' ? (1 - COMMISSION) : 1), 0)

  const totalOutgoing = transactions
    .filter(tx => getDir(tx) === 'out')
    .reduce((s, tx) => s + Number(tx.amount), 0)

  const fmtGroupLabel = (dt) => {
    if (!dt) return 'Ранее'
    const d = new Date(dt)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    const txDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (txDay.getTime() === today.getTime()) return 'Сегодня'
    if (txDay.getTime() === yesterday.getTime()) return 'Вчера'
    return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  }

  const fmtTime = (dt) => dt
    ? new Date(dt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : ''

  const fmtDate = (dt) => dt
    ? new Date(dt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : ''

  const grouped = groupByDate(filteredTxs, fmtGroupLabel)

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.35 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 36, paddingBottom: 80, maxWidth: 920 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800,
              letterSpacing: '-1.2px', color: 'var(--text-primary)', margin: 0,
            }}>
              Кошелёк
            </h1>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 10,
              background: 'rgba(127,119,221,0.07)', border: '0.5px solid rgba(127,119,221,0.18)',
              fontSize: 12, color: 'var(--text-muted)',
            }}>
              <i className="ti ti-info-circle" style={{ fontSize: 13, color: 'var(--accent)' }} />
              Пополнение — через администратора
            </div>
          </div>

          <div style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(127,119,221,0.15) 0%, rgba(13,13,24,0.95) 60%, rgba(29,158,117,0.07) 100%)'
              : 'linear-gradient(135deg, rgba(59,91,219,0.09) 0%, var(--bg-card) 60%, rgba(29,158,117,0.05) 100%)',
            border: '0.5px solid var(--border-hover)',
            borderRadius: 24, padding: '36px 40px', marginBottom: 16,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -60, right: -60, width: 200, height: 200,
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,119,221,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap', position: 'relative' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: 'rgba(127,119,221,0.2)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="ti ti-wallet" style={{ fontSize: 18, color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 500, lineHeight: 1 }}>
                      Доступный баланс
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {user?.full_name || 'Пользователь'}
                    </div>
                  </div>
                </div>
                {loading ? (
                  <div style={{ height: 60, display: 'flex', alignItems: 'center' }}>
                    <i className="ti ti-loader-2" style={{ fontSize: 28, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : (
                  <AmountDisplay value={wallet?.balance || 0} size={56} color="var(--text-primary)" />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{
                  background: 'rgba(239,159,39,0.08)', border: '0.5px solid rgba(239,159,39,0.28)',
                  borderRadius: 16, padding: '20px 24px', minWidth: 200,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(239,159,39,0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="ti ti-lock" style={{ fontSize: 13, color: '#EF9F27' }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 500 }}>
                      В эскроу
                    </span>
                  </div>
                  {loading ? (
                    <div style={{ height: 40 }} />
                  ) : (
                    <AmountDisplay value={wallet?.frozen || 0} size={32} prefix="$" color="#EF9F27" />
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                    Заморожено в активных проектах
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
              <StatCard
                icon="arrow-down-left"
                label="Получено"
                value={totalIncoming}
                color="var(--accent-green)"
                bg="rgba(29,158,117,0.06)"
                borderColor="rgba(29,158,117,0.2)"
              />
              <StatCard
                icon="arrow-up-right"
                label="Потрачено"
                value={totalOutgoing}
                color="#F87171"
                bg="rgba(248,113,113,0.06)"
                borderColor="rgba(248,113,113,0.2)"
              />
              <StatCard
                icon="receipt"
                label="Транзакций"
                value={transactions.length}
                color="var(--accent)"
                bg="rgba(127,119,221,0.06)"
                borderColor="rgba(127,119,221,0.2)"
                plain
              />
            </div>
          )}

          <div style={{
            background: 'var(--bg-card)', border: '0.5px solid var(--border)',
            borderRadius: 20, overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px 0',
              borderBottom: '0.5px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  История транзакций
                </h2>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {loading ? '...' : `${filteredTxs.length} операций`}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 4, paddingBottom: 0 }}>
                {FILTERS.map(f => {
                  const cnt    = filterCount(f.key)
                  const active = filter === f.key
                  return (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px 12px', borderRadius: '10px 10px 0 0',
                      background: active
                        ? (isDark ? 'rgba(127,119,221,0.12)' : 'rgba(59,91,219,0.07)')
                        : 'transparent',
                      border: 'none',
                      borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer',
                      transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}>
                      <i className={`ti ti-${f.icon}`} style={{ fontSize: 14 }} />
                      {f.label}
                      {cnt > 0 && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                          background: active ? 'rgba(127,119,221,0.18)' : 'rgba(255,255,255,0.06)',
                          color: active ? 'var(--accent)' : 'var(--text-muted)',
                        }}>{cnt}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {loading && (
              <div style={{ padding: '52px 24px', textAlign: 'center' }}>
                <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            {!loading && filteredTxs.length === 0 && (
              <div style={{ padding: '72px 24px', textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
                  background: 'rgba(127,119,221,0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="ti ti-receipt-off" style={{ fontSize: 28, color: 'var(--text-muted)', opacity: 0.4 }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Транзакций нет</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {filter !== 'all' ? 'В этой категории пока нет операций' : 'Ваши операции появятся здесь после первой оплаты'}
                </p>
              </div>
            )}

            {!loading && filteredTxs.length > 0 && (
              <div>
                {grouped.map((group, gi) => (
                  <div key={group.label}>
                    <div style={{
                      padding: '14px 24px 8px',
                      borderTop: gi > 0 ? '0.5px solid var(--border)' : 'none',
                    }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: 0.7, color: 'var(--text-muted)',
                      }}>
                        {group.label}
                      </span>
                    </div>

                    {group.items.map((tx, i) => {
                      const dir          = getDir(tx)
                      const amtInfo      = getAmountInfo(tx)
                      const counterparty = getCounterparty(tx)
                      const dirStyle     = getDirStyle(dir)
                      const meta         = STATUS_META[tx.status] || STATUS_META.frozen
                      const displayDate  = tx.status === 'released' && tx.released_at
                        ? fmtDate(tx.released_at)
                        : fmtDate(tx.created_at)
                      const displayTime  = tx.status === 'released' && tx.released_at
                        ? fmtTime(tx.released_at)
                        : fmtTime(tx.created_at)

                      return (
                        <div
                          key={tx.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '14px 24px',
                            borderTop: '0.5px solid var(--border)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.022)' : 'rgba(59,91,219,0.025)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                            background: dirStyle.bg, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <i className={`ti ti-${dirStyle.icon}`} style={{ fontSize: 19, color: dirStyle.color }} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Link
                              to={`/projects/${tx.project_id}`}
                              style={{
                                fontWeight: 600, fontSize: 14, color: 'var(--text-primary)',
                                textDecoration: 'none', display: 'block',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                transition: 'color 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
                            >
                              {tx.project_title || 'Проект'}
                            </Link>

                            {counterparty?.full_name && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                                <MiniAvatar src={counterparty.avatar_url} name={counterparty.full_name} />
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                  {counterparty.role}:
                                </span>
                                <Link
                                  to={`/profile/${counterparty.id}`}
                                  style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                >
                                  {counterparty.full_name}
                                </Link>
                              </div>
                            )}
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{
                              fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16,
                              color: amtInfo.color, letterSpacing: '-0.5px', lineHeight: 1,
                            }}>
                              {amtInfo.prefix}${amtInfo.value}
                            </div>
                            {amtInfo.sub && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                                {amtInfo.sub}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, justifyContent: 'flex-end' }}>
                              <span style={{
                                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
                                background: meta.bg, color: meta.color,
                              }}>
                                {meta.label}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {displayDate}{displayTime ? `, ${displayTime}` : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </div>
  )
}
