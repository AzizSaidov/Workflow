import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { achievementsApi } from '../api/achievements'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const CATEGORY_TABS = [
  { key: 'all',        label: 'Все',        icon: 'apps' },
  { key: 'freelancer', label: 'Фрилансер',  icon: 'code' },
  { key: 'client',     label: 'Заказчик',   icon: 'building' },
  { key: 'general',    label: 'Общие',      icon: 'star' },
]

function AchievementCard({ ach, earned, earnedAt }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: earned ? `${ach.color}0D` : 'var(--bg-card)',
        border: `0.5px solid ${earned ? `${ach.color}55` : 'var(--border)'}`,
        borderRadius: 16,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        opacity: earned ? 1 : 0.55,
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov && earned ? `0 8px 24px ${ach.color}22` : 'none',
      }}
    >
      {/* Glow blob for earned */}
      {earned && (
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: `${ach.color}1A`, filter: 'blur(20px)', pointerEvents: 'none',
        }} />
      )}

      {/* Top row: icon + points */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13,
          background: earned ? `${ach.color}22` : 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <i
            className={`ti ti-${earned ? ach.icon : 'lock'}`}
            style={{ fontSize: 22, color: earned ? ach.color : 'var(--text-muted)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif',
            color: earned ? ach.color : 'var(--text-muted)',
            background: earned ? `${ach.color}18` : 'rgba(255,255,255,0.04)',
            padding: '2px 8px', borderRadius: 20,
          }}>
            +{ach.points} pts
          </span>
          {earned && earnedAt && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {new Date(earnedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <div>
        <div style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
          color: earned ? 'var(--text-primary)' : 'var(--text-secondary)',
          marginBottom: 5, lineHeight: 1.2,
        }}>
          {ach.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {ach.description}
        </div>
      </div>

      {/* Status badge */}
      <div style={{ marginTop: 'auto' }}>
        {earned ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600,
            color: ach.color, background: `${ach.color}18`,
            padding: '3px 10px', borderRadius: 20,
          }}>
            <i className="ti ti-circle-check" style={{ fontSize: 12 }} /> Получено
          </span>
        ) : (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.04)',
            padding: '3px 10px', borderRadius: 20,
          }}>
            <i className="ti ti-lock" style={{ fontSize: 12 }} /> Не получено
          </span>
        )}
      </div>
    </div>
  )
}

export default function Achievements() {
  const { isDark } = useThemeStore()
  const { user }   = useAuthStore()

  const [allAch,    setAllAch]    = useState([])
  const [myAch,     setMyAch]     = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const p1 = achievementsApi.getAll().then(r => setAllAch(r.data || [])).catch(() => {})
    const p2 = user
      ? achievementsApi.getMine().then(r => setMyAch(r.data || [])).catch(() => {})
      : Promise.resolve()
    Promise.all([p1, p2]).finally(() => setLoading(false))
  }, [user?.id])

  const earnedMap = {}
  myAch.forEach(ua => {
    earnedMap[ua.achievement.key] = ua.earned_at
  })

  const filtered = activeTab === 'all'
    ? allAch
    : allAch.filter(a => a.category === activeTab)

  const totalPts  = myAch.reduce((s, ua) => s + (ua.achievement?.points || 0), 0)
  const earnedCnt = myAch.length

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.25 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 1080 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--text-primary)', marginBottom: 6 }}>
                Достижения
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {allAch.length} достижений на платформе · выполняй задачи и получай награды
              </p>
            </div>

            {/* Progress card (only if logged in) */}
            {user && !loading && (
              <div style={{
                background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                borderRadius: 16, padding: '16px 22px',
                display: 'flex', alignItems: 'center', gap: 20,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: 'var(--accent)', lineHeight: 1 }}>
                    {earnedCnt}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>получено</div>
                </div>
                <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: '#EF9F27', lineHeight: 1 }}>
                    {totalPts.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>очков</div>
                </div>
                <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: 'var(--accent-teal)', lineHeight: 1 }}>
                    {allAch.length > 0 ? Math.round((earnedCnt / allAch.length) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>прогресс</div>
                </div>
              </div>
            )}

            {!user && (
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ fontSize: 13 }}>
                  <i className="ti ti-login" style={{ fontSize: 14 }} /> Войти чтобы отслеживать
                </button>
              </Link>
            )}
          </div>

          {/* Progress bar (logged in) */}
          {user && !loading && allAch.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((earnedCnt / allAch.length) * 100)}%`,
                  background: 'linear-gradient(90deg, var(--accent), var(--accent-teal))',
                  borderRadius: 6, transition: 'width 0.8s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{earnedCnt} из {allAch.length}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{allAch.length - earnedCnt} осталось</span>
              </div>
            </div>
          )}

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {CATEGORY_TABS.map(t => {
              const count = t.key === 'all' ? allAch.length : allAch.filter(a => a.category === t.key).length
              const earnedInTab = t.key === 'all'
                ? earnedCnt
                : myAch.filter(ua => ua.achievement?.category === t.key).length
              const active = activeTab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                    background: active ? 'var(--accent)' : 'var(--bg-card)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    outline: active ? 'none' : '0.5px solid var(--border)',
                  }}
                >
                  <i className={`ti ti-${t.icon}`} style={{ fontSize: 14 }} />
                  {t.label}
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                    padding: '1px 7px', borderRadius: 20, marginLeft: 2,
                    color: active ? '#fff' : 'var(--text-muted)',
                  }}>
                    {user ? `${earnedInTab}/${count}` : count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              Нет достижений в этой категории
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {filtered
                .sort((a, b) => {
                  const aE = a.key in earnedMap ? 1 : 0
                  const bE = b.key in earnedMap ? 1 : 0
                  if (aE !== bE) return bE - aE
                  return a.points - b.points
                })
                .map(ach => (
                  <AchievementCard
                    key={ach.id}
                    ach={ach}
                    earned={ach.key in earnedMap}
                    earnedAt={earnedMap[ach.key]}
                  />
                ))
              }
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
