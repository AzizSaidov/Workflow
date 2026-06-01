import { useEffect, useState } from 'react'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
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

          {/* Balance cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 36 }}>
            {/* Main balance */}
            <div style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(127,119,221,0.15) 0%, rgba(13,13,24,0.8) 100%)'
                : 'linear-gradient(135deg, rgba(80,72,213,0.1) 0%, #FFFFFF 100%)',
              border: '0.5px solid var(--border-hover)',
              borderRadius: 20, padding: '28px 28px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(127,119,221,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-wallet" style={{ fontSize: 20, color: 'var(--accent)' }} />
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Доступный баланс</span>
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800, letterSpacing: '-2px', color: 'var(--text-primary)' }}>
                {loading ? '—' : Number(wallet?.balance || 0).toLocaleString()}
                <span style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>TJS</span>
              </div>
              <div style={{ marginTop: 20 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(127,119,221,0.06)',
                  border: '0.5px solid rgba(127,119,221,0.15)',
                  fontSize: 12, color: 'var(--text-muted)',
                }}>
                  <i className="ti ti-info-circle" style={{ fontSize: 14, color: 'var(--accent)', flexShrink: 0 }} />
                  Для пополнения баланса обратитесь к администратору
                </div>
              </div>
            </div>

            {/* Frozen */}
            <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 20, padding: '28px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,159,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-lock" style={{ fontSize: 20, color: '#EF9F27' }} />
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>В эскроу</span>
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800, letterSpacing: '-2px', color: '#EF9F27' }}>
                {loading ? '—' : Number(wallet?.frozen || 0).toLocaleString()}
                <span style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>TJS</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20, lineHeight: 1.6 }}>
                Средства заморожены до завершения проекта
              </p>
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
                          {txSign(tx)}{Number(tx.amount).toLocaleString()} TJS
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
