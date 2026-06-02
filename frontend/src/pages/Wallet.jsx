import { useEffect, useState } from 'react'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import useToastStore from '../store/toastStore'
import { walletApi } from '../api/wallet'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/Button'
import Tag from '../components/Tag'

const STATUS_INFO = {
  frozen:   { color: 'amber', label: 'Заморожено' },
  released: { color: 'green', label: 'Выплачено' },
  refunded: { color: 'purple', label: 'Возврат' },
  disputed: { color: 'red',   label: 'Спор' },
}

export default function Wallet() {
  const { isDark } = useThemeStore()
  const { user } = useAuthStore()
  const toast = useToastStore(s => s.show)
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      walletApi.get(),
      walletApi.getTransactions(),
    ]).then(([w, t]) => {
      setWallet(w.data)
      setTransactions(t.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const isClient = (tx) => tx.client_id === user?.id
  const txType = (tx) => isClient(tx) ? 'Оплата проекта' : 'Получение оплаты'
  const txSign = (tx) => {
    if (tx.status === 'released') return isClient(tx) ? '-' : '+'
    return ''
  }
  const txColor = (tx) => {
    if (tx.status === 'released') return isClient(tx) ? '#F87171' : 'var(--accent-green)'
    return 'var(--text-muted)'
  }

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.4 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 36, paddingBottom: 80, maxWidth: 900 }}>

          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--text-primary)', marginBottom: 32 }}>
            Кошелёк
          </h1>

          {/* Balance — main card full width */}
          <div style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(127,119,221,0.13) 0%, rgba(13,13,24,0.9) 100%)'
              : 'linear-gradient(135deg, rgba(80,72,213,0.08) 0%, var(--bg-card) 100%)',
            border: '0.5px solid var(--border-hover)',
            borderRadius: 22, padding: '32px 36px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
              {/* Available balance */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(127,119,221,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-wallet" style={{ fontSize: 18, color: 'var(--accent)' }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 }}>
                    Доступно
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.5px', lineHeight: 1 }}>
                    $
                  </span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 56, fontWeight: 800, letterSpacing: '-3px', color: 'var(--text-primary)', lineHeight: 1 }}>
                    {loading ? '—' : Number(wallet?.balance || 0).toLocaleString()}
                  </span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 2 }}>
                    .00
                  </span>
                </div>
              </div>

              {/* Frozen + info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 180 }}>
                <div style={{ background: 'rgba(239,159,39,0.08)', border: '0.5px solid rgba(239,159,39,0.25)', borderRadius: 14, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <i className="ti ti-lock" style={{ fontSize: 15, color: '#EF9F27' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 }}>
                      В эскроу
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#EF9F27' }}>$</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-1.5px', color: '#EF9F27', lineHeight: 1 }}>
                      {loading ? '—' : Number(wallet?.frozen || 0).toLocaleString()}
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

          {/* Transactions */}
          <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                История транзакций
              </h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{transactions.length} операций</span>
            </div>

            {loading ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <i className="ti ti-loader-2" style={{ fontSize: 28, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <i className="ti ti-receipt-off" style={{ fontSize: 44, color: 'var(--text-muted)', display: 'block', marginBottom: 14, opacity: 0.3 }} />
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Транзакций пока нет</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                    {['Тип', 'Сумма', 'Статус', 'Дата'].map(h => (
                      <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => {
                    const st = STATUS_INFO[tx.status] || { color: 'muted', label: tx.status }
                    return (
                      <tr key={tx.id} style={{ borderBottom: i < transactions.length - 1 ? '0.5px solid var(--border)' : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(80,72,213,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 24px', fontSize: 14, color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className={`ti ti-${isClient(tx) ? 'arrow-up-right' : 'arrow-down-left'}`}
                              style={{ fontSize: 15, color: isClient(tx) ? '#F87171' : 'var(--accent-green)' }} />
                            {txType(tx)}
                          </div>
                        </td>
                        <td style={{ padding: '14px 24px', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: txColor(tx) }}>
                          {txSign(tx)}${Number(tx.amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 24px' }}>
                          <Tag color={st.color}>{st.label}</Tag>
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: 13, color: 'var(--text-muted)' }}>
                          {new Date(tx.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
