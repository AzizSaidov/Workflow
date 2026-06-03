import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { walletApi } from '../api/wallet'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const FILTERS = [
  { key: 'all',      label: 'Все',         icon: 'layout-list' },
  { key: 'incoming', label: 'Пополнения',  icon: 'arrow-down-left' },
  { key: 'outgoing', label: 'Списания',    icon: 'arrow-up-right' },
  { key: 'escrow',   label: 'Эскроу',      icon: 'lock' },
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
      width: 22, height: 22, borderRadius: '50%', objectFit: 'cover',
      border: '1.5px solid var(--border)', flexShrink: 0,
    }} />
  )
  return (
    <div style={{
      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(127,119,221,0.22)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: 9, fontWeight: 700, color: 'var(--accent)',
      border: '1.5px solid var(--border)',
    }}>{initials}</div>
  )
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
      return { prefix: '+', value: net, color: 'var(--accent-green)', sub: `−$${fee} комиссия платформы` }
    }
    if (dir === 'out')       return { prefix: '−', value: amt.toFixed(2), color: '#F87171',             sub: null }
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
    if (dir === 'frozen')    return { icon: 'lock',             bg: 'rgba(239,159,39,0.14)',    color: '#EF9F27' }
    if (dir === 'out')       return { icon: 'arrow-up-right',   bg: 'rgba(248,113,113,0.14)',   color: '#F87171' }
    if (dir === 'in')        return { icon: 'arrow-down-left',  bg: 'rgba(29,158,117,0.14)',    color: 'var(--accent-green)' }
    if (dir === 'refund_in') return { icon: 'arrow-back-up',    bg: 'rgba(127,119,221,0.14)',   color: 'var(--accent)' }
    return                          { icon: 'minus',             bg: 'rgba(255,255,255,0.06)',   color: 'var(--text-muted)' }
  }

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

  const filteredTxs = transactions.filter(tx => {
    const dir = getDir(tx)
    if (filter === 'incoming') return dir === 'in' || dir === 'refund_in'
    if (filter === 'outgoing') return dir === 'out'
    if (filter === 'escrow')   return dir === 'frozen'
    return true
  })

  const fmtDate = (dt) => dt
    ? new Date(dt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  // balance split
  const balRaw   = loading ? null : Number(wallet?.balance || 0)
  const balInt   = balRaw !== null ? Math.floor(balRaw).toLocaleString('ru-RU') : '—'
  const balCents = balRaw !== null ? String(Math.round((balRaw % 1) * 100)).padStart(2, '0') : '00'

  const frozenRaw   = loading ? null : Number(wallet?.frozen || 0)
  const frozenInt   = frozenRaw !== null ? Math.floor(frozenRaw).toLocaleString('ru-RU') : '—'
  const frozenCents = frozenRaw !== null ? String(Math.round((frozenRaw % 1) * 100)).padStart(2, '0') : '00'

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 36, paddingBottom: 80, maxWidth: 900 }}>

          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800,
            letterSpacing: '-1.2px', color: 'var(--text-primary)', marginBottom: 32,
          }}>
            Кошелёк
          </h1>

          {/* ── Balance card ──────────────────────────────────────────── */}
          <div style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(127,119,221,0.13) 0%, rgba(13,13,24,0.9) 100%)'
              : 'linear-gradient(135deg, rgba(80,72,213,0.08) 0%, var(--bg-card) 100%)',
            border: '0.5px solid var(--border-hover)',
            borderRadius: 22, padding: '32px 36px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>

              {/* Available balance */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(127,119,221,0.2)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="ti ti-wallet" style={{ fontSize: 18, color: 'var(--accent)' }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 }}>
                    Доступный баланс
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>$</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 56, fontWeight: 800, letterSpacing: '-3px', color: 'var(--text-primary)', lineHeight: 1 }}>
                    {balInt}
                  </span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 1 }}>
                    .{balCents}
                  </span>
                </div>
              </div>

              {/* Frozen + tip */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 190 }}>
                <div style={{
                  background: 'rgba(239,159,39,0.08)', border: '0.5px solid rgba(239,159,39,0.25)',
                  borderRadius: 14, padding: '16px 20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <i className="ti ti-lock" style={{ fontSize: 15, color: '#EF9F27' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 }}>
                      В эскроу
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#EF9F27' }}>$</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800, letterSpacing: '-1.5px', color: '#EF9F27', lineHeight: 1 }}>
                      {frozenInt}
                    </span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 400, color: 'rgba(239,159,39,0.6)' }}>
                      .{frozenCents}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                    Заморожено в активных проектах
                  </p>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(127,119,221,0.06)', border: '0.5px solid rgba(127,119,221,0.15)',
                  fontSize: 12, color: 'var(--text-muted)',
                }}>
                  <i className="ti ti-info-circle" style={{ fontSize: 14, color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                  Для пополнения обратитесь к администратору
                </div>
              </div>
            </div>
          </div>

          {/* ── Filter tabs ───────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {FILTERS.map(f => {
              const cnt    = filterCount(f.key)
              const active = filter === f.key
              return (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 16px', borderRadius: 10,
                  background: active ? 'var(--accent)' : 'var(--bg-card)',
                  border: active ? '0.5px solid var(--accent)' : '0.5px solid var(--border)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                  <i className={`ti ti-${f.icon}`} style={{ fontSize: 14 }} />
                  {f.label}
                  {cnt > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
                      background: active ? 'rgba(255,255,255,0.22)' : 'rgba(127,119,221,0.15)',
                      color: active ? '#fff' : 'var(--accent)',
                    }}>{cnt}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Transaction list ──────────────────────────────────────── */}
          <div style={{
            background: 'var(--bg-card)', border: '0.5px solid var(--border)',
            borderRadius: 18, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px', borderBottom: '0.5px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                История транзакций
              </h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {loading ? '...' : `${filteredTxs.length} операций`}
              </span>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ padding: '52px 24px', textAlign: 'center' }}>
                <i className="ti ti-loader-2" style={{ fontSize: 30, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            {/* Empty */}
            {!loading && filteredTxs.length === 0 && (
              <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                <i className="ti ti-receipt-off" style={{ fontSize: 46, color: 'var(--text-muted)', display: 'block', marginBottom: 14, opacity: 0.25 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Транзакций нет</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {filter !== 'all' ? 'В этой категории пока нет операций' : 'Ваши операции появятся здесь после первой оплаты'}
                </p>
              </div>
            )}

            {/* Rows */}
            {!loading && filteredTxs.length > 0 && (
              <div>
                {filteredTxs.map((tx, i) => {
                  const dir          = getDir(tx)
                  const amtInfo      = getAmountInfo(tx)
                  const counterparty = getCounterparty(tx)
                  const dirStyle     = getDirStyle(dir)
                  const meta         = STATUS_META[tx.status] || STATUS_META.frozen
                  const displayDate  = tx.status === 'released' && tx.released_at
                    ? fmtDate(tx.released_at)
                    : fmtDate(tx.created_at)

                  return (
                    <div
                      key={tx.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '18px 24px',
                        borderBottom: i < filteredTxs.length - 1 ? '0.5px solid var(--border)' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(80,72,213,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Direction icon */}
                      <div style={{
                        width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                        background: dirStyle.bg, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className={`ti ti-${dirStyle.icon}`} style={{ fontSize: 20, color: dirStyle.color }} />
                      </div>

                      {/* Project + counterparty */}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                            <MiniAvatar src={counterparty.avatar_url} name={counterparty.full_name} />
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {counterparty.role}:
                            </span>
                            <Link
                              to={`/profile/${counterparty.id}`}
                              style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                              {counterparty.full_name}
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Amount + status + date */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17,
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
                            {displayDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </div>
  )
}
