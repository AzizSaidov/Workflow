import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'
import { projectsApi } from '../api/projects'
import StarBackground from '../components/StarBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function deadlineInfo(deadline) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000)
  if (diff < 0)  return { label: `Просрочено на ${Math.abs(diff)} дн.`, color: '#F87171', bg: 'rgba(248,113,113,0.1)' }
  if (diff === 0) return { label: 'Сегодня дедлайн!', color: '#F87171', bg: 'rgba(248,113,113,0.1)' }
  if (diff <= 3)  return { label: `${diff} дн. до дедлайна`, color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' }
  if (diff <= 7)  return { label: `${diff} дн. до дедлайна`, color: '#FBBF24', bg: 'rgba(251,191,36,0.07)' }
  return { label: `${diff} дн. до дедлайна`, color: 'var(--accent-green)', bg: 'rgba(29,158,117,0.07)' }
}

function StatCard({ icon, value, label, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ti-${icon}`} style={{ fontSize: 19, color }} />
      </div>
      <div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

function WorkCard({ project, isDark, actions }) {
  const dl     = deadlineInfo(project.deadline)
  const budget = Number(project.budget_max || project.budget_min || 0)
  const prog   = project.progress_percent || 0

  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Progress bar top */}
      {project.status === 'in_progress' && (
        <div style={{ height: 3, background: 'var(--border)', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${prog}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-teal))', borderRadius: '0 2px 2px 0', transition: 'width 0.5s ease' }} />
        </div>
      )}

      <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* Left: info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
            >{project.title}</div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {dl && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: dl.color, background: dl.bg, padding: '2px 9px', borderRadius: 20 }}>
                <i className="ti ti-clock" style={{ fontSize: 11 }} />{dl.label}
              </span>
            )}
            {project.status === 'in_progress' && prog > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Прогресс: <b style={{ color: 'var(--accent)' }}>{prog}%</b>
              </span>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-calendar" style={{ fontSize: 11 }} />
              {new Date(project.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>

        {/* Budget */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--accent-green)' }}>$</span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--accent-green)' }}>{budget.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>бюджет</div>
        </div>

        {/* Actions */}
        {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  )
}

function SectionHeader({ icon, color, title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`ti ti-${icon}`} style={{ fontSize: 16, color }} />
      </div>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 9px', borderRadius: 20 }}>{count}</span>
    </div>
  )
}

export default function MyWork() {
  const { isDark } = useThemeStore()
  const { user }   = useAuthStore()
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    projectsApi.getMine()
      .then(r => setProjects((r.data || []).filter(p => p.assigned_freelancer_id === user?.id)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id])

  const inProgress = projects.filter(p => p.status === 'in_progress')
  const delivered  = projects.filter(p => p.status === 'delivered')
  const completed  = projects.filter(p => p.status === 'completed')
  const totalEarned = completed.reduce((sum, p) => sum + Number(p.budget_max || p.budget_min || 0) * 0.99, 0)

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" style={{ opacity: 0.3 }} />
      <Navbar />

      <div style={{ paddingTop: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ paddingTop: 36, paddingBottom: 80, maxWidth: 900 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--text-primary)', marginBottom: 6 }}>
              Мои работы
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Все проекты в которых ты участвуешь</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <i className="ti ti-loader-2" style={{ fontSize: 32, color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 22 }}>
              <i className="ti ti-briefcase-off" style={{ fontSize: 52, color: 'var(--text-muted)', display: 'block', marginBottom: 16, opacity: 0.3 }} />
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Пока нет активных работ</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Подай заявку на понравившийся проект</p>
              <Link to="/projects"><button className="btn btn-primary"><i className="ti ti-search" style={{ fontSize: 14 }} /> Найти проекты</button></Link>
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
                <StatCard icon="clock" value={inProgress.length} label="В работе" color="var(--accent)" />
                <StatCard icon="package" value={delivered.length} label="На проверке" color="#FBBF24" />
                <StatCard icon="circle-check" value={completed.length} label="Завершено" color="var(--accent-green)" />
                <StatCard
                  icon="wallet"
                  value={`$${totalEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  label="Заработано"
                  color="var(--accent-teal)"
                />
              </div>

              {/* В работе */}
              {inProgress.length > 0 && (
                <div style={{ marginBottom: 36 }}>
                  <SectionHeader icon="clock" color="var(--accent)" title="В работе" count={inProgress.length} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {inProgress.map(p => (
                      <WorkCard key={p.id} project={p} isDark={isDark} actions={
                        <>
                          <Link to={`/projects/${p.id}`}>
                            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 9, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              <i className="ti ti-send" style={{ fontSize: 13 }} /> Сдать
                            </button>
                          </Link>
                          <Link to={`/chats?project=${p.id}`}>
                            <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 9, background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.3)', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                              <i className="ti ti-messages" style={{ fontSize: 13 }} /> Чат
                            </button>
                          </Link>
                        </>
                      } />
                    ))}
                  </div>
                </div>
              )}

              {/* На проверке */}
              {delivered.length > 0 && (
                <div style={{ marginBottom: 36 }}>
                  <SectionHeader icon="package" color="#FBBF24" title="На проверке у заказчика" count={delivered.length} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {delivered.map(p => (
                      <WorkCard key={p.id} project={p} isDark={isDark} actions={
                        <Link to={`/projects/${p.id}`}>
                          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 9, background: 'transparent', border: '0.5px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                            <i className="ti ti-eye" style={{ fontSize: 13 }} /> Подробнее
                          </button>
                        </Link>
                      } />
                    ))}
                  </div>
                </div>
              )}

              {/* Завершённые */}
              {completed.length > 0 && (
                <div>
                  <SectionHeader icon="circle-check" color="var(--accent-green)" title="Завершённые" count={completed.length} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {completed.map(p => {
                      const earned = Number(p.budget_max || p.budget_min || 0) * 0.99
                      return (
                        <div key={p.id} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Link to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{p.title}</div>
                            </Link>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {new Date(p.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, justifyContent: 'flex-end' }}>
                              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--accent-green)' }}>$</span>
                              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--accent-green)' }}>{earned.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>получено (−1%)</div>
                          </div>
                          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(29,158,117,0.1)', color: 'var(--accent-green)', flexShrink: 0 }}>
                            Завершён
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
